'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReservaEquipamiento = sequelize.define('ReservaEquipamiento', {
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }

}, {
  tableName: 'reserva_equipamientos', 
});

module.exports = ReservaEquipamiento;