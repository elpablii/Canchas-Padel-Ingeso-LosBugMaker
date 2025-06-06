// frontend/src/components/ReservationForm.jsx
import React, { useState } from 'react';

// No necesitamos useEffect, por lo que el código es mucho más corto.
// Tampoco necesitamos saber el RUT del usuario de antemano, lo pedimos en el formulario.
function ReservationForm({ court, date, onClose }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [equipamiento, setEquipamiento] = useState(false);
  const [rutReserva, setRutReserva] = useState(''); // Mantenemos el input para el RUT
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!startTime || !endTime || !rutReserva) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canchaId: court.id,
          fecha: date,
          horaInicio: startTime,
          horaTermino: endTime,
          requiereEquipamiento: equipamiento,
          userRut: rutReserva, 
        }),
      });

      // Obtenemos la respuesta del backend
      const data = await res.json();

      // --- AQUÍ ESTÁ EL CAMBIO PRINCIPAL ---

      // 1. Si la respuesta del backend NO es exitosa (ej: error 402 por saldo insuficiente)...
      if (!res.ok) {
        // ...lanzamos un error con el mensaje que nos envía el backend.
        throw new Error(data.message); 
      }
      
      // 2. Si la respuesta SÍ es exitosa...
      // ...mostramos el mensaje de éxito que nos envía el backend.
      setMessage(data.message); 

    } catch (err) {
      // 3. Atrapamos el error (ya sea de red o el que lanzamos nosotros) y lo mostramos.
      setError(err.message || 'Error al procesar la reserva.');
    }
  };

  return (
    // Mantenemos tu estructura JSX original
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #aaa' }}>
      <h3>Reserve {court.nombre || `Court ${court.id}`} en la fecha {date}</h3>
      <form onSubmit={handleSubmit}>
        <label>Hora de inicio:</label>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

        <label>Hora de término:</label>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />

        <label>RUT:</label>
        <input type="text" placeholder="Ej: 11222333-4" value={rutReserva} onChange={(e) => setRutReserva(e.target.value)} required />

        <label>
          <input
            type="checkbox"
            checked={equipamiento}
            onChange={(e) => setEquipamiento(e.target.checked)}
          />
          ¿Necesita equipamiento?
        </label>

        <div style={{ marginTop: '10px' }}>
          {/* El botón ya no necesita calcular nada, solo enviar */}
          <button type="submit">Confirmar Reserva</button>
          <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>Cancelar</button>
        </div>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ReservationForm;