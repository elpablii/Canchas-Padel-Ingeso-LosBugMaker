const express = require('express');
const router = express.Router();
const { Equipamiento } = require('../models');

// --- RUTA PÚBLICA PARA OBTENER EL INVENTARIO ---
// GET /api/equipamiento
router.get('/', async (req, res) => {
    try {
        const inventario = await Equipamiento.findAll({
            where: {
                stock: {
                    [require('sequelize').Op.gt]: 0 // Solo mostrar artículos con stock
                }
            },
            order: [['tipo', 'ASC'], ['nombre', 'ASC']]
        });
        res.status(200).json(inventario);
    } catch (error) {
        console.error('Error al obtener el inventario de equipamiento:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;