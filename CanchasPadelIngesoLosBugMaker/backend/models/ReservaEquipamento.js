'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReservaEquipamiento = sequelize.define('ReservaEquipamiento', {
  // El 'id' se crea automáticamente
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
  // Las columnas 'reservaId' y 'equipamientoId' se añadirán
  // automáticamente por las asociaciones que definiste en 'models/index.js'
}, {
  tableName: 'reserva_equipamientos', // Nombre de la tabla en la base de datos
  timestamps: true
});

module.exports = ReservaEquipamiento;