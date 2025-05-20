
import React, { useState } from 'react';

function ListaCanchasDisponibles() {
  const [canchasDisponibles, setCanchasDisponibles] = useState([]);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [error, setError] = useState('');

  const handleBuscarDisponibilidad = async () => {
    if (!fecha || !hora) {
      setError('Por favor, selecciona una fecha y hora.');
      setCanchasDisponibles([]);
      return;
    }

    setError('');
    try {
      const response = await fetch(`/api/disponibilidad?date=${fecha}&time=${hora}`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Error al obtener la disponibilidad.');
        setCanchasDisponibles([]);
        return;
      }
      const data = await response.json();
      setCanchasDisponibles(data.disponibles);
    } catch (err) {
      console.error('Error al comunicarse con el backend:', err);
      setError('Error al comunicarse con el servidor.');
      setCanchasDisponibles([]);
    }
  };

  return (
    <div>
      <h2>Canchas Disponibles</h2>
      <div>
        <label htmlFor="fecha">Fecha:</label>
        <input
          type="date"
          id="fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="hora">Hora:</label>
        <input
          type="time"
          id="hora"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
        />
      </div>
      <button onClick={handleBuscarDisponibilidad}>Buscar Disponibilidad</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {canchasDisponibles.length > 0 ? (
        <ul>
          {canchasDisponibles.map((cancha) => (
            <li key={cancha.id}>
              ID: {cancha.id}, Nombre: {cancha.nombre || `Cancha ${cancha.id}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {fecha && hora
            ? 'No hay canchas disponibles para la fecha y hora seleccionadas.'
            : 'Por favor, selecciona una fecha y hora para ver la disponibilidad.'}
        </p>
      )}
    </div>
  );
}

export default ListaCanchasDisponibles;