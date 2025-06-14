const express = require('express');
const router = express.Router();
const { Notificacion } = require('../models');
const { verificarToken } = require('../middleware/auth');

// Obtener todas las notificaciones de un usuario
router.get('/:userRut', verificarToken, async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: {
        userRut: req.params.userRut
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
  }
});

// Marcar una notificación como leída
router.put('/:id/leer', verificarToken, async (req, res) => {
  try {
    const notificacion = await Notificacion.findByPk(req.params.id);
    
    if (!notificacion) {
      return res.status(404).json({ mensaje: 'Notificación no encontrada' });
    }

    // Verificar que la notificación pertenece al usuario
    if (notificacion.userRut !== req.user.rut) {
      return res.status(403).json({ mensaje: 'No autorizado' });
    }

    await notificacion.update({ leida: true });
    res.json({ mensaje: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ mensaje: 'Error al marcar notificación como leída' });
  }
});

module.exports = router; 