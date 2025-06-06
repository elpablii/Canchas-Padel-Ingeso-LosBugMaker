// EN: backend/services/cronJobs.js

const cron = require('node-cron');
const { Reserva, Op } = require('../models'); // Ajusta la ruta a tus modelos

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

// Se programa la tarea para que se ejecute cada hora, en el minuto 0.
// Formato: (minuto hora día-mes mes día-semana)
cron.schedule('0 * * * *', actualizarReservasCompletadas);

console.log('Tarea programada (Cron Job) para actualizar reservas ha sido iniciada.');