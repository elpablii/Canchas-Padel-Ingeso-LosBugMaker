// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT y autenticar al usuario
const authMiddleware = (req, res, next) => {
  try {
    // Intentar obtener el token de la cabecera Authorization
    // El formato esperado es: "Bearer TOKEN_AQUI"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH_MIDDLEWARE_FAIL] No se encontró token o formato incorrecto.');
      return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token o el formato es incorrecto.' });
    }

    const token = authHeader.split(' ')[1]; // Obtener el token después de "Bearer "

    if (!token) {
      console.log('[AUTH_MIDDLEWARE_FAIL] Token vacío después de Bearer.');
      return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
    }

    // Verificar el token usando el secreto del .env
    // JWT_SECRET debe estar definido en tu archivo .env
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Si el token es válido, decodedToken contendrá el payload (ej. { user: { rut, nombre, email, rol }, iat, exp })
    // Adjuntamos la información del usuario al objeto req para que esté disponible en las rutas protegidas
    req.userData = decodedToken.user; // Aquí guardamos el objeto user del payload
    
    console.log('[AUTH_MIDDLEWARE_SUCCESS] Token verificado. Usuario:', JSON.stringify(req.userData, null, 2));
    next(); // Continuar con la siguiente función de middleware o el controlador de la ruta

  } catch (error) {
    console.error('[AUTH_MIDDLEWARE_ERROR] Error al verificar el token:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Por favor, inicie sesión de nuevo.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    // Otros errores
    return res.status(401).json({ message: 'Autenticación fallida. Problema con el token.' });
  }
};

module.exports = authMiddleware;
