// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');

// --- Función Helper para Validar RUT Chileno ---
const validarRutChileno = (rutCompleto) => {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rutCompleto)) return false;
    const [rutNum, dv] = rutCompleto.split('-');
    let M = 0, S = 1;
    for (let i = rutNum.length - 1; i >= 0; i--) {
        S = (S + parseInt(rutNum.charAt(i)) * (9 - M++ % 6)) % 11;
    }
    const dvCalculado = S ? (S - 1).toString() : 'k';
    return dvCalculado === dv.toLowerCase();
};

// --- Ruta de Registro: POST /api/auth/register ---
router.post('/register', async (req, res) => {
    const requestTimestamp = new Date().toISOString();
    console.log(`\n[${requestTimestamp}] --- INICIO PETICIÓN /api/auth/register ---`);
    console.log(`[${requestTimestamp}] Datos recibidos (req.body):`, JSON.stringify(req.body, null, 2));

    try {
        const { rut, email, password } = req.body;

        // 1. Validación de campos obligatorios
        if (!rut || !email || !password) {
            console.log(`[${requestTimestamp}] REGISTER_VALIDATION_FAIL: Campos obligatorios faltantes.`);
            return res.status(400).json({ message: 'Todos los campos son obligatorios para el registro.' });
        }
        console.log(`[${requestTimestamp}] REGISTER_VALIDATION_PASS: Campos obligatorios presentes.`);

        const trimmedRut = rut.trim();
        // 2. Validación de RUT
        if (!validarRutChileno(trimmedRut)) {
            console.log(`[${requestTimestamp}] REGISTER_VALIDATION_FAIL: RUT inválido - ${trimmedRut}`);
            return res.status(400).json({ message: 'El RUT no es válido para el registro.' });
        }
        console.log(`[${requestTimestamp}] REGISTER_VALIDATION_PASS: Formato de RUT válido.`);

        // 3. Validación de longitud de contraseña
        if (password.length < 6) {
            console.log(`[${requestTimestamp}] REGISTER_VALIDATION_FAIL: Contraseña demasiado corta.`);
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
        }
        console.log(`[${requestTimestamp}] REGISTER_VALIDATION_PASS: Longitud de contraseña válida.`);

        // 4. Verificar si el usuario ya existe
        console.log(`[${requestTimestamp}] DB_QUERY_START: Buscando usuario existente por RUT (${trimmedRut}) o Email (${email})...`);
        const existingUser = await User.findOne({
            where: { [Op.or]: [{ rut: trimmedRut }, { email: email }] }
        });

        if (existingUser) {
            console.log(`[${requestTimestamp}] DB_QUERY_RESULT: Usuario ya existe.`, existingUser.toJSON());
            return res.status(409).json({ message: 'El RUT o email ya está registrado.' });
        }
        console.log(`[${requestTimestamp}] DB_QUERY_RESULT: Usuario no encontrado, se puede proceder con el registro.`);

        // 5. Hashear contraseña
        console.log(`[${requestTimestamp}] AUTH_OP: Hasheando contraseña...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`[${requestTimestamp}] AUTH_OP_SUCCESS: Contraseña hasheada.`);

        // 6. Crear nuevo usuario en la BDD
        console.log(`[${requestTimestamp}] DB_OP_START: Intentando crear usuario en la BDD con datos: { rut: "${trimmedRut}", email: "${email}", password: "***HASHED***" }`);
        const newUser = await User.create({
            rut: trimmedRut,
            email: email,
            password: hashedPassword,
        });
        console.log(`[${requestTimestamp}] DB_OP_SUCCESS: Usuario creado exitosamente en la BDD.`, newUser.toJSON());

        // 7. Respuesta exitosa
        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: { id: newUser.id, rut: newUser.rut, email: newUser.email }
        });
        console.log(`[${requestTimestamp}] RESPONSE_SENT: 201 - Usuario registrado.`);

    } catch (error) {
        console.error(`\n[${requestTimestamp}] --- ERROR EN /api/auth/register (Bloque Catch) ---`);
        console.error(`[${requestTimestamp}] Error Completo:`, error);
        console.error(`[${requestTimestamp}] Nombre del Error:`, error.name);
        if (error.errors && error.errors.length > 0) {
             console.error(`[${requestTimestamp}] Detalles del Error de Sequelize:`, JSON.stringify(error.errors[0], null, 2));
        }
        console.error(`[${requestTimestamp}] --- FIN ERROR ---`);

        if (!res.headersSent) {
            if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
                return res.status(400).json({ message: error.errors[0].message });
            }
            return res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
        }
    }
    console.log(`[${requestTimestamp}] --- FIN PETICIÓN /api/auth/register ---`);
});

// --- Ruta de Login: POST /api/auth/login ---
router.post('/login', async (req, res) => {
    const requestTimestamp = new Date().toISOString();
    console.log(`\n[${requestTimestamp}] --- INICIO PETICIÓN /api/auth/login ---`);
    console.log(`[${requestTimestamp}] Datos recibidos (req.body):`, JSON.stringify(req.body, null, 2));

    try {
        const { rut, password } = req.body;

        if (!rut || !password) {
            console.log(`[${requestTimestamp}] LOGIN_VALIDATION_FAIL: RUT y contraseña son obligatorios.`);
            return res.status(400).json({ message: 'El RUT y la contraseña son obligatorios.' });
        }
        console.log(`[${requestTimestamp}] LOGIN_VALIDATION_PASS: Campos obligatorios presentes.`);

        const trimmedRut = rut.trim();
        console.log(`[${requestTimestamp}] DB_QUERY_START: Buscando usuario por RUT (${trimmedRut})...`);
        const user = await User.findOne({ where: { rut: trimmedRut } });

        if (!user) {
            console.log(`[${requestTimestamp}] DB_QUERY_RESULT: Usuario no encontrado con RUT ${trimmedRut}.`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        console.log(`[${requestTimestamp}] DB_QUERY_RESULT: Usuario encontrado.`, user.toJSON());

        console.log(`[${requestTimestamp}] AUTH_OP: Comparando contraseñas...`);
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`[${requestTimestamp}] AUTH_OP_FAIL: Contraseña no coincide.`);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        console.log(`[${requestTimestamp}] AUTH_OP_SUCCESS: Contraseña coincide.`);

        console.log(`[${requestTimestamp}] JWT_OP: Generando token...`);
        const payload = {
            user: { id: user.id, rut: user.rut, email: user.email /*, rol: user.rol */ }
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`[${requestTimestamp}] JWT_OP_SUCCESS: Token generado.`);
        
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: { id: user.id, rut: user.rut, email: user.email /*, rol: user.rol */ }
        });
        console.log(`[${requestTimestamp}] RESPONSE_SENT: 200 - Inicio de sesión exitoso.`);

    } catch (error) {
        console.error(`\n[${requestTimestamp}] --- ERROR EN /api/auth/login (Bloque Catch) ---`);
        console.error(`[${requestTimestamp}] Error Completo:`, error);
        console.error(`[${requestTimestamp}] Nombre del Error:`, error.name);
        console.error(`[${requestTimestamp}] --- FIN ERROR ---`);

        if (!res.headersSent) {
            return res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
        }
    }
    console.log(`[${requestTimestamp}] --- FIN PETICIÓN /api/auth/login ---`);
});

module.exports = router;
