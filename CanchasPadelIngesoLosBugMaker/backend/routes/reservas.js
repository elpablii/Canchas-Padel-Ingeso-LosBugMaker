const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const User = require('../models/User');
const Cancha = require('../models/Cancha');
const { Op } = require('sequelize');

// --- Helper: Validación de RUT chileno ---
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

// --- Ruta: POST /api/reservas ---

router.get('/historial/:rutReserva', async (req, res) => {
  try {
    const { rutReserva } = req.params;
    console.log("RUTA: /api/reservas/historial");
    console.log("RUT recibido:", rutReserva);

    const historial = await Reserva.findAll({
      where: { rutReserva },
      include: [
        {
          model: Cancha,
          as: 'cancha', // 👈 necesario si usaste alias
          attributes: ['id', 'nombre', 'costo']
        }
      ],
      order: [['fecha', 'DESC'], ['horaInicio', 'DESC']]
    });

    console.log("Historial obtenido:", historial);

    if (!historial || historial.length === 0) {
      return res.status(404).json({ message: 'No se encontraron reservas para este RUT.' });
    }

    return res.status(200).json({ reservas: historial });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    return res.status(500).json({ message: 'Error al obtener el historial de reservas.' });
  }
});

// PUT /api/reservas/:id/cancelar
router.put('/:id/cancelar', async (req, res) => {
  try {
    const id = req.params.id;
    const reserva = await Reserva.findByPk(id);

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    if (reserva.cancelada) {
      return res.status(400).json({ message: 'La reserva ya está cancelada.' });
    }

    reserva.cancelada = true;
    await reserva.save();

    return res.json({ message: 'Reserva cancelada exitosamente.', reserva });

  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/', async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] --- INICIO PETICIÓN /api/reservas ---`);
    console.log(`[${timestamp}] Datos recibidos (req.body):`, JSON.stringify(req.body, null, 2));

    try {
        const {
            canchaId,
            fecha,
            horaInicio,
            horaFin,
            equipamiento,
            boletaEquipamiento,
            rutReserva
        } = req.body;

        // Validación de campos
        if (!canchaId || !fecha || !horaInicio || !horaFin || !rutReserva) {
            console.log(`[${timestamp}] VALIDATION_FAIL: Faltan campos obligatorios`);
            return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados.' });
        }

        if (!validarRutChileno(rutReserva)) {
            console.log(`[${timestamp}] VALIDATION_FAIL: RUT inválido`);
            return res.status(400).json({ message: 'El RUT ingresado no es válido.' });
        }

        // Buscar si la cancha existe
        const cancha = await Cancha.findByPk(canchaId);
        if (!cancha) {
            console.log(`[${timestamp}] VALIDATION_FAIL: Cancha no encontrada`);
            return res.status(404).json({ message: 'La cancha especificada no existe.' });
        }
        const conflicto = await Reserva.findOne({
            where: {
                canchaId,
                fecha,
                [Op.or]: [
                {
                    horaInicio: {
                    [Op.between]: [horaInicio, horaFin]
                    }
                },
                {
                    horaFin: {
                    [Op.between]: [horaInicio, horaFin]
                    }
                },
                {
                    [Op.and]: [
                    { horaInicio: { [Op.lte]: horaInicio } },
                    { horaFin: { [Op.gte]: horaFin } }
                    ]
                }
                ]
            }
            });
            if (conflicto) {
            return res.status(409).json({ message: 'Ya existe una reserva para ese horario en esta cancha.' });
            }

        // Crear reserva
        const nuevaReserva = await Reserva.create({
            canchaId,
            fecha,
            horaInicio,
            horaFin,
            equipamiento,
            boletaEquipamiento,
            rutReserva
        });

        console.log(`[${timestamp}] DB_OP_SUCCESS: Reserva creada`, nuevaReserva.toJSON());

        return res.status(201).json({
            message: 'Reserva creada exitosamente.',
            reserva: nuevaReserva
        });

    } catch (error) {
        console.error(`\n[${timestamp}] --- ERROR EN /api/reservas (Bloque Catch) ---`);
        console.error(error);
        return res.status(500).json({ message: 'Error al crear la reserva.' });
    }
});
module.exports = router;