// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/database');
const User = require('./models/User');
// Importa otras entidades/modelos si los tienes
// const Cancha = require('./models/Cancha');

dotenv.config(); // Carga variables de .env

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a la Base de Datos
connectDB();

// Sincronizar modelos con la base de datos

sequelize.sync({ alter: true })
    .then(() => console.log('Modelos sincronizados con la base de datos.'))
    .catch(err => console.error('Error al sincronizar modelos:', err));


// Rutas de API
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API del Backend para Canchas Padel funcionando!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});