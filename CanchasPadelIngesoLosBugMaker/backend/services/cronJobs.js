// EN: backend/services/cronJobs.js
const cron = require('node-cron');
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { Reserva, User, Cancha } = require('../models'); // Importamos todos los modelos necesarios
const { enviarEmailRecordatorio } = require('./emailService'); // Importamos la nueva función

const TIMEZONE = 'America/Santiago';

// Esta función busca y actualiza las reservas que deben marcarse como completadas
const actualizarReservasCompletadas = async () => {
  console.log('CRON JOB: Ejecutando tarea para actualizar reservas completadas...');
  try {
    const ahora = new Date();

    const [count] = await Reserva.update(
      { estadoReserva: 'Completada' },
      {
        where: {
          estadoReserva: 'Confirmada', // Solo actualiza las que están confirmadas
          // Construye la condición de fecha y hora
          [Op.and]: [
            { fecha: { [Op.lte]: ahora.toISOString().split('T')[0] } }, // Fecha es hoy o en el pasado
            { horaTermino: { [Op.lt]: ahora.toTimeString().split(' ')[0] } } // Y la hora de término ya pasó hoy
          ]
        }
      }
    );

    if (count > 0) {
      console.log(`CRON JOB: Se actualizaron ${count} reservas a 'Completada'.`);
    } else {
      console.log('CRON JOB: No se encontraron reservas para actualizar.');
    }
  } catch (error) {
    console.error('CRON JOB: Error al actualizar reservas:', error);
  }
};

// --- TAREA 2: Enviar correos de recordatorio ---
const enviarRecordatoriosDeReservas = async () => {
    console.log('CRON JOB: Ejecutando tarea para enviar recordatorios...');
    
    // Calcular las fechas objetivo
    const fecha3Dias = moment().tz(TIMEZONE).add(3, 'days').format('YYYY-MM-DD');
    const fecha1Dia = moment().tz(TIMEZONE).add(1, 'day').format('YYYY-MM-DD');

    try {
        // Buscar reservas que necesiten recordatorio de 3 días
        const reservas3d = await Reserva.findAll({
            where: {
                fecha: fecha3Dias,
                estadoReserva: 'Confirmada',
                recordatorio3dEnviado: false // Solo las que no han recibido el recordatorio
            },
            include: [{ model: User, as: 'usuario' }, { model: Cancha, as: 'cancha' }]
        });

        // Enviar correos y actualizar estado
        for (const reserva of reservas3d) {
            await enviarEmailRecordatorio(reserva.usuario, reserva, reserva.cancha, 3);
            reserva.recordatorio3dEnviado = true;
            await reserva.save();
        }

        // Buscar reservas que necesiten recordatorio de 1 día
        const reservas1d = await Reserva.findAll({
            where: {
                fecha: fecha1Dia,
                estadoReserva: 'Confirmada',
                recordatorio1dEnviado: false
            },
            include: [{ model: User, as: 'usuario' }, { model: Cancha, as: 'cancha' }]
        });

        // Enviar correos y actualizar estado
        for (const reserva of reservas1d) {
            await enviarEmailRecordatorio(reserva.usuario, reserva, reserva.cancha, 1);
            reserva.recordatorio1dEnviado = true;
            await reserva.save();
        }

        if(reservas1d.length > 0 || reservas3d.length > 0) {
            console.log(`CRON JOB: Se enviaron ${reservas3d.length} recordatorios de 3 días y ${reservas1d.length} de 1 día.`);
        } else {
            console.log('CRON JOB: No se encontraron reservas para enviar recordatorios hoy.');
        }

    } catch (error) {
        console.error('CRON JOB: Error al enviar recordatorios de reservas:', error);
    }
};

// Ejecutar la tarea de marcar como completada cada hora
cron.schedule('0 * * * *', actualizarReservasCompletadas);

// Ejecutar la tarea de enviar recordatorios todos los días a las 9 AM
cron.schedule('0 9 * * *', enviarRecordatoriosDeReservas, {
    timezone: TIMEZONE
});

console.log('Tareas programadas (Cron Jobs) iniciadas.');


enviarRecordatoriosDeReservas(); 