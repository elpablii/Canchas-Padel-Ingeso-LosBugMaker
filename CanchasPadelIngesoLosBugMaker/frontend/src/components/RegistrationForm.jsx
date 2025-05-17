// frontend/src/components/RegistrationForm.jsx
import React, { useState } from 'react';
import './RegistrationForm.css'; // Crearemos un archivo CSS básico

function RegistrationForm() {
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Para confirmar contraseña
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // Aquí harás la llamada al backend más adelante
    console.log('Datos del formulario de registro:', { rut, email, password });

    // Simulación de llamada a API
    try {
      // const response = await fetch('/api/auth/register', { /* ... */ });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Error al registrar');
      
      setSuccessMessage('¡Registro simulado exitoso! Revisa la consola.');
      // Limpiar formulario
      setRut('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Aquí podrías redirigir o mostrar un mensaje permanente
    } catch (err) {
      setError(err.message || 'Ocurrió un error durante el registro.');
    }
  };

  return (
    <div className="registration-form-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Crear Nueva Cuenta</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
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
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength="6" // Coincide con la validación del backend
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn-submit-register">Registrarse</button>
      </form>
    </div>
  );
}

export default RegistrationForm;