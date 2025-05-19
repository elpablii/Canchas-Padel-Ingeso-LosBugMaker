// backend/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Importa la instancia de Sequelize

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_rut',
      msg: 'El RUT ingresado ya está registrado.',
    },
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
  // Puedes añadir más campos según necesites, por ejemplo:
  // nombre: {
  //   type: DataTypes.STRING,
  //   allowNull: true, // o false si es obligatorio
  // },
  // rol: {
  //   type: DataTypes.STRING,
  //   defaultValue: 'socio', // ej: 'socio', 'admin'
  //   allowNull: false,
  // }
}, {
  tableName: 'users', // Nombre explícito de la tabla
  timestamps: true,   // Habilita createdAt y updatedAt (por defecto es true)
  // paranoid: true,  // Si quieres borrado lógico (soft delete), añade un campo `deletedAt`
});

module.exports = User;