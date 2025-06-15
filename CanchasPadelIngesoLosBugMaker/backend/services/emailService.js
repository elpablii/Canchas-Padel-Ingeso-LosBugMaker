// EN: backend/services/emailService.js
const nodemailer = require('nodemailer');

// 1. Configurar el "transportador" de correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Crear la función que envía el correo
const enviarEmailConfirmacion = async (usuario, reserva, cancha) => {
  const urlHistorial = 'http://localhost:3000/historial'; // Cambia esto por la URL de tu app en producción

  const mailOptions = {
    from: `"Pádel Ucenin" <${process.env.EMAIL_USER}>`,
    to: usuario.email,
    subject: 'Tu reserva en Pádel Ucenin está pendiente de confirmación',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hola, ${usuario.nombre}!</h2>
        <p>Gracias por reservar con nosotros. Tu reserva está casi lista, solo falta que la confirmes.</p>
        <p>Para confirmar, por favor visita tu historial de reservas y haz clic en el botón "Confirmar".</p>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Detalles de la Reserva</h3>
        <ul>
          <li><strong>Cancha:</strong> ${cancha.nombre}</li>
          <li><strong>Fecha:</strong> ${new Date(reserva.fecha).toLocaleDateString('es-CL')}</li>
          <li><strong>Horario:</strong> ${reserva.horaInicio} - ${reserva.horaTermino}</li>
          <li><strong>Requiere Equipamiento:</strong> ${reserva.requiereEquipamiento ? 'Sí' : 'No'}</li>
          <li><strong>Costo Equipamiento:</strong> $${reserva.costoEquipamiento}</li>
        </ul>
        
        <a href="${urlHistorial}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Ir a mi Historial de Reservas
        </a>
        
        <p style="margin-top: 20px; font-size: 0.9em; color: #777;">Si no has realizado esta reserva, puedes ignorar este correo.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de confirmación enviado a ${usuario.email}`);
  } catch (error) {
    console.error(`Error al enviar correo a ${usuario.email}:`, error);
  }
};
// --- NUEVA FUNCIÓN PARA ENVIAR RECORDATORIOS ---
const enviarEmailRecordatorio = async (usuario, reserva, cancha, diasRestantes) => {
  const urlHistorial = 'http://localhost:3000/historial'; // O la URL de producción
  
  let asunto = `Recordatorio de tu reserva en Pádel Ucenin`;
  let mensajePrincipal = `Te recordamos tu próxima reserva. ¡No la olvides!`;

  if (diasRestantes === 1) {
    asunto = `¡Tu reserva en Pádel Ucenin es mañana!`;
    mensajePrincipal = `¡Prepárate! Tu reserva es mañana. ¡Te esperamos!`;
  }

  const mailOptions = {
    from: `"Pádel Ucenin" <${process.env.EMAIL_USER}>`,
    to: usuario.email,
    subject: asunto,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hola, ${usuario.nombre}!</h2>
        <p>${mensajePrincipal}</p>
        
        <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Detalles de la Reserva</h3>
        <ul>
          <li><strong>Cancha:</strong> ${cancha.nombre}</li>
          <li><strong>Fecha:</strong> ${new Date(reserva.fecha).toLocaleDateString('es-CL')}</li>
          <li><strong>Horario:</strong> ${reserva.horaInicio} - ${reserva.horaTermino}</li>
        </ul>
        
        <a href="${urlHistorial}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Ver mis Reservas
        </a>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de recordatorio (${diasRestantes} días) enviado a ${usuario.email}`);
  } catch (error) {
    console.error(`Error al enviar recordatorio a ${usuario.email}:`, error);
  }
};

module.exports = { 
  enviarEmailConfirmacion,
  enviarEmailRecordatorio // <--- Asegúrate de exportar la nueva función
};