const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const Cancha = require('../models/Cancha');

const { Op } = require('sequelize');

// GET /api/availability?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'El parámetro "date" es requerido.' });
    }
    const {horaInicio, horaTermino } = req.query;

    const reservas = await Reserva.findAll({
      where: {
        fecha: date,
        [Op.or]: [
          {
            horaInicio: {
              [Op.between]: [horaInicio, horaTermino]
            }
          },
          {
            horaTermino: {
              [Op.between]: [horaInicio, horaTermino]
            }
          },
          {
            [Op.and]: [
              { horaInicio: { [Op.lte]: horaInicio } },
              { horaTermino: { [Op.gte]: horaTermino } }
            ]
          }
        ]
      }
    });
    // Paso 1: Obtener todas las canchas
    const todasLasCanchas = await Cancha.findAll();

    // Paso 2: Buscar todas las reservas de ese día
    const reservasDelDia = await Reserva.findAll({
      where: {
        fecha: date
      }
    });

    // Paso 3: Obtener IDs de canchas ya reservadas ese día
    const canchasReservadasIds = reservasDelDia.map(r => r.canchaId);

    // Paso 4: Filtrar las disponibles
    const canchasDisponibles = todasLasCanchas.filter(
      cancha => !canchasReservadasIds.includes(cancha.id)
    );

    return res.json({
      disponibles: canchasDisponibles
    });

  } catch (err) {
    console.error('Error al consultar disponibilidad:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;