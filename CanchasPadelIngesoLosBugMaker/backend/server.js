// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = 'morgan'; // Corrección: morgan es un string para el require

// Si estás usando el archivo models/index.js, esta es la forma correcta de importar
const db = require('./models'); 
// Si NO estás usando models/index.js, entonces necesitarías importar sequelize de config/database
// y cada modelo individualmente:
// const { sequelize, testDbConnection } = require('./config/database');
// const User = require('./models/User');
// const Cancha = require('./models/Cancha');
// const Reserva = require('./models/Reserva');

const { testDbConnection } = require('./config/database'); // Puedes mantener esto para la prueba de conexión inicial

// Importar rutas existentes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes'); 
// const canchasRoutes = require('./routes/canchasRoutes'); // <--- LÍNEA COMENTADA
const reservaRoutes = require('./routes/reservas'); 
const availabilityRoutes = require('./routes/disponibilidad');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Corrección: uso de morgan
const morganLogger = require('morgan'); // Importar morgan correctamente
app.use(morganLogger('dev')); // Usar la variable importada

// --- Rutas ---
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Canchas Pádel Ucenin V2 (PostgreSQL)' });
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/canchas', canchasRoutes); // <--- LÍNEA COMENTADA
app.use('/api/reservas', reservaRoutes); // Asegúrate que este archivo exista o coméntalo también
app.use('/api/disponibilidad', availabilityRoutes); // Asegúrate que este archivo exista o coméntalo también


// --- Sincronización y Arranque ---
const startServer = async () => {
  try {
    await testDbConnection(); // O db.sequelize.authenticate() si usas db de models/index.js
    console.log('Conexión a la BDD verificada exitosamente (desde server.js).');

    // Si estás usando migraciones, la siguiente línea debe estar comentada:
    // await db.sequelize.sync({ alter: true }); 
    // console.log('Modelos sincronizados (si sync está activo y usas db de models/index.js).');

    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
