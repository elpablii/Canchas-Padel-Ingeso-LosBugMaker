// backend/models/Reserva.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Cancha = require('./Cancha');

const Reserva = sequelize.define('Reserva', {
  
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: 'ID de la reserva',
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha de la reserva (formato YYYY-MM-DD)',
  },
  horaInicio: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Hora de inicio de la reserva (HH:mm)',
  },
  horaFin: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Hora de fin de la reserva (HH:mm)',

    validate: {
      isTimeValid() {
        if (this.horaFin <= this.horaInicio) {
          throw new Error('La hora de fin debe ser posterior a la de inicio.');
        }
      }
    }
  },
  equipamiento: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Indica si se requiere equipamiento (true/false)',
  },
  boletaEquipamiento: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Código de boleta de equipamiento (si corresponde)',
  },
  rutReserva: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'RUT de quien hace la reserva',
    validate: {
      notEmpty: true,
      len: [8, 12], 
    }
  },
  cancelada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'reservas',
  timestamps: true,
  comment: 'Tabla de reservas de canchas, con horario, equipamiento y RUT del usuario',
});

// Relaciones
Reserva.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });
Reserva.belongsTo(Cancha, { foreignKey: 'canchaId', as: 'cancha' });

module.exports = Reserva;