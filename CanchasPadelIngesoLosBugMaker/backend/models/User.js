// backend/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    rut: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            name: 'unique_rut',
            msg: 'El RUT ingresado ya está registrado.'
        },
        
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            name: 'unique_email',
            msg: 'El email ingresado ya está registrado.'
        },
        validate: {
            isEmail: {
                msg: 'Debe proporcionar una dirección de email válida.'
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        
    }
    
}, {
    
    tableName: 'users', 
    timestamps: true,
    
});

module.exports = User;