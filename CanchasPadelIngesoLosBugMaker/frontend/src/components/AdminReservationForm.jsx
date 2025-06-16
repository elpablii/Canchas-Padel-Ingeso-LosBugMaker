//AdminReservationForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// El componente ahora es casi idéntico al del usuario, pero llama a la API de admin.
// Espera recibir 'court' y 'date' como props.
function AdminReservationForm({ court, date, onClose }) {
  const { token } = useAuth();

  // --- Estados del Formulario ---
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [equipamiento, setEquipamiento] = useState(false);
  const [userRut, setUserRut] = useState(''); // RUT del usuario para quien se reserva
  const [jugadores, setJugadores] = useState([{ nombre: '', apellido: '', rut: '', edad: '' }]);
  
  // Mensajes de estado
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  // --- Funciones para manejar Jugadores (sin cambios) ---
  const handleAddJugador = () => setJugadores([...jugadores, { nombre: '', apellido: '', rut: '', edad: '' }]);
  const handleRemoveJugador = (index) => setJugadores(jugadores.filter((_, i) => i !== index));
  const handleJugadorChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...jugadores];
    list[index][name] = value;
    setJugadores(list);
  };

  // --- Lógica de Envío ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!startTime || !endTime || !userRut) {
      setError('Por favor, completa el horario y el RUT del usuario.');
      setLoading(false);
      return;
    }

    try {
      // La petición se envía a la ruta protegida del administrador
      const res = await fetch('/api/admin/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          canchaId: court.id,
          fecha: date,
          horaInicio: startTime,
          horaTermino: endTime,
          requiereEquipamiento: equipamiento,
          userRut: userRut,
          jugadores: jugadores,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
    } catch (err) {
      setError(err.message || 'Error al procesar la reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', borderTop: '2px solid #007bff' }}>
      <h3>Reserva para {court.nombre} el {date}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
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
            <input type="text" placeholder="Ej: 11222333-4" value={userRut} onChange={(e) => setUserRut(e.target.value)} required />
          </div>
          <label>
            <input type="checkbox" checked={equipamiento} onChange={(e) => setEquipamiento(e.target.checked)} />
            ¿Necesita equipamiento?
          </label>
        </div>

        <hr />
        
        <h4>Jugadores (Máximo {court.maxJugadores || 4})</h4>
        {jugadores.map((jugador, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>{index + 1}.</span>
            <input type="text" name="nombre" placeholder="Nombre" value={jugador.nombre} onChange={e => handleJugadorChange(e, index)} required />
            <input type="text" name="apellido" placeholder="Apellido" value={jugador.apellido} onChange={e => handleJugadorChange(e, index)} required />
            <input type="text" name="rut" placeholder="RUT" value={jugador.rut} onChange={e => handleJugadorChange(e, index)} required />
            <input type="number" name="edad" placeholder="Edad" value={jugador.edad} onChange={e => handleJugadorChange(e, index)} required />
            {jugadores.length > 1 && <button type="button" onClick={() => handleRemoveJugador(index)}>X</button>}
          </div>
        ))}
        {jugadores.length < (court.maxJugadores || 4) && (
            <button type="button" onClick={handleAddJugador} style={{ alignSelf: 'flex-start' }}>Añadir Jugador</button>
        )}
        
        <hr />

        <div style={{ marginTop: '10px' }}>
          <button type="submit" disabled={loading}>{loading ? 'Creando Reserva...' : 'Crear Reserva'}</button>
          <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>Cerrar</button>
        </div>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

       {/* --- BLOQUE PARA EL FLUJO COMPLETO DE CREAR RESERVA --- */}
      {mostrarCrearReserva && (
        <section className="admin-section">
          
          {/* PARTE 1: SELECCIÓN DE FECHA Y CANCHA (si aún no se ha elegido una cancha) */}
          {!selectedCourt && (
            <div>
              <h2>Crear Reserva para Usuario</h2>
              <p>Omitiendo la regla de anticipación de 1 semana.</p>

              {/* Paso 1: Selector de Fecha */}
              <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <label htmlFor="reserva-fecha-admin" style={{ marginRight: '10px', fontWeight: 'bold' }}>
                  Paso 1: Seleccione la fecha
                </label>
                <input type="date" id="reserva-fecha-admin" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>

              {/* Paso 2: Selector de Cancha */}
              {selectedDate && (
                <div>
                  <h4 style={{ marginTop: '20px' }}>Paso 2: Seleccione la cancha disponible</h4>
                  {courtFetchLoading && <p>Buscando canchas...</p>}
                  {courtFetchError && <p className="error-message">{courtFetchError}</p>}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {availableCourts.map(court => (
                      <button key={court.id} className="btn btn-primary" onClick={() => setSelectedCourt(court)}>
                        {court.nombre} (${Number(court.costo).toLocaleString('es-CL')})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARTE 2: FORMULARIO DE RESERVA (si ya se eligió una cancha) */}
          {selectedCourt && (
            <div>
              <h3>Reserva para {selectedCourt.nombre} el {selectedDate}</h3>
              <form onSubmit={handleReservationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Inputs de Hora, RUT, Equipamiento */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div><label>Hora de inicio:</label><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div>
                  <div><label>Hora de término:</label><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></div>
                  <div><label>RUT de quien reserva:</label><input type="text" placeholder="Ej: 11222333-4" value={userRut} onChange={(e) => setUserRut(e.target.value)} required /></div>
                  <label><input type="checkbox" checked={equipamiento} onChange={(e) => setEquipamiento(e.target.checked)} /> ¿Necesita equipamiento?</label>
                </div>
                <hr />
                {/* Formulario de Jugadores */}
                <h4>Jugadores (Máximo {selectedCourt.maxJugadores || 4})</h4>
                {jugadores.map((jugador, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>{index + 1}.</span>
                    <input type="text" name="nombre" placeholder="Nombre" value={jugador.nombre} onChange={e => handleJugadorChange(e, index)} required />
                    <input type="text" name="apellido" placeholder="Apellido" value={jugador.apellido} onChange={e => handleJugadorChange(e, index)} required />
                    <input type="text" name="rut" placeholder="RUT" value={jugador.rut} onChange={e => handleJugadorChange(e, index)} required />
                    <input type="number" name="edad" placeholder="Edad" value={jugador.edad} onChange={e => handleJugadorChange(e, index)} required />
                    {jugadores.length > 1 && <button type="button" onClick={() => handleRemoveJugador(index)}>X</button>}
                  </div>
                ))}
                {jugadores.length < (selectedCourt.maxJugadores || 4) && (
                  <button type="button" onClick={handleAddJugador} style={{ alignSelf: 'flex-start' }}>Añadir Jugador</button>
                )}
                <hr />
                {/* Botones de acción y mensajes */}
                <div style={{ marginTop: '10px' }}>
                  <button type="submit" disabled={submissionLoading}>{submissionLoading ? 'Creando Reserva...' : 'Crear Reserva'}</button>
                  <button type="button" onClick={() => setSelectedCourt(null)} style={{ marginLeft: '10px' }}>Volver a elegir cancha</button>
                </div>
                {submissionMessage && <p style={{ color: 'green' }}>{submissionMessage}</p>}
                {submissionError && <p style={{ color: 'red' }}>{submissionError}</p>}
              </form>
            </div>
          )}

          {/* Botón para cerrar todo el flujo y volver al panel */}
          <button onClick={handleCloseReservationFlow} className="btn btn-secondary" style={{ marginTop: '20px' }}>
            Cancelar y Volver al Panel
          </button>
        </section>
      )}
    </div>
  );
}

export default AdminReservationForm;
