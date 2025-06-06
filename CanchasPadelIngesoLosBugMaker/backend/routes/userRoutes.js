const express = require('express');
const router = express.Router();
const { User } = require('../models'); // Importamos el modelo User desde el index de modelos

/**
 * RUTA: GET /api/users/:rut
 * DESCRIPCIÓN: Obtiene la información pública de un usuario, incluyendo su saldo.
 * Esencial para que el front-end pueda mostrar los datos del perfil y el saldo actual.
 */
router.get('/:rut', async (req, res) => {
    try {
        const { rut } = req.params;
        const user = await User.findByPk(rut, {
            // Seleccionamos explícitamente los campos para no exponer NUNCA la contraseña.
            attributes: ['rut', 'nombre', 'email', 'rol', 'saldo'] 
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        
        res.status(200).json(user);

    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


/**
 * RUTA: POST /api/users/:rut/depositar
 * DESCRIPCIÓN: Permite a un usuario recargar saldo (simulado).
 * Esta es la ruta que el componente de "Billetera" en el front-end debe llamar.
 */
router.post('/:rut/depositar', async (req, res) => {
    const { rut } = req.params;
    const { monto } = req.body;

    // Validación del monto recibido
    if (!monto || typeof monto !== 'number' || monto <= 0) {
        return res.status(400).json({ message: 'El monto debe ser un número positivo.' });
    }

    try {
        // 1. Buscamos al usuario por su clave primaria (rut)
        const user = await User.findByPk(rut);

        if (!user) {
            return res.status(404).json({ message: 'Usuario con ese RUT no encontrado.' });
        }

        // 2. Usamos el método de Sequelize para incrementar el saldo de forma segura
        await user.increment('saldo', { by: monto });

        // 3. Opcional pero recomendado: Recargar el usuario para obtener el valor actualizado
        await user.reload(); 

        console.log(`Depósito de ${monto} realizado para el usuario con RUT ${rut}. Nuevo saldo: ${user.saldo}`);

        // 4. Devolvemos una respuesta exitosa con el nuevo saldo
        res.status(200).json({
            message: 'Depósito realizado con éxito',
            nuevoSaldo: user.saldo
        });

    } catch (error) {
        console.error('Error al realizar el depósito:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;