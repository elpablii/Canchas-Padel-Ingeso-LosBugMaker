// EN: backend/services/cronJobs.js
const cron = require('node-cron');
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const { Reserva, User, Cancha } = require('../models'); // Importamos todos los modelos necesarios
const { enviarEmailRecordatorio } = require('./emailService'); // Importamos la nueva función
const { devolverStockDeReserva } = require('../utils/inventarioUtils'); // Ajusta la ruta si es necesario

const TIMEZONE = 'America/Santiago';

// Esta función busca y actualiza las reservas que deben marcarse como completadas
const actualizarReservasCompletadas = async () => {
  console.log('CRON JOB: Ejecutando tarea para actualizar reservas completadas...');
  
  const transaction = await sequelize.transaction();
  
  try {
    const ahora = moment().tz(TIMEZONE);

    const reservasCandidatas = await Reserva.findAll({
      where: {
        estadoReserva: 'Confirmada',
        fecha: { [Op.lte]: ahora.format('YYYY-MM-DD') }
      },
      transaction
    });

    if (reservasCandidatas.length === 0) {
      console.log('CRON JOB: No se encontraron reservas candidatas para marcar como completadas.');
      await transaction.commit();
      return;
    }

    let contadorActualizadas = 0;

    for (const reserva of reservasCandidatas) {
      const finReserva = moment.tz(`${reserva.fecha} ${reserva.horaTermino}`, 'YYYY-MM-DD HH:mm:ss', TIMEZONE);

      if (ahora.isAfter(finReserva)) {
        console.log(`- Procesando reserva completada ID: ${reserva.id}...`);
        
        await devolverStockDeReserva(reserva.id, transaction);
        
        reserva.estadoReserva = 'Completada';
        await reserva.save({ transaction });

        console.log(`  Reserva ID: ${reserva.id} movida a 'Completada'.`);
        contadorActualizadas++;
      }
    }
    
    await transaction.commit();
    
    if (contadorActualizadas > 0) {
      console.log(`CRON JOB: Se actualizaron ${contadorActualizadas} reservas a 'Completada'.`);
    } else {
      console.log('CRON JOB: Ninguna de las reservas candidatas ha finalizado aún.');
    }

  } catch (error) {
    await transaction.rollback();
    console.error('CRON JOB: Error al actualizar reservas completadas:', error);
  }
};

/**
 * Busca reservas en estado 'Pendiente' cuya fecha de reserva es mañana
 * para cambiarlas a 'Archivada' y devolver el stock de equipamiento.
 */
const archivarReservasPendientesVencidas = async () => {
  console.log('CRON JOB: Ejecutando tarea para archivar reservas pendientes...');

  const manana = moment().tz(TIMEZONE).add(1, 'day').format('YYYY-MM-DD');

  const transaction = await sequelize.transaction(); 
  
  try {

    const reservasParaArchivar = await Reserva.findAll({
      where: {
        estadoReserva: 'Pendiente',
        fecha: { [Op.eq]: manana } 
      },
      transaction 
    });

    if (reservasParaArchivar.length === 0) {
      console.log('CRON JOB: No se encontraron reservas pendientes para archivar.');
      await transaction.commit();
      return;
    }

    console.log(`CRON JOB: Se encontraron ${reservasParaArchivar.length} reservas para archivar.`);


    for (const reserva of reservasParaArchivar) {
      console.log(`- Procesando reserva ID: ${reserva.id}...`);

      await devolverStockDeReserva(reserva.id, transaction);
      
      reserva.estadoReserva = 'Archivada';
      await reserva.save({ transaction });

      console.log(`  Reserva ID: ${reserva.id} movida a 'Archivada'.`);
    }

    await transaction.commit();
    console.log('CRON JOB: Tarea de archivado completada exitosamente.');

  } catch (error) {
    await transaction.rollback();
    console.error('CRON JOB: Error al archivar reservas pendientes:', error);
  }
};

const enviarRecordatoriosDeReservas = async () => {
    console.log('CRON JOB: Ejecutando tarea para enviar recordatorios...');
    const fecha3Dias = moment().tz(TIMEZONE).add(3, 'days').format('YYYY-MM-DD');
    const fecha1Dia = moment().tz(TIMEZONE).add(1, 'day').format('YYYY-MM-DD');

    try {
        const reservas3d = await Reserva.findAll({
            where: { fecha: fecha3Dias, estadoReserva: 'Confirmada', recordatorio3dEnviado: false },
            include: [{ model: User, as: 'usuario' }, { model: Cancha, as: 'cancha' }]
        });

        const idsNotificados3d = [];
        for (const reserva of reservas3d) {
            await enviarEmailRecordatorio(reserva.usuario, reserva, reserva.cancha, 3);
            idsNotificados3d.push(reserva.id); 
        }

        if (idsNotificados3d.length > 0) {
            await Reserva.update({ recordatorio3dEnviado: true }, { where: { id: { [Op.in]: idsNotificados3d } } });
        }

        const reservas1d = await Reserva.findAll({
            where: { fecha: fecha1Dia, estadoReserva: 'Confirmada', recordatorio1dEnviado: false },
            include: [{ model: User, as: 'usuario' }, { model: Cancha, as: 'cancha' }]
        });

        const idsNotificados1d = [];
        for (const reserva of reservas1d) {
            await enviarEmailRecordatorio(reserva.usuario, reserva, reserva.cancha, 1);
            idsNotificados1d.push(reserva.id);
        }
        if (idsNotificados1d.length > 0) {
            await Reserva.update({ recordatorio1dEnviado: true }, { where: { id: { [Op.in]: idsNotificados1d } } });
        }

        if(idsNotificados1d.length > 0 || idsNotificados3d.length > 0) {
            console.log(`CRON JOB: Se enviaron ${idsNotificados3d.length} recordatorios de 3 días y ${idsNotificados1d.length} de 1 día.`);
        } else {
            console.log('CRON JOB: No se encontraron reservas para enviar recordatorios hoy.');
        }

    } catch (error) {
        console.error('CRON JOB: Error al enviar recordatorios de reservas:', error);
    }
};

cron.schedule('0 23 * * *', archivarReservasPendientesVencidas, {
    timezone: TIMEZONE
});

// Ejecutar la tarea de marcar como completada cada hora
cron.schedule('0 * * * *', actualizarReservasCompletadas);

// Ejecutar la tarea de enviar recordatorios todos los días a las 9 AM
cron.schedule('0 9 * * *', enviarRecordatoriosDeReservas, {
    timezone: TIMEZONE
});

console.log('Tareas programadas (Cron Jobs) iniciadas.');


//enviarRecordatoriosDeReservas(); 