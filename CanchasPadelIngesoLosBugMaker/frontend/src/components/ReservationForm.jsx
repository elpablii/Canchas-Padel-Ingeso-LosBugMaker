import React, { useState } from 'react';
import './ReservationForm.css';

function ReservationForm() {
  const [canchaId, setCanchaId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [requiereEquipamiento, setRequiereEquipamiento] = useState(false);
  const [rut, setRut] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (!canchaId || !fecha || !horaInicio || !horaFin || !rut) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canchaId,
          fecha,
          horaInicio,
          horaFin,
          requiereEquipamiento,
          rut,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la reserva.');
      }

      setMensaje('Reserva realizada con éxito.');
      setCanchaId('');
      setFecha('');
      setHoraInicio('');
      setHoraFin('');
      setRequiereEquipamiento(false);
      setRut('');
    } catch (err) {
      setError(err.message || 'Error desconocido al hacer la reserva.');
    }
  };

  return (
    <div className="reservation-form-container">
      <form onSubmit={handleSubmit} className="reservation-form">
        <h2>Reservar Cancha</h2>

        {mensaje && <div className="success-message">{mensaje}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>ID de Cancha</label>
          <input type="text" value={canchaId} onChange={(e) => setCanchaId(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Hora de Inicio</label>
          <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Hora de Fin</label>
          <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>
            <input type="checkbox" checked={requiereEquipamiento} onChange={(e) => setRequiereEquipamiento(e.target.checked)} />
            &nbsp;¿Requiere equipamiento?
          </label>
        </div>

        <div className="form-group">
          <label>RUT del Usuario</label>
          <input type="text" value={rut} onChange={(e) => setRut(e.target.value)} required />
        </div>

        <button type="submit" className="btn-submit-reserva">Reservar</button>
      </form>
    </div>
  );
}

export default ReservationForm;