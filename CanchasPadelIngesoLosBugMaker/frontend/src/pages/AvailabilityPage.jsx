import React, { useState } from 'react';

function ListaCanchasDisponibles() {
  // Estado para los resultados y mensajes
  const [canchasDisponibles, setCanchasDisponibles] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('Por favor, selecciona una fecha y hora de inicio para buscar disponibilidad.');
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');

  const handleBuscarDisponibilidad = async () => {

    setError('');
    setMensaje('');
    setCanchasDisponibles([]);
    setBusquedaRealizada(true); 

    if (!fecha || !horaInicio) {
      setError('Por favor, selecciona una fecha y una hora de inicio.');
      return;
    }

    try {
      const fechaInicio = new Date(`${fecha}T${horaInicio}`);
      
      // Añadimos 90 minutos para obtener la fecha de término
      const fechaTermino = new Date(fechaInicio.getTime() + 90 * 60000); // 90 min * 60 seg * 1000 ms

      // Formateamos la hora de término de vuelta a un string HH:MM
      const horaTermino = fechaTermino.toTimeString().slice(0, 5);

      const queryString = new URLSearchParams({
        date: fecha,
        horaInicio: horaInicio,
        horaTermino: horaTermino
      }).toString();
      
      const response = await fetch(`/api/disponibilidad?${queryString}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener la disponibilidad.');
      }
      
      setCanchasDisponibles(data.disponibles);
      if (data.disponibles.length === 0) {
        setMensaje(`No hay canchas disponibles para el bloque de 90 minutos que comienza a las ${horaInicio}.`);
      }

    } catch (err) {
      console.error('Error al comunicarse con el backend:', err);
      setError(err.message);
      setCanchasDisponibles([]);
    }
  };

  return (
    <div>
      <h2>Verificar Disponibilidad de Canchas</h2>
      <h4>(reservas de 90 a 180 minutos)</h4>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px' }}></div>
          <label htmlFor="fecha">Fecha: </label>
          <input
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="horaInicio">Horario deseado: </label>
          <input
            type="time"
            id="horaInicio"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>
        <button onClick={handleBuscarDisponibilidad}>Buscar Disponibilidad</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {canchasDisponibles.length > 0 ? (
        <>
          <h4>Canchas disponibles para el {fecha} a las {horaInicio} :</h4>
          <ul>
            {canchasDisponibles.map((cancha) => (
              <li key={cancha.id}>
                <strong>Cancha: {cancha.nombre}</strong> 
              </li>
            ))}
          </ul>
        </>
      ) : (
        busquedaRealizada && <p>{mensaje}</p>
      )}
    </div>
  );
}

export default ListaCanchasDisponibles;