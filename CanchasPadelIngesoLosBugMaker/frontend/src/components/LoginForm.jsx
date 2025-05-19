// frontend/src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para la redirección
import { useAuth } from '../context/AuthContext'; // Importa el hook useAuth
import './RegistrationForm.css'; // Asumo que este CSS es genérico para formularios

function LoginForm() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // successMessage ya no es tan necesario aquí si redirigimos inmediatamente
  // const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate(); // Hook para la navegación
  const { login } = useAuth(); // Obtiene la función login de AuthContext

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    // setSuccessMessage('');

    if (!rut || !password) {
      setError('Por favor ingresa RUT y contraseña.');
      return;
    }

    try {
      // Asegúrate que esta URL coincida con tu backend:
      // Si tu backend usa /api/auth/inicioSesion, mantenlo.
      // Si tu backend usa /api/auth/login (como sugerí), cámbialo aquí.
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rut, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // response.ok es false si el status es 4xx o 5xx
        throw new Error(data.message || 'Error al iniciar sesión. Verifique sus credenciales.');
      }

      // Inicio de sesión exitoso:
      // Llama a la función login del AuthContext para guardar el token y los datos del usuario
      login(data.user, data.token);

      // setSuccessMessage('Inicio de sesión exitoso!'); // Opcional si rediriges
      
      // Limpiar campos (opcional, ya que vamos a redirigir)
      // setRut('');
      // setPassword('');

      // Redirigir a la página principal del usuario
      // Cambia '/user-home' por la ruta real que definas para la página principal del usuario
      navigate('/user-home'); 

    } catch (err) {
      console.error("Error en el fetch del login:", err);
      setError(err.message || 'Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <div className="registration-form-container"> {/* Considera renombrar esta clase si es específica de registro */}
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Iniciar Sesión</h2>
        {error && <p className="error-message">{error}</p>}
        {/* {successMessage && <p className="success-message">{successMessage}</p>} */}

        <div className="form-group">
          <label htmlFor="rut">RUT (ej: 12345678-9)</label>
          <input
            type="text"
            id="rut"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-submit-register">Ingresar</button>
      </form>
    </div>
  );
}

export default LoginForm;
