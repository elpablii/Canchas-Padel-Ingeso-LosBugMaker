const notificacionRoutes = require('./routes/notificacionRoutes');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificaciones', notificacionRoutes); 