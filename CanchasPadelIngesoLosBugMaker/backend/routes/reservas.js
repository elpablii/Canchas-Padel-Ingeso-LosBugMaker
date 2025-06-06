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

router.get('/historial/:userRut', async (req, res) => { // <-- 1. Parámetro corregido
  try {
    const { userRut } = req.params; // <-- 2. Variable corregida
    console.log("RUTA: /api/reservas/historial");
    console.log("RUT recibido:", userRut);

    const historial = await Reserva.findAll({
      where: { userRut }, // <-- 3. Ahora la sintaxis abreviada funciona perfectamente
      include: [
        {
          model: Cancha,
          as: 'cancha',
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
    // Importamos sequelize para poder usar transacciones
    const { sequelize } = require('../models'); 
    let transaction;

    try {
        const { canchaId, fecha, horaInicio, horaTermino, requiereEquipamiento, userRut } = req.body;

        // --- 1. Validaciones (como las tenías, ¡perfectas!) ---
        if (!canchaId || !fecha || !horaInicio || !horaTermino || requiereEquipamiento === undefined || !userRut) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }
        
        if (!validarRutChileno(userRut)) {
          console.log(`[${timestamp}] VALIDATION_FAIL: RUT inválido`);
          return res.status(400).json({ message: 'El RUT ingresado no es válido.' });
        }

        // --- 2. Iniciar una transacción ---
        // Una transacción asegura que AMBAS operaciones (cobrar y reservar) se completen, o NINGUNA.
        transaction = await sequelize.transaction();

        // --- 3. Obtener datos y calcular costos DENTRO de la transacción ---
        const cancha = await Cancha.findByPk(canchaId, { transaction });
        const user = await User.findByPk(userRut, { transaction });

        if (!cancha) {
            await transaction.rollback(); // Deshacer transacción
            return res.status(404).json({ message: 'La cancha especificada no existe.' });
        }
        if (!user) {
            await transaction.rollback(); // Deshacer transacción
            return res.status(404).json({ message: 'El usuario especificado no existe.' });
        }

        // Cálculo de costo de la cancha
        const inicio = new Date(`1970-01-01T${horaInicio}Z`);
        const fin = new Date(`1970-01-01T${horaTermino}Z`);
        const duracionEnHoras = (fin - inicio) / (1000 * 60 * 60);
        const costoCancha = duracionEnHoras * 15000; // ¡Usando el precio que especificaste!
        
        const COSTO_EQUIPAMIENTO = 5000; // Costo fijo por equipamiento
        const costoEquipamientoFinal = requiereEquipamiento ? COSTO_EQUIPAMIENTO : 0;
        
        const costoTotal = costoCancha + costoEquipamientoFinal;

        // --- 4. VERIFICAR SALDO DEL USUARIO ---
        if (user.saldo < costoTotal) {
            await transaction.rollback(); // Deshacer transacción
            return res.status(402).json({ message: `Saldo insuficiente. Necesitas $${costoTotal} y tienes $${user.saldo}.` });
        }

        // --- 5. Verificar si hay conflicto de horario (como lo tenías) ---
        const conflicto = await Reserva.findOne({
            where: {
                canchaId,
                fecha,
                estadoReserva: { [Op.ne]: 'CanceladaPorUsuario' }, // No considerar reservas canceladas
                [Op.or]: [
                    { horaInicio: { [Op.between]: [horaInicio, horaTermino] } },
                    { horaTermino: { [Op.between]: [horaInicio, horaTermino] } },
                    { [Op.and]: [{ horaInicio: { [Op.lt]: horaTermino } }, { horaTermino: { [Op.gt]: horaInicio } }] }
                ]
            },
            transaction
        });

        if (conflicto) {
            await transaction.rollback(); // Deshacer transacción
            return res.status(409).json({ message: 'Conflicto: Ya existe una reserva para ese horario en esta cancha.' });
        }

        // --- 6. Si todo está bien: COBRAR Y CREAR RESERVA ---
        // Descontar saldo
        await user.decrement('saldo', { by: costoTotal, transaction });

        // Crear la reserva
        const nuevaReserva = await Reserva.create({
            canchaId,
            userRut,
            fecha,
            horaInicio,
            horaTermino,
            requiereEquipamiento,
            costoEquipamiento: costoEquipamientoFinal,
            // El estado por defecto será 'Pendiente' o 'Confirmada' según tu modelo
        }, { transaction });

        // --- 7. Confirmar la transacción ---
        await transaction.commit();

        console.log(`[${timestamp}] PAGO Y RESERVA EXITOSOS`);
        return res.status(201).json({
            message: `Reserva creada y pago de $${costoTotal} realizado exitosamente.`,
            reserva: nuevaReserva
        });

    } catch (error) {
        // Si algo falla, la transacción se deshace para no dejar datos inconsistentes
        if (transaction) await transaction.rollback();
        console.error(`\n[${timestamp}] --- ERROR EN /api/reservas ---`, error);
        return res.status(500).json({ message: 'Error interno al crear la reserva.' });
    }
});
module.exports = router;