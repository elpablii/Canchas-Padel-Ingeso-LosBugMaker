const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('NUEVA_CANCHA', 'ELIMINACION_CANCHA', 'RESERVA', 'OTRO'),
    allowNull: false,
    comment: 'Tipo de notificación',
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Mensaje de la notificación',
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si la notificación ha sido leída',
  },
  userRut: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'RUT del usuario al que va dirigida la notificación',
  }
}, {
  tableName: 'notificaciones',
  timestamps: true,
  comment: 'Tabla para almacenar las notificaciones de los usuarios',
});

module.exports = Notificacion; 