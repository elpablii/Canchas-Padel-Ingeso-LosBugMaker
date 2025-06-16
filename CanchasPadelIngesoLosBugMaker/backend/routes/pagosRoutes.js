// backend/routes/pagosRoutes.js
const express = require('express');
const router = express.Router();
const { Reserva, User, Cancha, sequelize } = require('../models');
const { Op } = require('sequelize');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Middleware para proteger todas las rutas de este archivo
router.use(verificarToken, verificarAdmin);

/**
 * RUTA: GET /api/pagos/historial
 * DESCRIPCIÓN: Obtiene una lista de todos los pagos realizados,
 * derivado de las reservas confirmadas y completadas.
 */
router.get('/historial', async (req, res) => {
    try {
        const pagos = await Reserva.findAll({
            where: {
                // Consideramos un pago si la reserva fue confirmada o completada
                estadoReserva: { [Op.in]: ['Confirmada', 'Completada'] }
            },
            include: [
                { model: User, as: 'usuario', attributes: ['rut', 'nombre'] },
                { model: Cancha, as: 'cancha', attributes: ['nombre'] }
            ],
            order: [['createdAt', 'DESC']] // Ordenamos por fecha de pago (creación de la reserva)
        });

        // Calculamos el costo total para cada "pago"
        const historialDePagos = pagos.map(pago => {
            const duracionEnHoras = (new Date(`1970-01-01T${pago.horaTermino}Z`) - new Date(`1970-01-01T${pago.horaInicio}Z`)) / (1000 * 60 * 60);
            const costoCancha = duracionEnHoras * 15000; // O podrías usar pago.cancha.costo si lo incluyes
            const costoTotal = costoCancha + parseFloat(pago.costoEquipamiento);

            return {
                id: pago.id,
                fechaPago: pago.createdAt,
                monto: costoTotal,
                usuario: pago.usuario,
                cancha: pago.cancha
            };
        });

        res.status(200).json(historialDePagos);
    } catch (error) {
        console.error('Error al obtener el historial de pagos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


/**
 * RUTA: GET /api/pagos/resumen
 * DESCRIPCIÓN: Calcula las ganancias totales del mes y año actual.
 */
router.get('/resumen', async (req, res) => {
    try {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

        const calcularGanancias = async (fechaInicio) => {
            const reservas = await Reserva.findAll({
                where: {
                    estadoReserva: { [Op.in]: ['Confirmada', 'Completada'] },
                    createdAt: { [Op.gte]: fechaInicio } // Pagos desde la fecha de inicio
                }
            });

            let total = 0;
            reservas.forEach(reserva => {
                const duracionEnHoras = (new Date(`1970-01-01T${reserva.horaTermino}Z`) - new Date(`1970-01-01T${reserva.horaInicio}Z`)) / (1000 * 60 * 60);
                total += (duracionEnHoras * 15000) + parseFloat(reserva.costoEquipamiento);
            });
            return total;
        };

        const gananciasMes = await calcularGanancias(inicioMes);
        const gananciasAnio = await calcularGanancias(inicioAnio);

        res.status(200).json({
            gananciasMesActual: gananciasMes,
            gananciasAnioActual: gananciasAnio
        });

    } catch (error) {
        console.error('Error al obtener el resumen de pagos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;