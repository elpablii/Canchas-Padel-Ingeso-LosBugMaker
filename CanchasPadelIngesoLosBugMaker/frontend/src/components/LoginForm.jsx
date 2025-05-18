import React, { useState } from 'react';
import './RegistrationForm.css'; 

function LoginForm() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!rut || !password) {
      setError('Por favor ingresa todos los campos.');
      return;
    }

    //arreglar esto
    try {
      const response = await fetch('http://localhost:3001/api/auth/inicioSesion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rut, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión.');
      }

      setSuccessMessage('Inicio de sesión exitoso!');
      localStorage.setItem('token', data.token); 

      setRut('');
      setPassword('');


    } catch (err) {
      setError(err.message || 'Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <div className="registration-form-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Iniciar Sesión</h2>
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