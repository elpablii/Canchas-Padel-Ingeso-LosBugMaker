// backend/models/Cancha.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cancha = sequelize.define('Cancha', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_nombre_cancha',
      msg: 'Ya existe una cancha con este nombre.',
    },
    comment: 'Nombre identificador de la cancha, ej: "Cancha 1", "Cancha Principal"',
  },
  costo: { // Anteriormente 'precioPorHora', ahora 'costo' según tu especificación
    type: DataTypes.DECIMAL(10, 2), // DECIMAL es bueno para valores monetarios, permite 2 decimales.
    allowNull: false, // Asumimos que todas las canchas tienen un costo definido.
    validate: {
      isDecimal: { // O isInt si usas DataTypes.INTEGER
        msg: 'El costo debe ser un número.',
      },
      min: {
        args: [0],
        msg: 'El costo no puede ser negativo.',
      }
    },
    comment: 'Costo de la reserva de la cancha (por hora o por turno, según definas su uso)',
  }
  
}, {
  tableName: 'canchas', // Nombre explícito de la tabla en la base de datos
  timestamps: true,    // Habilita createdAt y updatedAt
  comment: 'Tabla para almacenar la información y costos de las canchas de pádel',
});

module.exports = Cancha;
