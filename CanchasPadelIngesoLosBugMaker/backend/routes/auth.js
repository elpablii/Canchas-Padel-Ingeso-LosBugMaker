// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');


const validarRutChileno = (rutCompleto) => {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rutCompleto)) {
        return false;
    }
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

        // 1. Validar que los campos no estén vacíos
        if (!rut || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios: RUT, email y contraseña.' });
        }

        // 2. Validar formato y dígito verificador del RUT
        const rutLimpio = rut.trim();
        if (!validarRutChileno(rutLimpio)) {
            return res.status(400).json({ message: 'El RUT ingresado no es válido o tiene un formato incorrecto (ej: 12345678-9).' });
        }

        // 3. Validar formato de Email (expresión regular simple, Sequelize también valida)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'El formato del email no es válido.' });
        }

        // 4. Validar contraseña (ej. longitud mínima)
        const MIN_PASSWORD_LENGTH = 6;
        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });
        }

        // 5. Verificar si el usuario ya existe (por RUT o Email)
        
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ rut: rutLimpio }, { email: email }]
            }
        });

        if (existingUser) {
            if (existingUser.rut === rutLimpio) {
                return res.status(409).json({ message: 'El RUT ingresado ya está registrado.' });
            }
            if (existingUser.email === email) {
                return res.status(409).json({ message: 'El email ingresado ya está registrado.' });
            }
        }

        // 6. Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 7. Crear nuevo usuario en la base de datos
        const newUser = await User.create({
            rut: rutLimpio,
            email: email,
            password: hashedPassword,
        });

        // 8. Respuesta exitosa
        
        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: {
                id: newUser.id,
                rut: newUser.rut,
                email: newUser.email,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Error en el proceso de registro:', error);

        // Manejo específico de errores de Sequelize
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Este error puede surgir si, a pesar de la verificación previa,
            // hay una condición de carrera o si la base de datos detecta la duplicidad primero.
            // Los mensajes de error del modelo User.js (unique.msg) se pueden usar aquí.
            const field = error.errors[0]?.path;
            const customMessage = error.errors[0]?.message || `El ${field} ya está en uso.`;
            return res.status(409).json({ message: customMessage });
        }
        if (error.name === 'SequelizeValidationError') {
            // Errores de validación definidos en el modelo (ej. formato de email incorrecto a nivel de BDD)
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Error de validación de datos.', errors: messages });
        }

        // Error genérico del servidor
        res.status(500).json({ message: 'Ocurrió un error en el servidor al intentar registrar el usuario.' });
    }
});

module.exports = router;