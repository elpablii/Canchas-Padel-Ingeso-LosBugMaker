// backend/models/Reserva.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reserva = sequelize.define('Reserva', {
  id: { // Corresponde a tu id_reserva
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  // userRut y canchaId serán añadidas por Sequelize y definidas en models/index.js
  fecha: {
    type: DataTypes.DATEONLY, 
    allowNull: false,
    field: 'fechaReserva', // <-- AÑADE ESTA LÍNEA
    comment: 'Fecha para la cual se realiza la reserva',
  },
  horaInicio: { // Corresponde a tu hora_inicio
    type: DataTypes.TIME, 
    allowNull: false,
    comment: 'Hora de inicio de la reserva',
  },
  horaTermino: { // Corresponde a tu hora_termino
    type: DataTypes.TIME, 
    allowNull: false,
    comment: 'Hora de finalización de la reserva',
    validate: { // Buena validación, la mantendremos
      isTimeValid() {
        if (this.horaTermino <= this.horaInicio) {
          throw new Error('La hora de fin debe ser posterior a la de inicio.');
        }
      }
    }
  },
  requiereEquipamiento: { // Corresponde a tu equipamiento (sí o no)
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el usuario solicitó equipamiento (true/false)',
  },
  costoEquipamiento: { // Corresponde a tu boleta_equipamiento
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: true,
      min: 0,
    },
    comment: 'Costo del equipamiento solicitado. Será 0 si requiereEquipamiento es false.',
  },
  estadoReserva: { 
    type: DataTypes.ENUM(
      'Pendiente', 
      'Confirmada', 
      'CanceladaPorUsuario', 
      'CanceladaPorAdmin', 
      'Completada', 
      'NoAsistio'
    ),
    allowNull: false,
    defaultValue: 'Pendiente',
    comment: 'Estado actual de la reserva',
  },
}, {
  tableName: 'reservas',
  timestamps: true,
  comment: 'Tabla para almacenar las reservas de las canchas de pádel',
});

module.exports = Reserva;
