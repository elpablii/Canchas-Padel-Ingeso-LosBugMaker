const express = require('express');
const router = express.Router();
const { Reserva, User, Cancha, Jugador, Equipamiento, sequelize } = require('../models'); 
const { notificarATodos } = require('../services/notificacionService');
const moment = require('moment-timezone');
const { devolverStockDeReserva } = require('../utils/inventarioUtils'); 
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const { enviarEmailConfirmacion } = require('../services/emailService');
const TIMEZONE = 'America/Santiago';


const validarRutChileno = (rutCompleto) => {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rutCompleto)) return false;
    const [rutNum, dv] = rutCompleto.split('-');
    let M = 0, S = 1;
    for (let i = rutNum.length - 1; i >= 0; i--) {
        S = (S + parseInt(rutNum.charAt(i)) * (9 - M++ % 6)) % 11;
    }
    const dvCalculado = S ? (S - 1).toString() : 'k';
    return dvCalculado === dv.toLowerCase();
};

// Se elimina el router.use() global para aplicar la seguridad explícitamente en cada ruta.

/**
 * @route   GET /api/admin/reservas
 * @desc    Obtener el historial completo de todas las reservas
 * @access  Private (Admin)
 */
router.get('/reservas', [verificarToken, verificarAdmin], async (req, res) => {
    try {
        const historialReservas = await Reserva.findAll({
            include: [
                {
                    model: Cancha,
                    as: 'cancha',
                    attributes: ['nombre']
                },
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['nombre', 'email']
                },
                {
                    model: Equipamiento,
                    as: 'equipamientosRentados',
                    attributes: ['nombre'],
                    through: {
                        attributes: ['cantidad'] 
                    }
                }
            ],
            
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(historialReservas);

    } catch (error) {
        console.error("Error al obtener el historial de reservas:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener el historial." });
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
    const { nombre, costo, maxJugadores } = req.body;

    if (!nombre || costo === undefined || maxJugadores === undefined) {
      return res.status(400).json({ message: 'El nombre, el costo y el máximo de jugadores son obligatorios.' });
    }

    const maxJugadoresNum = Number(maxJugadores);
    if (isNaN(maxJugadoresNum) || maxJugadoresNum < 1 || maxJugadoresNum >= 100) {
        return res.status(400).json({ message: 'El máximo de jugadores debe ser un número entre 2 y 99.' });
    }
    
    const nuevaCancha = await Cancha.create({ 
      nombre: nombre.trim(), 
      costo: Number(costo),
      maxJugadores: maxJugadoresNum
    });

    await notificarATodos("NUEVA_CANCHA", `Se ha añadido una nueva Cancha: ${nombre}. Ya está disponible para reservar`);
    res.status(201).json({ message: 'Cancha registrada exitosamente.', cancha: nuevaCancha });

  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const mensajes = error.errors.map(err => err.message);
      return res.status(400).json({ message: 'Error de validación', errors: mensajes });
    }
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
        let canchasIds = [];
        if (canchaId === 'todas') {
            const todasLasCanchas = await Cancha.findAll({ attributes: ['id'], transaction });
            canchasIds = todasLasCanchas.map(c => c.id);
        } else {
            canchasIds.push(parseInt(canchaId, 10));
        }

        // --- VALIDACIÓN CLAVE: Se comprueba si hay conflictos ANTES de bloquear ---
        const conflictoExistente = await Reserva.findOne({
            where: {
                fecha,
                canchaId: { [Op.in]: canchasIds },
                estadoReserva: { [Op.notIn]: ['CanceladaPorUsuario', 'CanceladaPorAdmin'] },
                // Lógica de solapamiento de horarios
                horaInicio: { [Op.lt]: horaTermino },
                horaTermino: { [Op.gt]: horaInicio }
            },
            transaction
        });

        // Si se encuentra CUALQUIER reserva, no se puede bloquear.
        if (conflictoExistente) {
            await transaction.rollback();
            return res.status(409).json({ message: 'No se puede bloquear el horario. Ya existe una reserva de usuario en este rango.' });
        }

        // Si no hay conflictos, se procede a crear los bloqueos
        for (const id of canchasIds) {
            await Reserva.create({
                fecha,
                horaInicio,
                horaTermino,
                canchaId: id,
                userRut: req.user.rut, // Se asigna el RUT del admin que realiza la acción
                estadoReserva: 'CanceladaPorAdmin', // Estado especial para bloqueos
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

        reserva.estadoReserva = 'Archivada';
        await reserva.save(); 

        res.status(200).json({ message: 'Horario desbloqueado exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar bloqueo:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/reservas', [verificarToken, verificarAdmin], async (req, res) => {
    // Obtener los datos del body
    const { canchaId, fecha, horaInicio, horaTermino, userRut, jugadores, equipamientos } = req.body;

    // VALIDACIONES DE ENTRADA 
    if (!canchaId || !fecha || !horaInicio || !horaTermino || !userRut || !jugadores) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para la reserva.' });
    }

    // Validación de Jugadores (RUT y Edad)
    for (const jugador of jugadores) {
        if (!jugador.rut || !validarRutChileno(jugador.rut)) {
            return res.status(400).json({ message: `El RUT '${jugador.rut || ''}' de uno de los jugadores no es válido.` });
        }
        if (!jugador.edad || parseInt(jugador.edad) < 14 || parseInt(jugador.edad) > 130) {
            return res.status(400).json({ message: `Todos los jugadores deben tener al menos 14 años. Verifique la edad para el RUT ${jugador.rut}.` });
        }
    }

    const reservaFechaMoment = moment.tz(fecha, 'YYYY-MM-DD', TIMEZONE).startOf('day');
    const reservaHoraInicioMoment = moment.tz(`${fecha} ${horaInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
    const reservaHoraTerminoMoment = moment.tz(`${fecha} ${horaTermino}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
    const duracionMinutos = reservaHoraTerminoMoment.diff(reservaHoraInicioMoment, 'minutes');

    if (duracionMinutos < 90 || duracionMinutos > 180) {
             return res.status(400).json({ message: `La duración de la reserva debe ser entre 90 y 180 minutos.` });
        }

    if (reservaHoraTerminoMoment.isSameOrBefore(reservaHoraInicioMoment)) {
            return res.status(400).json({ message: 'La hora de término debe ser posterior a la hora de inicio.' });
    }
    const horaLimiteInicio = reservaFechaMoment.clone().hour(8).minute(0);
    const horaLimiteFin = reservaFechaMoment.clone().hour(20).minute(0);

    if (reservaHoraInicioMoment.isBefore(horaLimiteInicio) || reservaHoraTerminoMoment.isAfter(horaLimiteFin)) {
        return res.status(400).json({ message: 'Las reservas solo pueden ser entre las 08:00 y las 20:00 hrs.' });
    }

    if (duracionMinutos <= 0 || duracionMinutos % 30 !== 0) {
        return res.status(400).json({ message: 'La duración de la reserva debe ser en bloques de 30 minutos (ej: 30, 60, 90 min).' });
    }

    const minutosDesdeApertura = reservaHoraInicioMoment.diff(horaLimiteInicio, 'minutes');
    
    if (minutosDesdeApertura < 0 || minutosDesdeApertura % 30 !== 0) {
        return res.status(400).json({
            message: `La hora de inicio '${horaInicio}' no es válida. Los horarios deben ser "en punto" o "hora y 30" desde las 8:00.`
        });
    }

    const transaction = await sequelize.transaction();
    try {
        // OBTENER DATOS DE LA BD 
        const cancha = await Cancha.findByPk(canchaId, { transaction });
        const user = await User.findByPk(userRut, { transaction });

        if (!cancha || !user) {
            await transaction.rollback();
            return res.status(404).json({ message: 'El usuario o la cancha especificada no existen.' });
        }
        const conflicto = await Reserva.findOne({
            where: {
                canchaId: canchaId,
                fecha: fecha,
                estadoReserva: {
                    [Op.in]: ['Pendiente', 'Confirmada', 'CanceladaPorAdmin']
                },

                horaInicio: {
                    [Op.lt]: horaTermino 
                },
                horaTermino: {
                    [Op.gt]: horaInicio
                }
            },
            transaction
        });

        if (conflicto) {
            await transaction.rollback();
            return res.status(409).json({ 
                message: `El horario de ${horaInicio} a ${horaTermino} en la cancha '${cancha.nombre}' ya está ocupado por otra reserva (Estado: ${conflicto.estadoReserva}).`
            });
        }

        // LÓGICA DE EQUIPAMIENTO 
        let costoEquipamientoTotal = 0;
        if (equipamientos && equipamientos.length > 0) {
            for (const item of equipamientos) {
                const equipoEnDB = await Equipamiento.findByPk(item.id, { transaction });

                if (!equipoEnDB) {
                    throw new Error(`El artículo de equipamiento con ID ${item.id} no fue encontrado.`);
                }
                if (equipoEnDB.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para '${equipoEnDB.nombre}'. Solicitado: ${item.cantidad}, Disponible: ${equipoEnDB.stock}.`);
                }
                costoEquipamientoTotal += equipoEnDB.costo * item.cantidad;
            }
        }
        
        // CÁLCULO DE COSTO Y VERIFICACIÓN DE SALDO 
        const duracionMinutos = moment.duration(moment(horaTermino, 'HH:mm').diff(moment(horaInicio, 'HH:mm'))).asMinutes();
        const costoCancha = (duracionMinutos / 60) * cancha.costo; // Usar el costo de la cancha desde la BD
        const costoTotal = costoCancha + costoEquipamientoTotal;

        if (user.saldo < costoTotal) {
            await transaction.rollback();
            return res.status(402).json({ message: `El usuario no tiene saldo suficiente. Saldo: ${user.saldo}, Requerido: ${costoTotal}` });
        }

        // 6. OPERACIONES DE ESCRITURA EN LA BD 
        // Decrementar saldo del usuario
        await user.decrement('saldo', { by: costoTotal, transaction });

        // Decrementar stock de equipamiento
        if (equipamientos && equipamientos.length > 0) {
            for (const item of equipamientos) {
                await Equipamiento.decrement('stock', { by: item.cantidad, where: { id: item.id }, transaction });
            }
        }

        // Crear la reserva
        const nuevaReserva = await Reserva.create({
            canchaId,
            userRut,
            fecha,
            horaInicio,
            horaTermino,
            requiereEquipamiento: costoEquipamientoTotal > 0, 
            costoEquipamiento: costoEquipamientoTotal,
            costoTotalReserva: costoTotal,
            estadoReserva: 'Pendiente'
        }, { transaction });

        // Asociar equipamiento rentado con la reserva
        if (equipamientos && equipamientos.length > 0) {
            for (const item of equipamientos) {
                await nuevaReserva.addEquipamientosRentado(item.id, { 
                    through: { cantidad: item.cantidad }, 
                    transaction 
                });
            }
        }

        // Crear los registros de jugadores
        if (jugadores && jugadores.length > 0) {
            const jugadoresParaCrear = jugadores.map(jugador => ({ ...jugador, reservaId: nuevaReserva.id }));
            await Jugador.bulkCreate(jugadoresParaCrear, { transaction });
        }

        // FINALIZAR 
        await transaction.commit();

        try {
            await enviarEmailConfirmacion(user, nuevaReserva, cancha);
        } catch (emailError) {
            console.error('El correo de confirmación no se pudo enviar, pero la reserva fue exitosa.', emailError);
        }

        res.status(201).json({ message: 'Reserva creada exitosamente por el administrador.', reserva: nuevaReserva });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error del admin al crear reserva:', error);
        res.status(500).json({ message: error.message || 'Error interno al crear la reserva.' });
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

        await devolverStockDeReserva(id, transaction);
        
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
        
        const stockNum = Number(stock);
        if (isNaN(stockNum) || stockNum <= 0) {
            return res.status(400).json({ message: 'El stock debe ser un número mayor que 0.' });
        }

        const nombreEstandarizado = nombre.trim().toUpperCase();

        const nuevoArticulo = await Equipamiento.create({ 
            nombre: nombreEstandarizado,
            tipo, 
            stock: stockNum, // Usamos la variable numérica
            costo 
        });
        
        res.status(201).json(nuevoArticulo);
    } catch (error) {

        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Error de validación', errors: mensajes });
        }
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

        // --- VALIDACIÓN AÑADIDA TAMBIÉN AQUÍ ---
        if (stock !== undefined) {
            const stockNum = Number(stock);
            if (isNaN(stockNum) || stockNum <= 0) {
                return res.status(400).json({ message: 'El stock debe ser un número mayor que 0.' });
            }
            articulo.stock = stockNum;
        }

        articulo.nombre = nombre || articulo.nombre;
        articulo.tipo = tipo || articulo.tipo;
        articulo.costo = costo !== undefined ? costo : articulo.costo;
        
        await articulo.save(); 
        res.status(200).json(articulo);
    } catch (error) {

        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Error de validación', errors: mensajes });
        }
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