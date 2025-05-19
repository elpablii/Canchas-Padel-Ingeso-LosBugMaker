// backend/config/database.js
require('dotenv').config(); // Carga las variables de entorno del archivo .env

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: console.log, // Muestra las consultas SQL en la consola (puedes quitarlo o ponerlo en false en producción)
    dialectOptions: {
      // Opciones específicas del dialecto si son necesarias
      // Por ejemplo, para SSL con PostgreSQL en producción:
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false // Ajusta según tu configuración de SSL
      // }
    },
    pool: { // Configuración opcional del pool de conexiones
      max: 5, // Número máximo de conexiones en el pool
      min: 0, // Número mínimo de conexiones en el pool
      acquire: 30000, // Tiempo máximo, en milisegundos, que el pool intentará obtener una conexión antes de lanzar un error
      idle: 10000 // Tiempo máximo, en milisegundos, que una conexión puede estar inactiva antes de ser liberada
    }
  }
);

// Función para probar la conexión a la base de datos
const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la BDD establecida exitosamente.');
  } catch (error) {
    console.error('No se pudo conectar a la BDD:', error);
    // Considera terminar el proceso si la BDD es crucial para el arranque
    // process.exit(1);
  }
};

module.exports = { sequelize, testDbConnection };