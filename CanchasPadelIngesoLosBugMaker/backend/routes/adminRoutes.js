// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
// Asumimos que models/index.js exporta tus modelos
const { Reserva, User, Cancha } = require('../models'); 
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// Este middleware se aplica a TODAS las rutas definidas en este archivo.
router.use(adminAuthMiddleware);

/**
 * @route   GET /api/admin/reservas
 * @desc    Obtener el historial completo de todas las reservas
 * @access  Private (Admin)
 */
router.get('/reservas', async (req, res) => {
  try {
    const todasLasReservas = await Reserva.findAll({
      include: [ 
        {
          model: User,
          as: 'usuario', // Alias de la asociación
          // Aseguramos de traer el saldo para la vista de "pagos"
          attributes: ['rut', 'nombre', 'email', 'saldo'] 
        },
        {
          model: Cancha,
          as: 'cancha', // Alias de la asociación
          attributes: ['id', 'nombre', 'costo']
        }
      ],
      // Ordenar para mostrar las reservas más recientes primero
      order: [['fechaReserva', 'DESC'], ['horaInicio', 'DESC']] 
    });

    // Es mejor devolver un array vacío si la consulta es exitosa pero no hay datos
    res.status(200).json(todasLasReservas);

  } catch (error) {
    console.error('Error en GET /api/admin/reservas:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener el historial de reservas.' });
  }
});


/**
 * @route   GET /api/admin/users
 * @desc    Obtener todos los usuarios registrados
 * @access  Private (Admin)
 */
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            // Excluimos la contraseña por seguridad e incluimos el saldo
            attributes: ['rut', 'nombre', 'email', 'rol', 'saldo', 'createdAt', 'updatedAt'], 
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error en GET /api/admin/users:', error);
        res.status(500).json({ message: 'Error al obtener la lista de usuarios.' });
    }
});

module.exports = router;
