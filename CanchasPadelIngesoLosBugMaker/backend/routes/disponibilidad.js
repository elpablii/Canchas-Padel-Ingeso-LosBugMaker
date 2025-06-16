const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { Reserva, Cancha } = require('../models');

const TIMEZONE = 'America/Santiago';

// GET /api/disponibilidad?date=YYYY-MM-DD&horaInicio=HH:MM&horaTermino=HH:MM
router.get('/', async (req, res) => {
  try {
    const { date, horaInicio, horaTermino } = req.query;

    // --- 1. VALIDACIONES DE ENTRADA ---
    if (!date || !horaInicio || !horaTermino) {
      return res.status(400).json({ message: 'Los parámetros "date", "horaInicio" y "horaTermino" son requeridos.' });
    }

    const fechaMoment = moment.tz(date, 'YYYY-MM-DD', TIMEZONE);
    const horaInicioMoment = moment.tz(`${date} ${horaInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
    const horaTerminoMoment = moment.tz(`${date} ${horaTermino}`, 'YYYY-MM-DD HH:mm', TIMEZONE);

    // --- 2. VALIDACIONES DE REGLAS DE NEGOCIO ---

    // Regla: Solo de Lunes a Viernes
    const diaSemana = fechaMoment.day(); // 1 = Lunes, 5 = Viernes
    if (diaSemana < 1 || diaSemana > 5) {
        return res.status(400).json({ 
            disponibles: [], // Devolvemos un array vacío para que el frontend no muestre nada
            message: 'Las canchas solo operan de Lunes a Viernes.' 
        });
    }

    // Regla: Solo entre 08:00 y 20:00
    const horaLimiteInicio = fechaMoment.clone().hour(8).minute(0);
    const horaLimiteFin = fechaMoment.clone().hour(20).minute(0);

    if (horaInicioMoment.isBefore(horaLimiteInicio) || horaTerminoMoment.isAfter(horaLimiteFin)) {
        return res.status(400).json({
            disponibles: [],
            message: 'El horario de consulta debe estar entre las 08:00 y las 20:00 hrs.'
        });
    }

    // --- 3. LÓGICA DE BÚSQUEDA ---

    // Paso A: Buscar todas las reservas que se solapan con el horario solicitado en esa fecha
    const reservasEnConflicto = await Reserva.findAll({
        where: {
            fecha: date,
            estadoReserva: { [Op.notIn]: ['CanceladaPorUsuario', 'CanceladaPorAdmin', 'NoAsistio'] },
            horaInicio: {
                [Op.lt]: horaTermino
            },
            horaTermino: {
                [Op.gt]: horaInicio
            }
        }
    });

    // Paso B: Obtener los IDs de las canchas que ya están ocupadas en ese horario
    const canchasOcupadasIds = reservasEnConflicto.map(r => r.canchaId);

    // Paso C: Buscar todas las canchas EXCLUYENDO las que están ocupadas
    const canchasDisponibles = await Cancha.findAll({
        where: {
            id: {
                [Op.notIn]: canchasOcupadasIds // Excluimos los IDs de las canchas ocupadas
            }
        },
        order: [['id', 'ASC']] // Opcional: ordenar por ID
    });

    return res.status(200).json({ disponibles: canchasDisponibles });

  } catch (err) {
    console.error('Error al consultar disponibilidad:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;