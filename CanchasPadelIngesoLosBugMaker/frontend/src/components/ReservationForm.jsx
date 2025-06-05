import React, { useState } from 'react';

function ReservationForm({ court, date, onClose }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [equipamiento, setEquipamiento] = useState(false);
  const [rutReserva, setRutReserva] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!startTime || !endTime || !rutReserva) {
      setError('Please fill all fields.');
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
          requiereEquipamiento: equipamiento, // <-- CORREGIDO: La clave es "requiereEquipamiento"
          userRut: rutReserva,              // <-- CORREGIDO: La clave es "userRut"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage('Reserva Resgistrada!');
    } catch (err) {
      setError(err.message || 'Error al procesar la reserva.');
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #aaa' }}>
      <h3>Reserve {court.name || `Court ${court.id}`}</h3>
      <form onSubmit={handleSubmit}>
        <label>Hora de inicio:</label>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

        <label>Hora de termino:</label>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />

        <label>RUT:</label>
        <input type="text" value={rutReserva} onChange={(e) => setRutReserva(e.target.value)} required />

        <label>
          <input
            type="checkbox"
            checked={equipamiento}
            onChange={(e) => setEquipamiento(e.target.checked)}
          />
          Necesita equipamento?
        </label>

        <div style={{ marginTop: '10px' }}>
          <button type="submit">Reserve</button>
          <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
        </div>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ReservationForm;