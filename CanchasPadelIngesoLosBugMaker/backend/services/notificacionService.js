const { User, Notificacion } = require('../models');

/**
 * Crea una notificación para todos los usuarios
 * @param {string} tipo - Tipo de notificación (NUEVA_CANCHA, ELIMINACION_CANCHA, etc.)
 * @param {string} mensaje - Mensaje de la notificación
 */
const notificarATodos = async (tipo, mensaje) => {
  try {
    // Obtener todos los usuarios
    const usuarios = await User.findAll({
      attributes: ['rut']
    });

    // Crear notificaciones para cada usuario
    const notificaciones = usuarios.map(usuario => ({
      tipo,
      mensaje,
      userRut: usuario.rut,
      leida: false
    }));

    // Guardar todas las notificaciones
    await Notificacion.bulkCreate(notificaciones);
    
    console.log(`Notificaciones de tipo ${tipo} creadas para ${usuarios.length} usuarios`);
  } catch (error) {
    console.error('Error al crear notificaciones:', error);
    throw error;
  }
};

/**
 * Crea una notificación para un usuario específico
 * @param {string} userRut - RUT del usuario
 * @param {string} tipo - Tipo de notificación
 * @param {string} mensaje - Mensaje de la notificación
 */
const notificarUsuario = async (userRut, tipo, mensaje) => {
  try {
    await Notificacion.create({
      tipo,
      mensaje,
      userRut,
      leida: false
    });
    console.log(`Notificación de tipo ${tipo} creada para usuario ${userRut}`);
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

/**
 * Marca una notificación como leída
 * @param {number} notificacionId - ID de la notificación
 */
const marcarComoLeida = async (notificacionId) => {
  try {
    await Notificacion.update(
      { leida: true },
      { where: { id: notificacionId } }
    );
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};

/**
 * Obtiene las notificaciones no leídas de un usuario
 * @param {string} userRut - RUT del usuario
 */
const obtenerNotificacionesNoLeidas = async (userRut) => {
  try {
    return await Notificacion.findAll({
      where: {
        userRut,
        leida: false
      },
      order: [['createdAt', 'DESC']]
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

module.exports = {
  notificarATodos,
  notificarUsuario,
  marcarComoLeida,
  obtenerNotificacionesNoLeidas
}; 