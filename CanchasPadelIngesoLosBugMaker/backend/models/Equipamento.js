'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipamiento = sequelize.define('Equipamiento', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tipo: {
    type: DataTypes.ENUM(
      'Pala de Padel',
      'Pelotas de Padel',
      'Equipamento de Pista',
      'Calzado'
    ),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  costo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'equipamientos',
  timestamps: true
});

module.exports = Equipamiento;