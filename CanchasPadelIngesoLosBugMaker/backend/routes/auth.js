// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Ya lo teníamos importado
const { Op } = require('sequelize');
const User = require('../models/User');

// --- Función Helper para Validar RUT Chileno (si la tienes aquí) ---
const validarRutChileno = (rutCompleto) => {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rutCompleto)) return false;
    const [rut, dv] = rutCompleto.split('-');
    let M = 0, S = 1;
    for (; rut; S = (S + rut % 10 * (9 - M++ % 6)) % 11);
    const dvCalculado = S ? S - 1 : 'k';
    return dvCalculado.toString() === dv.toLowerCase();
};

// --- Ruta de Registro: POST /api/auth/register ---
router.post('/register', async (req, res) => {
    try {
        const { rut, email, password } = req.body;

        if (!rut || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios para el registro.' });
        }
        if (!validarRutChileno(rut.trim())) {
            return res.status(400).json({ message: 'El RUT no es válido para el registro.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        const existingUser = await User.findOne({
            where: { [Op.or]: [{ rut: rut.trim() }, { email: email }] }
        });

        if (existingUser) {
            return res.status(409).json({ message: 'El RUT o email ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            rut: rut.trim(),
            email: email,
            password: hashedPassword,
            // rol: 'socio' // Si tienes un campo rol, asígnale un valor por defecto
        });

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: { id: newUser.id, rut: newUser.rut, email: newUser.email /*, rol: newUser.rol */ }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
    }
});

// --- Ruta de Login: POST /api/auth/login ---
router.post('/login', async (req, res) => {
    try {
        const { rut, password } = req.body;

        // 1. Validar que se envíen RUT y contraseña
        if (!rut || !password) {
            return res.status(400).json({ message: 'El RUT y la contraseña son obligatorios.' });
        }

        // 2. Buscar al usuario por RUT en la base de datos
        const user = await User.findOne({ where: { rut: rut.trim() } });

        // 3. Si el usuario no existe, devolver error
        if (!user) {
            // Usamos un mensaje genérico para no revelar si un RUT existe o no
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 4. Comparar la contraseña enviada con la almacenada (hasheada)
        const isMatch = await bcrypt.compare(password, user.password);

        // 5. Si la contraseña no coincide, devolver error
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 6. Si las credenciales son correctas, generar un JWT
        const payload = {
            user: {
                id: user.id,
                rut: user.rut,
                email: user.email,
                // rol: user.rol // Incluye el rol si lo tienes y es relevante para el frontend
            }
        };

        // Firmar el token con el secreto del .env y establecer una expiración
        // JWT_SECRET debe estar en tu archivo .env
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // El token expirará en 1 hora (puedes ajustarlo: '7d', '30m', etc.)
        );

        // 7. Enviar el token y la información del usuario (sin la contraseña) al cliente
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.id,
                rut: user.rut,
                email: user.email,
                // rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
    }
});

module.exports = router;