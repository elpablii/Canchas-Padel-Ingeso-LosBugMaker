// frontend/src/components/Billetera.jsx
import React, { useState, useEffect } from 'react';

// Importamos el archivo CSS para darle estilo a este componente.
import './billetera.css';

/**
 * Componente Billetera
 * Muestra el saldo actual del usuario y permite realizar recargas (simuladas).
 * @param {object} props
 * @param {string} props.userRut - El RUT del usuario que ha iniciado sesión.
 */
function Billetera({ userRut }) {
  // --- ESTADOS DEL COMPONENTE ---
  const [saldo, setSaldo] = useState(0);
  const [monto, setMonto] = useState(10000); // Monto por defecto para recargar
  const [loading, setLoading] = useState(true); // Para mostrar un mensaje mientras se carga el saldo
  const [message, setMessage] = useState(''); // Para mensajes de éxito
  const [error, setError] = useState('');     // Para mensajes de error

  // --- EFECTO PARA CARGAR DATOS INICIALES ---
  // Este useEffect se ejecuta una vez cuando el componente se monta para obtener el saldo actual.
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userRut) {
        setError('No se pudo identificar al usuario.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userRut}`); // Llama a la ruta GET que creamos
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No se pudo obtener la información del usuario.');
        }

        setSaldo(data.saldo); // Actualizamos el estado con el saldo del usuario
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); // Ocultamos el mensaje de carga
      }
    };

    fetchUserData();
  }, [userRut]); // El array de dependencias asegura que esto se ejecute si cambia el usuario

  // --- MANEJADOR DEL FORMULARIO DE RECARGA ---
  const handleRecarga = async (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    setMessage('');
    setError('');

    if (monto <= 0) {
      setError('El monto a recargar debe ser mayor que cero.');
      return;
    }

    try {
      // Llamamos a la ruta POST del backend para depositar
      const response = await fetch(`/api/users/${userRut}/depositar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Aquí también deberías enviar tu token de autenticación si la ruta está protegida
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ monto: Number(monto) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error en la recarga.');
      }

      // Si la recarga fue exitosa, actualizamos el saldo y mostramos un mensaje
      setSaldo(data.nuevoSaldo);
      setMessage(`¡Recarga de $${monto} exitosa!`);

    } catch (err) {
      setError(err.message);
    }
  };

  // Muestra un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return <div className="billetera-container"><p>Cargando billetera...</p></div>;
  }

  // --- RENDERIZADO DEL COMPONENTE (LO QUE SE VE EN PANTALLA) ---
  return (
    <div className="billetera-container">
      <h1>Mi Billetera</h1>

      <div className="saldo-display">
        <p>Saldo Disponible</p>
        <h2>${new Intl.NumberFormat('es-CL').format(saldo)}</h2>
      </div>

      <form className="form-recarga" onSubmit={handleRecarga}>
        <h3>Recargar Saldo</h3>
        <p>Ingresa el monto que deseas añadir a tu cuenta.</p>
        <div className="form-group">
          <label htmlFor="monto">Monto:</label>
          <input
            id="monto"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            min="1"
            required
          />
        </div>
        <button type="submit" className="btn-recargar">Recargar</button>
      </form>

      {/* Mostramos los mensajes de éxito o error aquí */}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Billetera;