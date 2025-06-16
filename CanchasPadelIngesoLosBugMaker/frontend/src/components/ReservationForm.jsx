import React, { useState } from 'react';

function ReservationForm({ court, date, onClose, isAdmin = false}) {
  // Estado para los campos de la reserva
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [equipamiento, setEquipamiento] = useState(false);
  
  // --- ESTADO PARA EL RUT (VUELVE A SER MANUAL) ---
  const [rutReserva, setRutReserva] = useState('');

  // --- ESTADO PARA LOS JUGADORES ---
  const [jugadores, setJugadores] = useState([{ nombre: '', apellido: '', rut: '', edad: '' }]);
  
  // Mensajes de estado
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- FUNCIONES PARA MANEJAR LA LISTA DE JUGADORES ---
  const handleAddJugador = () => {
    setJugadores([...jugadores, { nombre: '', apellido: '', rut: '', edad: '' }]);
  };

  const handleRemoveJugador = (index) => {
    const list = [...jugadores];
    list.splice(index, 1);
    setJugadores(list);
  };

  const handleJugadorChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...jugadores];
    list[index][name] = value;
    setJugadores(list);
  };

  // --- LÓGICA DE ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!startTime || !endTime || !rutReserva) {
      setError('Por favor, completa la hora, y el RUT de quien reserva.');
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
          userRut: rutReserva, // Se usa el RUT del estado del formulario
          jugadores: jugadores,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error del servidor.');
      }
      
      setMessage(data.message);

    } catch (err) {
      setError(err.message || 'Error al procesar la reserva.');
    }
  };

  // --- RENDERIZADO DEL FORMULARIO ---
  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Reserva para {court.nombre} el {date}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Sección de Horarios y RUT del responsable */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div>
            <label>Hora de inicio:</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div>
            <label>Hora de término:</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
          <div>
            <label>RUT de quien reserva:</label>
            <input type="text" placeholder="Ej: 11222333-4" value={rutReserva} onChange={(e) => setRutReserva(e.target.value)} required />
          </div>
          <label>
            <input type="checkbox" checked={equipamiento} onChange={(e) => setEquipamiento(e.target.checked)} />
            ¿Necesita equipamiento?
          </label>
        </div>

        <hr />

        {/* --- FORMULARIO DINÁMICO PARA JUGADORES --- */}
        <h4>Jugadores (Máximo {court.maxJugadores || 4})</h4>
        {jugadores.map((jugador, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid #eee', padding: '10px', borderRadius: '5px' }}>
            <span>{index + 1}.</span>
            <input type="text" name="nombre" placeholder="Nombre" value={jugador.nombre} onChange={e => handleJugadorChange(e, index)} required style={{flex: 1}} />
            <input type="text" name="apellido" placeholder="Apellido" value={jugador.apellido} onChange={e => handleJugadorChange(e, index)} required style={{flex: 1}} />
            <input type="text" name="rut" placeholder="RUT (sin puntos, con guión)" value={jugador.rut} onChange={e => handleJugadorChange(e, index)} required style={{flex: 1}} />
            <input type="number" name="edad" placeholder="Edad" value={jugador.edad} onChange={e => handleJugadorChange(e, index)} required style={{width: '80px'}} />
            
            {jugadores.length > 1 && (
              <button type="button" onClick={() => handleRemoveJugador(index)} style={{backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px'}}>X</button>
            )}
          </div>
        ))}
        
        {jugadores.length < (court.maxJugadores || 4) && (
            <button type="button" onClick={handleAddJugador} style={{ alignSelf: 'flex-start' }}>Añadir Jugador</button>
        )}

        <hr />

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button type="submit">Confirmar Reserva</button>
            <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>Cerrar</button>
          </div>
          <div>
            {message && <p style={{ color: 'green', margin: 0 }}>{message}</p>}
            {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
          </div>
        </div>

      </form>
    </div>
  );
}

export default ReservationForm;