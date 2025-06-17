const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { verificarToken } = require('../middleware/auth');
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


router.post('/', [verificarToken], async (req, res) => {
    const timestamp = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    let transaction;

    try {
        const { canchaId, fecha, horaInicio, horaTermino, userRut, jugadores, equipamientos } = req.body;

        // --- 1. VALIDACIONES DE ENTRADA Y REGLAS BÁSICAS ---
        if (!canchaId || !fecha || !horaInicio || !horaTermino || !userRut || !jugadores) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }
        if (!Array.isArray(jugadores) || jugadores.length === 0) {
            return res.status(400).json({ message: 'Debe registrar al menos un jugador.' });
        }
        if (!validarRutChileno(userRut)) {
            return res.status(400).json({ message: 'El RUT ingresado no es válido.' });
        }
        
        const reservaFechaMoment = moment.tz(fecha, 'YYYY-MM-DD', TIMEZONE).startOf('day');
        const reservaHoraInicioMoment = moment.tz(`${fecha} ${horaInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
        const reservaHoraTerminoMoment = moment.tz(`${fecha} ${horaTermino}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
        const duracionMinutos = reservaHoraTerminoMoment.diff(reservaHoraInicioMoment, 'minutes');

        if (duracionMinutos < 90 || duracionMinutos > 180) {
             return res.status(400).json({ message: `La duración de la reserva debe ser entre 90 y 180 minutos.` });
        }
        if (reservaHoraTerminoMoment.isSameOrBefore(reservaHoraInicioMoment)) {
            return res.status(400).json({ message: 'La hora de término debe ser posterior a la hora de inicio.' });
        }
        const horaLimiteInicio = reservaFechaMoment.clone().hour(8).minute(0);
        const horaLimiteFin = reservaFechaMoment.clone().hour(20).minute(0);
        if (reservaHoraInicioMoment.isBefore(horaLimiteInicio) || reservaHoraTerminoMoment.isAfter(horaLimiteFin)) {
            return res.status(400).json({ message: 'Las reservas solo pueden ser entre las 08:00 y las 20:00 hrs.' });
        }
        const diaSemana = reservaFechaMoment.day();
        if (diaSemana < 1 || diaSemana > 5) {
            return res.status(400).json({ message: 'Las reservas solo se pueden realizar de Lunes a Viernes.' });
        }
        const unaSemanaDesdeAhora = moment().tz(TIMEZONE).add(7, 'days').startOf('day');
        if (reservaFechaMoment.isBefore(unaSemanaDesdeAhora)) {
            return res.status(400).json({ message: 'Las reservas deben realizarse con al menos 1 semana de anticipación.' });
        }

        // --- 2. INICIAR TRANSACCIÓN Y VALIDACIONES CON BDD ---
        transaction = await sequelize.transaction();
        
        const [cancha, user] = await Promise.all([
            Cancha.findByPk(canchaId, { transaction }),
            User.findByPk(userRut, { transaction })
        ]);

        if (!cancha || !user) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Usuario o cancha no encontrados.' });
        }

        if (jugadores.length > cancha.maxJugadores) {
            await transaction.rollback();
            return res.status(409).json({ message: `El número de jugadores excede el máximo para esta cancha.` });
        }
        
        const todasLasReservasDelDia = await Reserva.findAll({
            where: {
                fecha,
                estadoReserva: { [Op.notIn]: ['CanceladaPorUsuario', 'CanceladaPorAdmin', 'NoAsistio'] }
            },
            order: [['horaInicio', 'ASC']],
            transaction
        });

        const reservasPreviasUsuario = todasLasReservasDelDia.filter(r => r.userRut === userRut);
        
        const minutosYaReservados = reservasPreviasUsuario.reduce((total, res) => total + moment.duration(moment(res.horaTermino, 'HH:mm').diff(moment(res.horaInicio, 'HH:mm'))).asMinutes(), 0);
        if (minutosYaReservados + duracionMinutos > 180) {
            await transaction.rollback();
            return res.status(403).json({ message: `Superas el límite de 180 minutos diarios.` });
        }

        if (reservasPreviasUsuario.length > 0) {
            const esAdyacente = reservasPreviasUsuario.some(res => res.horaTermino === horaInicio || res.horaInicio === horaTermino);
            if (!esAdyacente) {
                const ultimaReservaUsuario = reservasPreviasUsuario[reservasPreviasUsuario.length - 1];
                let finBloqueActual = ultimaReservaUsuario.horaTermino;
                let huecoEncontrado = false;

                while (finBloqueActual < horaInicio) {
                    const proximaReserva = todasLasReservasDelDia.find(res => res.horaInicio === finBloqueActual);
                    if (proximaReserva) {
                        finBloqueActual = proximaReserva.horaTermino;
                    } else {
                        huecoEncontrado = true;
                        break;
                    }
                }
                if (huecoEncontrado) {
                    await transaction.rollback();
                    return res.status(409).json({ message: `No puedes dejar huecos. Tienes un bloque que termina a ${finBloqueActual}. Debes esperar la reserva de ese horario` });
                }
            }
        }
        
        const conflictoCancha = todasLasReservasDelDia.some(res => res.canchaId === canchaId && res.horaInicio < horaTermino && res.horaTermino > horaInicio);
        if (conflictoCancha) {
            await transaction.rollback();
            return res.status(409).json({ message: 'Este horario ya no está disponible en esta cancha.' });
        }

        // --- 3. CÁLCULO DE COSTO Y VALIDACIÓN DE STOCK ---
        let costoEquipamientoTotal = 0;
        if (equipamientos && equipamientos.length > 0) {
            const cantidadesAgrupadas = equipamientos.reduce((acc, item) => {
                acc[item.id] = (acc[item.id] || 0) + item.cantidad;
                return acc;
            }, {});
            const idsEquipamiento = Object.keys(cantidadesAgrupadas);
            const articulosEnStock = await Equipamiento.findAll({ where: { id: { [Op.in]: idsEquipamiento } }, transaction });
            for (const articulo of articulosEnStock) {
                const cantidadSolicitada = cantidadesAgrupadas[articulo.id];
                if (articulo.stock < cantidadSolicitada) {
                    await transaction.rollback();
                    return res.status(409).json({ message: `Stock insuficiente para ${articulo.nombre}.` });
                }
                costoEquipamientoTotal += articulo.costo * cantidadSolicitada;
            }
        }
        const costoCancha = (duracionMinutos / 60) * parseFloat(cancha.costo);
        const costoTotal = costoCancha + costoEquipamientoTotal;

        if (user.saldo < costoTotal) {
            await transaction.rollback();
            return res.status(402).json({ message: `Saldo insuficiente.` });
        }

        // --- 4. OPERACIONES DE ESCRITURA ---
        await user.decrement('saldo', { by: costoTotal, transaction });

        const nuevaReserva = await Reserva.create({
            canchaId, userRut, fecha, horaInicio, horaTermino,
            requiereEquipamiento: costoEquipamientoTotal > 0,
            costoEquipamiento: costoEquipamientoTotal,
            costoTotalReserva: costoTotal,
            estadoReserva: 'Pendiente'
        }, { transaction });

        const jugadoresParaCrear = jugadores.map(j => ({ ...j, reservaId: nuevaReserva.id }));
        await Jugador.bulkCreate(jugadoresParaCrear, { transaction });
        
        if (equipamientos && equipamientos.length > 0) {
            const cantidadesAgrupadas = equipamientos.reduce((acc, item) => {
                acc[item.id] = (acc[item.id] || 0) + item.cantidad;
                return acc;
            }, {});
            for (const equipamientoId in cantidadesAgrupadas) {
                const equipamiento = await Equipamiento.findByPk(equipamientoId, { transaction });
                await nuevaReserva.addEquipamientosRentado(equipamiento, {
                    through: { cantidad: cantidadesAgrupadas[equipamientoId] },
                    transaction
                });
                await equipamiento.decrement('stock', { by: cantidadesAgrupadas[equipamientoId], transaction });
            }
        }
        
        // --- 5. FINALIZAR ---
        await transaction.commit();
        
        try {
            await enviarEmailConfirmacion(user, nuevaReserva, cancha);
        } catch (emailError) {
            console.error('El correo de confirmación no se pudo enviar, pero la reserva fue exitosa.', emailError);
        }
        
        res.status(201).json({ message: `Reserva creada y pago de $${costoTotal} realizado exitosamente.`, reserva: nuevaReserva } );

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(`\n[${timestamp}] --- ERROR EN /api/reservas ---`, error);
        return res.status(500).json({ message: 'Error interno al crear la reserva.' });
    }
});

module.exports = router;