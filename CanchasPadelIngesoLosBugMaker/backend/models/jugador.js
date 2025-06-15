'use strict';
const { DataTypes } = require('sequelize');
// Asumimos que obtienes la instancia de sequelize de la misma forma que en tus otros modelos
const { sequelize } = require('../config/database'); 

// Usamos sequelize.define, igual que en tu modelo Reserva.js
const Jugador = sequelize.define('Jugador', {
  // Sequelize añade un 'id' por defecto como clave primaria
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
  // La columna 'reservaId' que lo conecta a una reserva
  // será añadida automáticamente por la asociación en 'models/index.js'
}, {
  tableName: 'jugadores', // Nombre explícito de la tabla
  timestamps: true // Mantenemos los timestamps createdAt y updatedAt
});

// Exportamos directamente el modelo, igual que en tus otros archivos
module.exports = Jugador;
