// frontend/src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate que la ruta sea correcta
// import './LoginForm.css'; // Si tienes estilos específicos para LoginForm
// O reutiliza RegistrationForm.css si es genérico para formularios
import './RegistrationForm.css';


function LoginForm() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    console.log("LOGIN_FORM: handleSubmit iniciado.");


    if (!rut || !password) {
      setError('Por favor ingresa RUT y contraseña.');
      console.log("LOGIN_FORM: Error - Campos obligatorios faltantes.");
      return;
    }

    try {
      console.log("LOGIN_FORM: Intentando fetch a /api/auth/login con RUT:", rut.trim());
      // Asegúrate que esta URL coincida con tu endpoint de backend
      const response = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rut: rut.trim(), password }),
      });
      console.log("LOGIN_FORM: Respuesta del fetch recibida, status:", response.status);


      const data = await response.json();
      console.log("LOGIN_FORM: Datos de la respuesta JSON:", data);


      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión. Verifique sus credenciales.');
      }

      // Inicio de sesión exitoso:
      console.log("LOGIN_FORM: Login exitoso en backend. Usuario:", data.user, "Token:", data.token ? "Recibido" : "No Recibido");
      login(data.user, data.token); // Guarda el token y los datos del usuario (incluyendo el rol)
      localStorage.setItem('rutUsuario', rut);

      // Redirigir basado en el rol del usuario
      if (data.user && data.user.rol === 'admin') {
        console.log("LOGIN_FORM: Usuario es admin, redirigiendo a /admin/dashboard");
        navigate('/admin/dashboard'); // Redirigir a la página de admin
      } else {
        console.log("LOGIN_FORM: Usuario es socio o rol no admin, redirigiendo a /user-home");
        navigate('/user-home'); // Redirigir a la página de usuario normal
      }

    } catch (err) {
      console.error("LOGIN_FORM: Error capturado en handleSubmit (objeto err crudo):", err);
      if (err && typeof err === 'object' && err.message) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Ocurrió un error inesperado durante el inicio de sesión.');
        console.log("LOGIN_FORM: 'err' en el catch no tenía propiedad .message o era undefined. 'err' fue:", err);
      }
    }
  };

  return (
    // Usando las clases de RegistrationForm.css si son genéricas para formularios
    // o crea y usa LoginForm.css
    <div className="registration-form-container"> 
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Iniciar Sesión</h2>
        {error && <p className="error-message">{error}</p>}
        
        <div className="form-group">
          <label htmlFor="rut">RUT (ej: 12345678-9)</label>
          <input
            type="text"
            id="rut"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="Ingrese su RUT"
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
            placeholder="Ingrese su contraseña"
            required
          />
        </div>

        <button type="submit" className="btn-submit-register">Ingresar</button>
      </form>
    </div>
  );
}

export default LoginForm;
