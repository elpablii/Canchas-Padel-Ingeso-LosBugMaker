// frontend/src/components/RegistrationForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistrationForm.css';

function RegistrationForm() {
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    console.log("REG_FORM: handleSubmit iniciado.");

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      console.log("REG_FORM: Error - Las contraseñas no coinciden.");
      return;
    }

    if (!rut || !email || !password) {
      setError('Todos los campos son obligatorios.');
      console.log("REG_FORM: Error - Campos obligatorios faltantes.");
      return;
    }

    try {
      console.log("REG_FORM: Intentando fetch a /api/auth/register con:", { rut: rut.trim(), email, password });
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut: rut.trim(),
          nombre: nombre.trim(),
          email: email,
          password: password,
        }),
      });
      console.log("REG_FORM: Respuesta del fetch recibida, status:", response.status);

      const data = await response.json();
      console.log("REG_FORM: Datos de la respuesta JSON:", data);

      if (!response.ok) {
        console.log("REG_FORM: Respuesta no OK, lanzando error con mensaje:", data.message);
        throw new Error(data.message || 'Error al registrar el usuario. Intente nuevamente.');
      }

      console.log("REG_FORM: Registro exitoso en backend. Mensaje:", data.message);
      setSuccessMessage(data.message || '¡Usuario registrado exitosamente! Redirigiendo al inicio de sesión...');
      console.log("REG_FORM: Mensaje de éxito seteado.");
      
      setRut('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      console.log("REG_FORM: Campos del formulario limpiados.");

      console.log("REG_FORM: Configurando setTimeout para navegar a /login...");
      setTimeout(() => {
        try {
          console.log("REG_FORM: Dentro de setTimeout, intentando navigate('/login')...");
          navigate('/login'); // Intenta redirigir
          console.log("REG_FORM: navigate('/login') llamado sin error aparente inmediato.");
        } catch (navigationError) {
          // Esto es para capturar errores sincrónicos si navigate mismo lanza algo
          // (aunque es raro que navigate lance errores que no sean por contexto faltante,
          // y esos suelen ser detectados por el hook useNavigate mismo).
          console.error("REG_FORM: Error DENTRO de la función de navigate en setTimeout:", navigationError);
          // Si navigationError es undefined o no tiene .message, esto podría ser un problema
          // para el catch externo si se re-lanza tal cual.
          throw navigationError; // Re-lanzamos para que lo capture el catch principal si es necesario
        }
      }, 2000);
      console.log("REG_FORM: setTimeout configurado.");

    } catch (err) {
      console.error('REG_FORM: Error capturado en handleSubmit (objeto err crudo):', err); // LOG CLAVE
      
      // Manejo de error más robusto
      if (err && typeof err === 'object' && err.message) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        // Si 'err' es undefined o un objeto sin .message
        setError('Ocurrió un error inesperado después del proceso de registro. Verifique la consola.');
        console.log("REG_FORM: 'err' en el catch no tenía propiedad .message o era undefined. 'err' fue:", err);
      }
    }
  };

  return (
    <div className="registration-form-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Crear Nueva Cuenta</h2>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
        {/* ... tus inputs del formulario ... (no los repito para brevedad, son los mismos) */}
        <div className="form-group">
          <label htmlFor="rut">RUT (ej: 12345678-9)</label>
          <input type="text" id="rut" value={rut} onChange={(e) => setRut(e.target.value)} placeholder="Ingrese su RUT" required />
        </div>
        <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese su nombre"
              required
            />
          </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength="6" />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
          <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita su contraseña" required />
        </div>
        
        <button type="submit" className="btn-submit-register">Registrarse</button>
      </form>
    </div>
  );
}

export default RegistrationForm;
