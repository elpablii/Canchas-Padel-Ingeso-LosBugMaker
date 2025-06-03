// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User'); // Tu User.js actualizado será usado aquí

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
        const { rut, nombre, email, password } = req.body;

        if (!rut || !nombre || !email || !password) {
            console.log(`[${requestTimestamp}] REGISTER_VALIDATION_FAIL: Campos obligatorios faltantes.`);
            return res.status(400).json({ message: 'Todos los campos (RUT, Nombre, Email, Contraseña) son obligatorios.' });
        }
        // ... (resto de tus validaciones para rut, nombre, password) ...
        const trimmedRut = rut.trim();
        const trimmedNombre = nombre.trim();

        if (!validarRutChileno(trimmedRut)) {
            console.log(`[${requestTimestamp}] REGISTER_VALIDATION_FAIL: RUT inválido - ${trimmedRut}`);
            return res.status(400).json({ message: 'El RUT no es válido para el registro.' });
        }
        if (trimmedNombre.length < 2 || trimmedNombre.length > 100) {
            console.log(`[${requestTimestamp}] REGISTER_VALIDATION_FAIL: Longitud de nombre inválida.`);
            return res.status(400).json({ message: 'El nombre debe tener entre 2 y 100 caracteres.' });
        }
        if (password.length < 6) {
            console.log(`[${requestTimestamp}] REGISTER_VALIDATION_FAIL: Contraseña demasiado corta.`);
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
        }
        
        console.log(`[${requestTimestamp}] DB_QUERY_START: Buscando usuario existente por RUT (${trimmedRut}) o Email (${email})...`);
        const existingUser = await User.findOne({
            where: { [Op.or]: [{ rut: trimmedRut }, { email: email }] }
        });

        if (existingUser) {
            console.log(`[${requestTimestamp}] DB_QUERY_RESULT: Usuario ya existe.`, existingUser.toJSON());
            return res.status(409).json({ message: 'El RUT o email ya está registrado.' });
        }
        console.log(`[${requestTimestamp}] DB_QUERY_RESULT: Usuario no encontrado.`);

        console.log(`[${requestTimestamp}] AUTH_OP: Hasheando contraseña...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`[${requestTimestamp}] AUTH_OP_SUCCESS: Contraseña hasheada.`);

        console.log(`[${requestTimestamp}] DB_OP_START: Creando usuario...`);
        // El rol se asignará por defecto ('socio') según el modelo User.js
        const newUser = await User.create({
            rut: trimmedRut,
            nombre: trimmedNombre,
            email: email,
            password: hashedPassword,
            // No es necesario especificar 'rol' aquí si quieres el defaultValue del modelo
        });
        console.log(`[${requestTimestamp}] DB_OP_SUCCESS: Usuario creado.`, newUser.toJSON());

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: { 
                rut: newUser.rut,
                nombre: newUser.nombre,
                email: newUser.email,
                rol: newUser.rol // Devolver el rol asignado
            }
        });
        console.log(`[${requestTimestamp}] RESPONSE_SENT: 201 - Usuario registrado.`);

    } catch (error) {
        console.error(`\n[${requestTimestamp}] --- ERROR EN /api/auth/register (Bloque Catch) ---`);
        console.error(`[${requestTimestamp}] Error Completo:`, error);
        // ... (resto de tu manejo de errores) ...
        if (!res.headersSent) {
            if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
                return res.status(400).json({ message: error.errors[0].message });
            }
            return res.status(500).json({ message: 'Error interno del servidor.' });
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
            console.log(`[${requestTimestamp}] LOGIN_VALIDATION_FAIL: Campos obligatorios.`);
            return res.status(400).json({ message: 'RUT y contraseña son obligatorios.' });
        }
        
        const trimmedRut = rut.trim();
        console.log(`[${requestTimestamp}] DB_QUERY_START: Buscando usuario por RUT ${trimmedRut}...`);
        // Asegurarse de que 'rol' se recupere de la base de datos
        const user = await User.findOne({ 
            where: { rut: trimmedRut },
            // attributes: ['rut', 'nombre', 'email', 'password', 'rol'] // Opcional: ser explícito
        });

        if (!user) {
            console.log(`[${requestTimestamp}] DB_QUERY_RESULT: Usuario no encontrado.`);
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
            user: {
                rut: user.rut,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol // Incluir rol en el payload del JWT
            }
        };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(`[${requestTimestamp}] JWT_OP_SUCCESS: Token generado.`);
        
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: { // Incluir rol en la respuesta del login
                rut: user.rut,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });
        console.log(`[${requestTimestamp}] RESPONSE_SENT: 200 - Login exitoso.`);
    } catch (error) {
        console.error(`\n[${requestTimestamp}] --- ERROR EN /api/auth/login (Bloque Catch) ---`);
        console.error(`[${requestTimestamp}] Error Completo:`, error);
        // ... (resto de tu manejo de errores) ...
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
    console.log(`[${requestTimestamp}] --- FIN PETICIÓN /api/auth/login ---`);
});

module.exports = router;
