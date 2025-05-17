// backend/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Para cargar las variables de .env

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        port: process.env.DB_PORT,
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la BDD establecida exitosamente.');
       
    } catch (error) {
        console.error('No se pudo conectar a la BDD:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };