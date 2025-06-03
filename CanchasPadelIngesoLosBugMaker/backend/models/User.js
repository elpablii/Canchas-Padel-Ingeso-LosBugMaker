// backend/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Importa la instancia de Sequelize

const User = sequelize.define('User', {
  rut: { // Asumiendo que RUT es tu clave primaria ahora
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: 'RUT del usuario, formato XXXXXXXX-X. Es la clave primaria.',
  },
  nombre: { 
    type: DataTypes.STRING,
    allowNull: false, 
    validate: {
      notEmpty: {
        msg: 'El nombre no puede estar vacío.'
      },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres.'
      }
    },
    comment: 'Nombre completo del usuario.',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'El email ingresado ya está registrado.',
    },
    validate: {
      isEmail: {
        msg: 'Debe proporcionar una dirección de email válida.',
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: { // NUEVO CAMPO ROL
    type: DataTypes.ENUM('admin', 'socio'), // Define los roles posibles
    allowNull: false,
    defaultValue: 'socio', // Rol por defecto para nuevos usuarios
    comment: 'Rol del usuario (admin o socio)',
  }
  // createdAt y updatedAt se añaden automáticamente.
}, {
  tableName: 'users', // Nombre explícito de la tabla
  timestamps: true,   // Habilita createdAt y updatedAt (por defecto es true)
});

module.exports = User;
