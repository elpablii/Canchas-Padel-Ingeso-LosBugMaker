// backend/middleware/adminAuthMiddleware.js
const authMiddleware = require('./authMiddleware'); // Importa el middleware de autenticación general

// Middleware para verificar si el usuario autenticado es un administrador
const adminAuthMiddleware = (req, res, next) => {
  // Primero, usa el middleware de autenticación general para verificar el token
  // y adjuntar req.userData
  authMiddleware(req, res, () => {
    // Esta función callback se ejecuta si authMiddleware llama a next()
    
    // Verificar si la autenticación fue exitosa y req.userData existe
    // (authMiddleware ya debería haber enviado una respuesta si falló,
    // pero esta es una doble verificación por si acaso)
    if (!req.userData) {
      // Este caso no debería ocurrir si authMiddleware funciona correctamente,
      // ya que authMiddleware enviaría una respuesta de error antes.
      console.log('[ADMIN_AUTH_FAIL] req.userData no encontrado después de authMiddleware.');
      return res.status(401).json({ message: 'Autenticación requerida.' });
    }

    // Ahora verifica el rol del usuario
    if (req.userData.rol !== 'admin') {
      console.log(`[ADMIN_AUTH_FAIL] Acceso denegado. Usuario con RUT ${req.userData.rut} no es admin. Rol: ${req.userData.rol}`);
      return res.status(403).json({ message: 'Acceso denegado. No tiene permisos de administrador.' });
    }

    // Si el usuario está autenticado y es un administrador, continuar
    console.log(`[ADMIN_AUTH_SUCCESS] Usuario con RUT ${req.userData.rut} es admin. Acceso permitido.`);
    next();
  });
};

module.exports = adminAuthMiddleware;
