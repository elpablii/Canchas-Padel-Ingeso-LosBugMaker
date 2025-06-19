const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reserva = sequelize.define('Reserva', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY, 
    allowNull: false,
    field: 'fechaReserva',
    comment: 'Fecha para la cual se realiza la reserva',
  },
  horaInicio: {
    type: DataTypes.TIME, 
    allowNull: false,
    comment: 'Hora de inicio de la reserva',
  },
  horaTermino: {
    type: DataTypes.TIME, 
    allowNull: false,
    comment: 'Hora de finalización de la reserva',
    validate: {
      isTimeValid() {
        if (this.horaTermino <= this.horaInicio) {
          throw new Error('La hora de fin debe ser posterior a la de inicio.');
        }
      }
    }
  },
  requiereEquipamiento: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el usuario solicitó equipamiento (true/false)',
  },
  costoEquipamiento: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: true,
      min: 0,
    },
    comment: 'Costo del equipamiento solicitado.',
  },
  // --- CAMPO AÑADIDO ---
  costoTotalReserva: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Costo total de la reserva (cancha + equipamiento) en el momento de la creación.'
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
  recordatorio3dEnviado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recordatorio1dEnviado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
}, {
  tableName: 'reservas',
  timestamps: true,
  comment: 'Tabla para almacenar las reservas de las canchas de pádel',
});

module.exports = Reserva;


