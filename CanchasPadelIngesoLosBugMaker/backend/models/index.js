// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); 
const basename = path.basename(__filename);
const db = {};

// Cargar dinámicamente todos los archivos de modelos
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Aplicar asociaciones si los modelos tienen un método 'associate'
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Este es el método estándar si defines 'associate' en tus modelos
  }
});

// --- Definición explícita de Asociaciones (Si no usas el método .associate en cada modelo) ---
const User = db.User;
const Cancha = db.Cancha;
const Reserva = db.Reserva;
const Jugador = db.Jugador;

if (User && Reserva && Cancha) {
  // User <-> Reserva
  User.hasMany(Reserva, {
    foreignKey: { name: 'userRut', type: DataTypes.STRING, allowNull: false },
    as: 'userReservas' // Alias para las reservas de un usuario
  });
  Reserva.belongsTo(User, {
    foreignKey: { name: 'userRut', type: DataTypes.STRING, allowNull: false },
    as: 'usuario' // Alias para el usuario de una reserva
  });

  // Cancha <-> Reserva
  Cancha.hasMany(Reserva, {
    foreignKey: { name: 'canchaId', type: DataTypes.INTEGER, allowNull: false },
    as: 'canchaReservas' // Alias para las reservas de una cancha
  });
  Reserva.belongsTo(Cancha, {
    foreignKey: { name: 'canchaId', type: DataTypes.INTEGER, allowNull: false },
    as: 'cancha' // Alias para la cancha de una reserva
  });

    // Reserva <-> Jugador
  Reserva.hasMany(Jugador, {
    as: 'jugadores',
    foreignKey: {
        name: 'reservaId',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    onDelete: 'CASCADE'
  });
  Jugador.belongsTo(Reserva, {
    foreignKey: {
        name: 'reservaId',
        type: DataTypes.INTEGER,
        allowNull: false
    }
  });

  console.log("Asociaciones User-Reserva y Cancha-Reserva definidas con alias únicos.");
} else {
  console.error("Error al definir asociaciones: Uno o más modelos (User, Cancha, Reserva) no se cargaron correctamente.");
  // ... (logs de error para modelos no cargados)
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
