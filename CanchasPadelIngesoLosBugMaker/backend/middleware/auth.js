const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verificarToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userRut = decoded.user?.rut;
        if (!userRut) {
            return res.status(401).json({ message: 'Token inválido: rut no encontrado' });
        }
        const user = await User.findByPk(userRut);

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        console.error('Error en verificarToken:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const verificarAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        if (req.user.rol !== 'admin') {
            return res.status(403).json({ message: 'No autorizado. Se requieren privilegios de administrador' });
        }

        next();
    } catch (error) {
        console.error('Error en verificarAdmin:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    verificarToken,
    verificarAdmin
}; 