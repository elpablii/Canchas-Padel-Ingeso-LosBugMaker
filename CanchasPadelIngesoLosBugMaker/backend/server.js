// backend/server.js
require('dotenv').config(); // Carga variables de entorno

const express = require('express');
const cors = require('cors'); // Para permitir peticiones desde otros dominios (tu frontend)
const morgan = require('morgan'); // Logger de peticiones HTTP

const { sequelize, testDbConnection } = require('./config/database'); // Config de Sequelize
const User = require('./models/User');
const Cancha = require('./models/Cancha');
const reservaRoutes = require('./routes/reservas');
// Importa otros modelos aquí a medida que los crees:
// const Reserva = require('./models/Reserva');

// Importar rutas
const authRoutes = require('./routes/auth');
// const canchasRoutes = require('./routes/canchas'); // Ejemplo para futuras rutas
// const reservasRoutes = require('./routes/reservas'); // Ejemplo para futuras rutas

const app = express();
const PORT = process.env.PORT || 3001; // Puerto del servidor

// --- Middlewares ---
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Permite a Express entender payloads JSON
app.use(express.urlencoded({ extended: true })); // Permite a Express entender payloads URL-encoded
app.use(morgan('dev')); // Logger de peticiones en formato 'dev'

// --- Rutas ---
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Canchas Pádel Ucenin V2 (PostgreSQL)' });
});

app.use('/api/auth', authRoutes); // Rutas de autenticación bajo /api/auth

app.use('/api/reservas', reservaRoutes);
// app.use('/api/canchas', canchasRoutes); // Ejemplo
// app.use('/api/reservas', reservasRoutes); // Ejemplo

// --- Sincronización con la Base de Datos y Arranque del Servidor ---
const startServer = async () => {
  try {
    // 1. Probar conexión a la BDD
    await testDbConnection();

    // 2. Sincronizar modelos con la BDD
    // { alter: true } intentará modificar las tablas existentes para que coincidan con el modelo.
    // { force: true } borrará las tablas y las recreará (¡cuidado en producción!).
    // Sin opciones, creará las tablas si no existen, pero no modificará las existentes.
    await sequelize.sync({ alter: true }); // Opciones: { force: false }, { alter: true }
    console.log('Modelos sincronizados con la base de datos.');

    // 3. Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1); // Termina el proceso si hay un error crítico al iniciar
  }
};

startServer();