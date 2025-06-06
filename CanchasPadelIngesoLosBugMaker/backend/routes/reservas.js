const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const User = require('../models/User');
const Cancha = require('../models/Cancha');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const { enviarEmailConfirmacion } = require('../services/emailService');

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
  const transaction = await sequelize.transaction(); // Iniciar transacción para seguridad

  try {
    const { id } = req.params;
    const reserva = await Reserva.findByPk(id, { transaction });

    if (!reserva) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    // 1. VERIFICAR SI YA ESTÁ CANCELADA
    if (reserva.estadoReserva.startsWith('Cancelada')) {
      await transaction.rollback();
      return res.status(400).json({ message: 'La reserva ya se encuentra cancelada.' });
    }
    
    // 2. REGLA DE NEGOCIO: No cancelar si faltan menos de 24 horas
    const ahora = new Date();
    const inicioReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);
    const horasDeDiferencia = (inicioReserva - ahora) / (1000 * 60 * 60);

    if (horasDeDiferencia < 24) {
      await transaction.rollback();
      return res.status(403).json({ message: 'No se puede cancelar una reserva con menos de 24 horas de antelación.' });
    }

    // 3. ACTUALIZAR ESTADO DE LA RESERVA
    reserva.estadoReserva = 'CanceladaPorUsuario';
    await reserva.save({ transaction });
    
    // 4. LÓGICA DE REEMBOLSO
    const usuario = await User.findByPk(reserva.userRut, { transaction });
    if (usuario) {
      // Calculamos el costo total que tuvo la reserva para reembolsarlo
      const duracionEnHoras = (new Date(`1970-01-01T${reserva.horaTermino}Z`) - new Date(`1970-01-01T${reserva.horaInicio}Z`)) / (1000 * 60 * 60);
      const costoCancha = duracionEnHoras * 15000;
      const costoTotal = costoCancha + reserva.costoEquipamiento;

      await usuario.increment('saldo', { by: costoTotal, transaction });
    }

    // Si todo sale bien, se confirman los cambios
    await transaction.commit();

    return res.json({ message: 'Reserva cancelada y reembolso procesado exitosamente.', reserva });

  } catch (error) {
    // Si algo falla, se deshace todo
    if (transaction) await transaction.rollback();
    console.error('Error al cancelar reserva:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// EN: backend/routes/reservas.js

// --- RUTA: PUT /api/reservas/:id/confirmar ---
router.put('/:id/confirmar', async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.findByPk(id);

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    if (reserva.estadoReserva !== 'Pendiente') {
      return res.status(400).json({ message: `La reserva ya está en estado '${reserva.estadoReserva}', no se puede confirmar.` });
    }

    // --- NUEVA VALIDACIÓN DE FECHA ---
    const ahora = new Date();
    const inicioReserva = new Date(`${reserva.fecha}T${reserva.horaInicio}`);

    if (inicioReserva < ahora) {
      return res.status(403).json({ message: 'No se puede confirmar una reserva cuya fecha ya ha pasado.' });
    }
    // --- FIN DE LA NUEVA VALIDACIÓN ---

    reserva.estadoReserva = 'Confirmada';
    await reserva.save();

    console.log(`Reserva ID ${id} confirmada exitosamente.`);
    return res.status(200).json({ message: 'Reserva confirmada exitosamente.', reserva });

  } catch (error) {
    console.error('Error al confirmar la reserva:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.post('/', async (req, res) => {
    const timestamp = new Date().toISOString();
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
        
        // --- 8. ENVIAR CORREO DE CONFIRMACIÓN (AÑADE ESTE BLOQUE) ---
        try {
          console.log(`Intentando enviar correo de confirmación a ${user.email}...`);
          await enviarEmailConfirmacion(user, nuevaReserva, cancha);
        } catch (emailError) {
          console.error('El correo de confirmación no se pudo enviar, pero la reserva fue exitosa.', emailError);
        }
        // --- FIN DEL BLOQUE DE CORREO ---

        console.log(`[${timestamp}] PAGO Y RESERVA EXITOSOS`);
        return res.status(201).json({
            message: `Reserva creada y pago de $${costoTotal} realizado exitosamente.`,
            reserva: nuevaReserva
        });

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