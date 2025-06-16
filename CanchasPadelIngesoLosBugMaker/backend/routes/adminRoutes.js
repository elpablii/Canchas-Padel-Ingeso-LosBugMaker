const express = require('express');
const router = express.Router();
const { Reserva, User, Cancha, sequelize } = require('../models'); 
const { notificarATodos } = require('../services/notificacionService');
// --- CORRECCIÓN: Se usan solo los middlewares necesarios y estándar ---
const { verificarToken, verificarAdmin } = require('../middleware/auth');

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

module.exports = router;