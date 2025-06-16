const notificacionRoutes = require('./routes/notificacionRoutes');
const equipamientoRoutes = require('./routes/equipamientoRoutes');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificaciones', notificacionRoutes); 
app.use('/api/equipamiento', equipamientoRoutes);