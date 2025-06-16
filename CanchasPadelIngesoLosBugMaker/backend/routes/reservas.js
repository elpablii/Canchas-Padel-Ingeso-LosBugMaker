const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const { Op } = require('sequelize');

// --- CORRECCIÓN CLAVE: Importar todos los modelos desde el index ---
// Esto asegura que los modelos tengan sus asociaciones cargadas.
const { Reserva, User, Cancha, Jugador, Equipamiento, sequelize } = require('../models');

const { enviarEmailConfirmacion } = require('../services/emailService');
const TIMEZONE = 'America/Santiago';

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
        
        // --- 1. OBTENER LA RESERVA Y SU EQUIPAMIENTO ASOCIADO ---
        // Usamos 'include' para traer la información del equipamiento arrendado en una sola consulta.
        const reserva = await Reserva.findByPk(id, {
            include: [{
                model: Equipamiento,
                as: 'equipamientosRentados', // El alias que definimos en la asociación
                through: { attributes: ['cantidad'] } // Nos aseguramos de traer la cantidad de la tabla intermedia
            }],
            transaction
        });

        if (!reserva) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }

        // --- 2. VALIDACIONES DE ESTADO Y TIEMPO (Sin cambios) ---
        if (reserva.estadoReserva.startsWith('Cancelada')) {
            await transaction.rollback();
            return res.status(400).json({ message: 'La reserva ya se encuentra cancelada.' });
        }
        
        const ahora = moment().tz(TIMEZONE);
        const inicioReserva = moment.tz(`${reserva.fecha} ${reserva.horaInicio}`, 'YYYY-MM-DD HH:mm:ss', TIMEZONE);
        if (inicioReserva.diff(ahora, 'days') < 7) {
            await transaction.rollback();
            return res.status(403).json({ message: 'No se puede cancelar una reserva con menos de 1 semana de anticipación.' });
        }

        // --- 3. DEVOLUCIÓN DE STOCK DEL EQUIPAMIENTO ---
        if (reserva.equipamientosRentados && reserva.equipamientosRentados.length > 0) {
            console.log('Devolviendo stock de equipamiento al inventario...');
            for (const equipo of reserva.equipamientosRentados) {
                // 'equipo.ReservaEquipamiento.cantidad' nos da la cantidad que se arrendó
                const cantidadADevolver = equipo.ReservaEquipamiento.cantidad;
                await equipo.increment('stock', { by: cantidadADevolver, transaction });
            }
        }

        // --- 4. LÓGICA DE REEMBOLSO DE SALDO AL USUARIO ---
        const usuario = await User.findByPk(reserva.userRut, { transaction });
        if (usuario && reserva.costoTotalReserva > 0) {
            // CORRECCIÓN: Usamos el costoTotalReserva guardado para un reembolso preciso.
            await usuario.increment('saldo', { by: reserva.costoTotalReserva, transaction });
        }
        
        // --- 5. ACTUALIZAR ESTADO DE LA RESERVA ---
        reserva.estadoReserva = 'CanceladaPorUsuario';
        await reserva.save({ transaction });

        // --- 6. FINALIZAR LA TRANSACCIÓN ---
        await transaction.commit();

        return res.json({ message: 'Reserva cancelada, stock devuelto y saldo reembolsado exitosamente.', reserva });

    } catch (error) {
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
    const timestamp = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    let transaction;

    try {
        const { canchaId, fecha, horaInicio, horaTermino, userRut, jugadores, equipamientos, requiereEquipamiento } = req.body;


        // --- 1. Validaciones (como las tenías, ¡perfectas!) ---
        if (!canchaId || !fecha || !horaInicio || !horaTermino || requiereEquipamiento === undefined || !userRut || !jugadores) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }
        if (!Array.isArray(jugadores) || jugadores.length === 0) {
            return res.status(400).json({ message: 'Debe registrar al menos un jugador.' });
        }
        
        if (!validarRutChileno(userRut)) {
          console.log(`[${timestamp}] VALIDATION_FAIL: RUT inválido`);
          return res.status(400).json({ message: 'El RUT ingresado no es válido.' });
        }

        const reservaFechaMoment = moment.tz(fecha, 'YYYY-MM-DD', TIMEZONE).startOf('day');
        const reservaHoraInicioMoment = moment.tz(`${fecha} ${horaInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
        const reservaHoraTerminoMoment = moment.tz(`${fecha} ${horaTermino}`, 'YYYY-MM-DD HH:mm', TIMEZONE);

        // Calcular duración en minutos
        const duracionMinutos = reservaHoraTerminoMoment.diff(reservaHoraInicioMoment, 'minutes');

        // --- VALIDACIÓN: Duración Mínima/Máxima (90 a 180 minutos) 
        if (duracionMinutos < 90 || duracionMinutos > 180) {
            console.log(`[${timestamp}] VALIDATION_FAIL: Duración de reserva inválida (${duracionMinutos} min).`);
            return res.status(400).json({ message: `La duración de la reserva debe ser entre 90 y 180 minutos. Duración solicitada: ${duracionMinutos} minutos.` });
        }
        if (reservaHoraTerminoMoment.isSameOrBefore(reservaHoraInicioMoment)) {
            console.log(`[${timestamp}] VALIDATION_FAIL: Hora de término no es posterior a la de inicio.`);
            return res.status(400).json({ message: 'La hora de término debe ser posterior a la hora de inicio.' });
        }

        // VALIDACIÓN: Rango de Horario (8:00 a 20:00) 
        const horaLimiteInicio = reservaFechaMoment.clone().set({ hour: 8, minute: 0, second: 0 });
        const horaLimiteFin = reservaFechaMoment.clone().set({ hour: 20, minute: 0, second: 0 }); // 20:00 es el límite final.

        if (reservaHoraInicioMoment.isBefore(horaLimiteInicio) || reservaHoraTerminoMoment.isAfter(horaLimiteFin)) {
            console.log(`[${timestamp}] VALIDATION_FAIL: Horario fuera de rango (8:00 a 20:00). Inicio: ${reservaHoraInicioMoment.format('HH:mm')}, Fin: ${reservaHoraTerminoMoment.format('HH:mm')}.`);
            return res.status(400).json({ message: 'Las reservas solo pueden ser entre las 08:00 y las 20:00 hrs.' });
        }
        // VALIDACIÓN: Dias de semana
        const diaSemana = reservaFechaMoment.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        if (diaSemana === 0 || diaSemana === 6) { // If it's Sunday (0) or Saturday (6)
            console.log(`[${timestamp}] VALIDATION_FAIL: Día de semana no permitido (${reservaFechaMoment.format('dddd')}).`);
            return res.status(400).json({ message: 'Las reservas solo se pueden realizar de Lunes a Viernes.' });
        }

        // Reservar con 1 semana de anticipación mínimo 
        const ahora = moment().tz(TIMEZONE); // Hora actual
        const unaSemanaDesdeAhora = ahora.clone().add(7, 'days').startOf('day'); // Fecha de hoy + 7 días, al inicio del día

        if (reservaFechaMoment.isBefore(unaSemanaDesdeAhora)) {
            console.log(`[${timestamp}] VALIDATION_FAIL: Reserva con menos de 1 semana de anticipación. Fecha solicitada: ${reservaFechaMoment.format('YYYY-MM-DD')}, Mínimo permitido: ${unaSemanaDesdeAhora.format('YYYY-MM-DD')}`);
            return res.status(400).json({ message: 'Las reservas deben realizarse con al menos 1 semana de anticipación.' });
        }


        // --- 2. Iniciar una transacción ---
        // Una transacción asegura que AMBAS operaciones (cobrar y reservar) se completen, o NINGUNA.
        transaction = await sequelize.transaction();

        // --- 2. VALIDACIÓN DE STOCK DE EQUIPAMIENTO (CORREGIDA) ---
        let costoEquipamientoTotal = 0;
        if (equipamientos && equipamientos.length > 0) {
            
            // Paso A: Agrupar las cantidades solicitadas por cada ID de artículo.
            // Esto previene que se pueda pedir el mismo artículo varias veces superando el stock.
            const cantidadesAgrupadas = equipamientos.reduce((acc, item) => {
                acc[item.id] = (acc[item.id] || 0) + item.cantidad;
                return acc;
            }, {}); // Resultado ej: { '1': 2, '3': 1 }

            const idsEquipamiento = Object.keys(cantidadesAgrupadas);
            const articulosEnStock = await Equipamiento.findAll({
                where: { id: { [Op.in]: idsEquipamiento } },
                transaction
            });

            // Paso B: Validar el stock para cada artículo con la cantidad total solicitada.
            for (const articulo of articulosEnStock) {
                const cantidadSolicitada = cantidadesAgrupadas[articulo.id];
                if (articulo.stock < cantidadSolicitada) {
                    await transaction.rollback();
                    return res.status(409).json({ message: `Stock insuficiente para ${articulo.nombre}. Solicitado: ${cantidadSolicitada}, Disponible: ${articulo.stock}.` });
                }
                // Sumamos al costo total
                costoEquipamientoTotal += articulo.costo * cantidadSolicitada;
            }
        }
        
        // --- OBTENER DATOS Y VALIDACIONES RESTANTES ---
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

        // --- 5. VALIDACIONES COMPLEJAS CON BDD ---

        // Se obtiene la línea de tiempo completa del día. Esta variable es ESENCIAL para las siguientes validaciones.
        const timelineDelDia = await Reserva.findAll({
            where: {
                fecha: fecha,
                estadoReserva: { [Op.notIn]: ['CanceladaPorUsuario', 'CanceladaPorAdmin', 'NoAsistio'] }
            },
            order: [['horaInicio', 'ASC']],
            transaction
        });

        const reservasPreviasUsuario = timelineDelDia.filter(res => res.userRut === userRut);

        // REGLA: Límite de 180 minutos diarios por usuario
        const minutosYaReservados = reservasPreviasUsuario.reduce((total, res) => 
            total + moment.duration(moment(res.horaTermino, 'HH:mm:ss').diff(moment(res.horaInicio, 'HH:mm:ss'))).asMinutes(), 0);

        if (minutosYaReservados + duracionMinutos > 180) {
            await transaction.rollback();
            return res.status(403).json({ message: `Superas el límite de 180 minutos diarios. Ya tienes ${minutosYaReservados} min reservados.` });
        }

        if (jugadores.length > cancha.maxJugadores) {
          await transaction.rollback();
          return res.status(409).json({ message: `El número de jugadores (${jugadores.length}) excede el máximo permitido para esta cancha (${cancha.maxJugadores}).` });
        }


        // REGLA CLAVE: "NO DEJAR HUECOS"
        if (reservasPreviasUsuario.length > 0) {
            // Encuentra la última reserva del usuario en el día
            const ultimaReservaUsuario = reservasPreviasUsuario[reservasPreviasUsuario.length - 1];
            const finUltimaReserva = ultimaReservaUsuario.horaTermino;

            // Busca si hay alguna reserva (de cualquier usuario) que comience justo cuando termina la del usuario
            const hayReservaConsecutiva = timelineDelDia.some(res => res.horaInicio === finUltimaReserva);

            // Si el bloque siguiente está libre Y el usuario no está intentando tomar ESE bloque exacto
            if (!hayReservaConsecutiva && horaInicio !== finUltimaReserva) {
                await transaction.rollback();
                return res.status(409).json({ message: `Debes esperar la reserva del bloque que comienza a las ${finUltimaReserva}. Cancela la reserva y aumenta la duracion de reserva` });
            }
        }

        // REGLA: Disponibilidad general de la cancha (previene solapamientos)
        const conflictoCancha = timelineDelDia.some(res => 
            res.canchaId === canchaId && 
            res.horaInicio < horaTermino && 
            res.horaTermino > horaInicio
        );
        if (conflictoCancha) {
            await transaction.rollback();
            return res.status(409).json({ message: 'Este horario ya no está disponible en esta cancha.' });
        }

        const costoCancha = (duracionMinutos / 60) * 15000;
        const costoTotal = costoCancha + costoEquipamientoTotal;

        // Cálculo de costo de la cancha


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

        // --- 5. EJECUTAR OPERACIONES DE ESCRITURA ---
        await user.decrement('saldo', { by: costoTotal, transaction });

        const nuevaReserva = await Reserva.create({
            canchaId, userRut, fecha, horaInicio, horaTermino,
            requiereEquipamiento: costoEquipamientoTotal > 0, // Es true si se arrienda algo
            costoEquipamiento: costoEquipamientoTotal,
            costoTotalReserva: costoTotal,
            estadoReserva: 'Pendiente'
        }, { transaction });

        const jugadoresParaCrear = jugadores.map(j => ({ ...j, reservaId: nuevaReserva.id }));
        await Jugador.bulkCreate(jugadoresParaCrear, { transaction });

        // GUARDAR EQUIPAMIENTO ARRENDADO Y DESCONTAR STOCK
        if (equipamientos && equipamientos.length > 0) {
            for (const item of equipamientos) {
                const equipamiento = await Equipamiento.findByPk(item.id, { transaction });
                await nuevaReserva.addEquipamientosRentado(equipamiento, {
                    through: { cantidad: item.cantidad },
                    transaction
                });
                await equipamiento.decrement('stock', { by: item.cantidad, transaction });
            }
        }

        // --- 7. Confirmar la transacción ---
        await transaction.commit();
        
        // --- 8. ENVIAR CORREO DE CONFIRMACIÓN (AÑADE ESTE BLOQUE) ---
        try {
          console.log(`Intentando enviar correo de confirmación a ${user.email}...`);
          await enviarEmailConfirmacion(user, nuevaReserva, cancha);
        } catch (emailError) {
          console.error('El correo de confirmación no se pudo enviar, pero la reserva fue exitosa.', emailError);
        }

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