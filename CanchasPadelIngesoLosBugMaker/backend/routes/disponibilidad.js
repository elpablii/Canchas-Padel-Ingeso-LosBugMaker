const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const Cancha = require('../models/Cancha');

const { Op } = require('sequelize');

// GET /api/availability?date=YYYY-MM-DD&time=HH:mm:ss
router.get('/', async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({ message: 'Parámetros "date" y "time" son requeridos.' });
    }

    // Paso 1: Obtener todas las canchas
    const todasLasCanchas = await Cancha.findAll();

    // Paso 2: Buscar reservas para la fecha y hora especificadas
    const reservasEncontradas = await Reserva.findAll({
      where: {
        fecha: date,
        horaInicio: time
      }
    });

    // Paso 3: Identificar las IDs de las canchas que YA ESTÁN reservadas
    const canchasReservadasIds = reservasEncontradas.map(reserva => reserva.canchaId);

    // Paso 4: Filtrar las canchas para obtener solo las que NO están en la lista de reservadas
    const canchasDisponibles = todasLasCanchas.filter(cancha => !canchasReservadasIds.includes(cancha.id));

    return res.json({
      disponibles: canchasDisponibles
    });

  } catch (err) {
    console.error('Error al consultar disponibilidad:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;