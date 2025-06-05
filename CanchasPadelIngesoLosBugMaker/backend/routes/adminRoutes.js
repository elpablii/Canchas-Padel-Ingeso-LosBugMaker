    // backend/routes/adminRoutes.js
    const express = require('express');
    const router = express.Router();
    const { Reserva, User, Cancha } = require('../models'); // Asumiendo que models/index.js exporta tus modelos
    const adminAuthMiddleware = require('../middleware/adminAuthMiddleware'); // Middleware para proteger rutas de admin

    // Middleware para proteger todas las rutas en este archivo
    // Cualquier ruta definida después de esta línea requerirá que el usuario sea admin
    router.use(adminAuthMiddleware);

    // GET /api/admin/reservas - Obtener todas las reservas (solo para administradores)
    router.get('/reservas', async (req, res) => {
      const requestTimestamp = new Date().toISOString();
      console.log(`\n[${requestTimestamp}] --- ADMIN: INICIO PETICIÓN GET /api/admin/reservas ---`);
      console.log(`[${requestTimestamp}] Admin User (req.userData):`, JSON.stringify(req.userData, null, 2));

      try {
        const todasLasReservas = await Reserva.findAll({
          include: [ // Incluir información asociada para más detalle
            {
              model: User,
              as: 'usuario', // Este alias debe coincidir con el definido en models/index.js o en las asociaciones
              attributes: ['rut', 'nombre', 'email'] // Solo traer estos atributos del usuario
            },
            {
              model: Cancha,
              as: 'cancha', // Este alias debe coincidir con el definido en models/index.js o en las asociaciones
              attributes: ['id', 'nombre', 'costo'] // Solo traer estos atributos de la cancha
            }
          ],
          order: [['fechaReserva', 'DESC'], ['horaInicio', 'DESC']] // Ordenar por fecha y hora, más recientes primero
        });

        if (!todasLasReservas || todasLasReservas.length === 0) {
          console.log(`[${requestTimestamp}] ADMIN_RESERVAS: No se encontraron reservas.`);
          return res.status(404).json({ message: 'No se encontraron reservas en el sistema.' });
        }

        console.log(`[${requestTimestamp}] ADMIN_RESERVAS: Devolviendo ${todasLasReservas.length} reservas.`);
        res.status(200).json(todasLasReservas);

      } catch (error) {
        console.error(`\n[${requestTimestamp}] --- ADMIN: ERROR en GET /api/admin/reservas ---`);
        console.error(`[${requestTimestamp}] Error Completo:`, error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el historial de reservas.' });
      }
      console.log(`[${requestTimestamp}] --- ADMIN: FIN PETICIÓN GET /api/admin/reservas ---`);
    });

    // GET /api/admin/users - Obtener todos los usuarios (solo para administradores)
    router.get('/users', async (req, res) => {
        const requestTimestamp = new Date().toISOString();
        console.log(`\n[${requestTimestamp}] --- ADMIN: INICIO PETICIÓN GET /api/admin/users ---`);
        try {
            const users = await User.findAll({
                attributes: ['rut', 'nombre', 'email', 'rol', 'createdAt', 'updatedAt'], // Excluir password
                order: [['createdAt', 'DESC']]
            });
            res.status(200).json(users);
        } catch (error) {
            console.error(`\n[${requestTimestamp}] --- ADMIN: ERROR en GET /api/admin/users ---`, error);
            res.status(500).json({ message: 'Error al obtener la lista de usuarios.' });
        }
        console.log(`[${requestTimestamp}] --- ADMIN: FIN PETICIÓN GET /api/admin/users ---`);
    });

    module.exports = router;
    