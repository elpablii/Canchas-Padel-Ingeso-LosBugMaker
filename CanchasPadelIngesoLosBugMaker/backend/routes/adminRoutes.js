const express = require('express');
const router = express.Router();
const { Reserva, User, Cancha, Jugador, Equipamiento, sequelize } = require('../models'); 
const { notificarATodos } = require('../services/notificacionService');
const moment = require('moment-timezone');
// --- CORRECCIÓN: Se usan solo los middlewares necesarios y estándar ---
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { enviarEmailConfirmacion } = require('../services/emailService');

// Se elimina el router.use() global para aplicar la seguridad explícitamente en cada ruta.

/**
 * @route   GET /api/admin/reservas
 * @desc    Obtener el historial completo de todas las reservas
 * @access  Private (Admin)
 */
router.get('/reservas', [verificarToken, verificarAdmin], async (req, res) => {
  try {
    const todasLasReservas = await Reserva.findAll({
      include: [ 
        { model: User, as: 'usuario', attributes: ['rut', 'nombre', 'email', 'saldo'] },
        { model: Cancha, as: 'cancha', attributes: ['id', 'nombre', 'costo'] }
      ],
      order: [['fechaReserva', 'DESC'], ['horaInicio', 'DESC']] 
    });
    res.status(200).json(todasLasReservas);
  } catch (error) {
    console.error('Error en GET /api/admin/reservas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


/**
 * @route   GET /api/admin/users
 * @desc    Obtener todos los usuarios registrados
 * @access  Private (Admin)
 */
router.get('/users', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }, 
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error en GET /api/admin/users:', error);
        res.status(500).json({ message: 'Error al obtener la lista de usuarios.' });
    }
});


/**
 * @route   POST /api/admin/canchas
 * @desc    Registrar una nueva cancha
 * @access  Private (Admin)
 */
router.post('/canchas', [verificarToken, verificarAdmin], async (req, res) => {
  try {
    const { nombre, costo } = req.body;
    if (!nombre || costo === undefined) {
      return res.status(400).json({ message: 'El nombre y el costo son obligatorios.' });
    }
    const nuevaCancha = await Cancha.create({ nombre: nombre.trim(), costo: Number(costo) });
    // Aquí podrías llamar a notificarATodos si lo deseas
    res.status(201).json({ message: 'Cancha registrada exitosamente.', cancha: nuevaCancha });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Ya existe una cancha con ese nombre.' });
    }
    console.error('Error al registrar cancha:', error);
    res.status(500).json({ message: 'Error interno al registrar la cancha.' });
  }
});

// Enviar notificación a todos los usuarios
router.post('/notificaciones', [verificarToken, verificarAdmin], async (req, res) => {
  const { mensaje } = req.body;
  if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
    return res.status(400).json({ mensaje: 'El mensaje es requerido.' });
  }
  try {
    await notificarATodos('OTRO', mensaje.trim());
    res.json({ mensaje: 'Notificación enviada a todos los usuarios.' });
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    res.status(500).json({ mensaje: 'Error interno al enviar la notificación.' });
  }
});

// Bloquear un horario
router.post('/bloquear', [verificarToken, verificarAdmin], async (req, res) => {
    const { fecha, horaInicio, horaTermino, canchaId } = req.body;

    if (!fecha || !horaInicio || !horaTermino || !canchaId) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const transaction = await sequelize.transaction();
    try {
        const canchasABloquear = [];
        if (canchaId === 'todas') {
            const todasLasCanchas = await Cancha.findAll({ transaction });
            canchasABloquear.push(...todasLasCanchas.map(c => c.id));
        } else {
            canchasABloquear.push(parseInt(canchaId, 10));
        }

        for (const id of canchasABloquear) {
            await Reserva.create({
                fecha,
                horaInicio,
                horaTermino,
                canchaId: id,
                userRut: req.user.rut, // Ahora req.user está definido por el middleware
                estadoReserva: 'CanceladaPorAdmin',
                requiereEquipamiento: false,
                costoEquipamiento: 0,
                costoTotalReserva: 0
            }, { transaction });
        }

        await transaction.commit();
        res.status(201).json({ message: 'Horario bloqueado exitosamente.' });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error al bloquear horario:', error);
        res.status(500).json({ message: 'Error interno al bloquear el horario.' });
    }
});

// Desbloquear un horario
router.delete('/reservas/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findByPk(id);

        if (!reserva) {
            return res.status(404).json({ message: 'Reserva o bloqueo no encontrado.' });
        }

        if (reserva.estadoReserva !== 'CanceladaPorAdmin') {
            return res.status(403).json({ message: 'No se puede eliminar una reserva de usuario. Solo bloqueos.' });
        }

        await reserva.destroy();
        res.status(200).json({ message: 'Bloqueo eliminado exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar bloqueo:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/reservas', [verificarToken, verificarAdmin], async (req, res) => {
    const { canchaId, fecha, horaInicio, horaTermino, requiereEquipamiento, userRut, jugadores } = req.body;

    if (!userRut) {
        return res.status(400).json({ message: 'Se debe especificar el RUT del usuario para la reserva.' });
    }

    const transaction = await sequelize.transaction();
    try {
        const cancha = await Cancha.findByPk(canchaId, { transaction });
        const user = await User.findByPk(userRut, { transaction });

        if (!cancha || !user) {
            await transaction.rollback();
            return res.status(404).json({ message: 'El usuario o la cancha especificada no existen.' });
        }

        const duracionMinutos = moment.duration(moment(horaTermino, 'HH:mm').diff(moment(horaInicio, 'HH:mm'))).asMinutes();
        const costoTotal = ((duracionMinutos / 60) * 15000) + (requiereEquipamiento ? 5000 : 0);

        if (user.saldo < costoTotal) {
            await transaction.rollback();
            return res.status(402).json({ message: `El usuario no tiene saldo suficiente.` });
        }

        await user.decrement('saldo', { by: costoTotal, transaction });

        const nuevaReserva = await Reserva.create({
            canchaId, userRut, fecha, horaInicio, horaTermino, requiereEquipamiento,
            costoEquipamiento: requiereEquipamiento ? 5000 : 0,
            costoTotalReserva: costoTotal,
            estadoReserva: 'Confirmada' 
        }, { transaction });

        if (jugadores && jugadores.length > 0) {
            const jugadoresParaCrear = jugadores.map(jugador => ({ ...jugador, reservaId: nuevaReserva.id }));
            await Jugador.bulkCreate(jugadoresParaCrear, { transaction });
        }

        await transaction.commit();
        res.status(201).json({ message: 'Reserva creada exitosamente por el administrador.', reserva: nuevaReserva });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error del admin al crear reserva:', error);
        res.status(500).json({ message: 'Error interno al crear la reserva.' });
    }
});

router.put('/reservas/:id/cancelar', [verificarToken, verificarAdmin], async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const reserva = await Reserva.findByPk(id, { transaction });

        if (!reserva) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        if (reserva.estadoReserva.startsWith('Cancelada')) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Esta reserva ya está cancelada.' });
        }
        

        reserva.estadoReserva = 'CanceladaPorAdmin';
        await reserva.save({ transaction });
        
        const usuario = await User.findByPk(reserva.userRut, { transaction });
        if (usuario && reserva.costoTotalReserva > 0) {
            await usuario.increment('saldo', { by: reserva.costoTotalReserva, transaction });
        }
        
        await transaction.commit();
        res.json({ message: 'Reserva cancelada exitosamente por el admin.', reserva });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error del admin al cancelar reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/reservas/:id/confirmar', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await Reserva.findByPk(id);

        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        if (reserva.estadoReserva !== 'Pendiente') {
            return res.status(400).json({ message: 'Solo se pueden confirmar reservas pendientes.' });
        }

        reserva.estadoReserva = 'Confirmada';
        await reserva.save();
        res.json({ message: 'Reserva confirmada por el admin.', reserva });
    } catch (error) {
        console.error('Error del admin al confirmar reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// GESTIÓN DE INVENTARIO DE EQUIPAMIENTO 

/**
 * @route   GET /api/admin/equipamiento
 * @desc    Obtener todo el inventario de equipamiento
 * @access  Private (Admin)
 */
router.get('/equipamiento', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const inventario = await Equipamiento.findAll({ order: [['tipo', 'ASC'], ['nombre', 'ASC']] });
        res.status(200).json(inventario);
    } catch (error) {
        console.error('Error al obtener el inventario de equipamiento:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

/**
 * @route   POST /api/admin/equipamiento
 * @desc    Añadir un nuevo artículo al inventario
 * @access  Private (Admin)
 */
router.post('/equipamiento', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { nombre, tipo, stock, costo } = req.body;
        if (!nombre || !tipo || stock === undefined || costo === undefined) {
            return res.status(400).json({ message: 'Nombre, tipo, stock y costo son requeridos.' });
        }
        
        const nombreEstandarizado = nombre.trim().toUpperCase();

        const nuevoArticulo = await Equipamiento.create({ 
            nombre: nombreEstandarizado, // Se usa el nombre estandarizado
            tipo, 
            stock, 
            costo 
        });
        
        res.status(201).json(nuevoArticulo);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Ya existe un artículo con ese nombre.' });
        }
        console.error('Error al añadir equipamiento:', error);
        res.status(500).json({ message: 'Error interno al crear el artículo.' });
    }
});
/**
 * @route   PUT /api/admin/equipamiento/:id
 * @desc    Actualizar un artículo del inventario
 * @access  Private (Admin)
 */
router.put('/equipamiento/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, stock, costo } = req.body;
        
        const articulo = await Equipamiento.findByPk(id);
        if (!articulo) {
            return res.status(404).json({ message: 'Artículo de equipamiento no encontrado.' });
        }

        articulo.nombre = nombre || articulo.nombre;
        articulo.tipo = tipo || articulo.tipo;
        articulo.stock = stock !== undefined ? stock : articulo.stock;
        articulo.costo = costo !== undefined ? costo : articulo.costo;
        
        await articulo.save();
        res.status(200).json(articulo);
    } catch (error) {
        console.error('Error al actualizar equipamiento:', error);
        res.status(500).json({ message: 'Error interno al actualizar el artículo.' });
    }
});

/**
 * @route   DELETE /api/admin/equipamiento/:id
 * @desc    Eliminar un artículo del inventario
 * @access  Private (Admin)
 */
router.delete('/equipamiento/:id', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const articulo = await Equipamiento.findByPk(id);
        if (!articulo) {
            return res.status(404).json({ message: 'Artículo de equipamiento no encontrado.' });
        }

        await articulo.destroy();
        res.status(200).json({ message: 'Artículo eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar equipamiento:', error);
        res.status(500).json({ message: 'Error interno al eliminar el artículo.' });
    }
});

module.exports = router;