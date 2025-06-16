import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function ReservationForm({ court, date, onClose }) {
  const { user, token } = useAuth();

  // --- Estados del Formulario ---
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [jugadores, setJugadores] = useState([{ nombre: '', apellido: '', rut: '', edad: '' }]);
  
  // --- Estados para Equipamiento ---
  const [quiereEquipamiento, setQuiereEquipamiento] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [loadingEquipamiento, setLoadingEquipamiento] = useState(false);

  // Mensajes de estado
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Carga el inventario cuando el usuario marca la casilla
  useEffect(() => {
    if (quiereEquipamiento && inventario.length === 0) {
      setLoadingEquipamiento(true);
      fetch('/api/equipamiento') 
        .then(res => res.ok ? res.json() : Promise.reject('No se pudo cargar el inventario.'))
        .then(data => setInventario(data || []))
        .catch(err => setError(err.toString()))
        .finally(() => setLoadingEquipamiento(false));
    }
  }, [quiereEquipamiento]);

  // --- LÓGICA RESTAURADA PARA EQUIPAMIENTO DINÁMICO ---

  const handleAddEquipoRow = () => {
    // Añade una fila vacía para que el usuario elija otro artículo
    setEquiposSeleccionados([...equiposSeleccionados, { id: '', cantidad: 1, tipo: '' }]);
  };

  const handleRemoveEquipoRow = (index) => {
    setEquiposSeleccionados(equiposSeleccionados.filter((_, i) => i !== index));
  };
  
  const handleEquipoSelectionChange = (index, field, value) => {
    const newList = [...equiposSeleccionados];
    const currentItem = { ...newList[index] };
    
    if (field === 'tipo') {
        currentItem.tipo = value;
        currentItem.id = ''; // Resetea el artículo seleccionado al cambiar de tipo
    } else {
        currentItem[field] = value;
    }
    newList[index] = currentItem;
    setEquiposSeleccionados(newList);
  };

  // --- Lógica para Jugadores (sin cambios) ---
  const handleAddJugador = () => setJugadores([...jugadores, { nombre: '', apellido: '', rut: '', edad: '' }]);
  const handleRemoveJugador = (index) => setJugadores(jugadores.filter((_, i) => i !== index));
  const handleJugadorChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...jugadores];
    list[index][name] = value;
    setJugadores(list);
  };

  // --- Lógica de Envío del Formulario ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!startTime || !endTime || !user?.rut) {
      setError('Por favor, completa el horario. Debes estar logueado para reservar.');
      return;
    }

    try {
      // Formatea el array de equipamiento para que coincida con lo que espera el backend
      const equipamientosParaEnviar = equiposSeleccionados
        .filter(item => item.id && parseInt(item.cantidad, 10) > 0)
        .map(item => ({ id: parseInt(item.id), cantidad: parseInt(item.cantidad) }));

      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({
          canchaId: court.id,
          fecha: date,
          horaInicio: startTime,
          horaTermino: endTime,
          userRut: user.rut,
          jugadores: jugadores,
          equipamientos: equipamientosParaEnviar,
          requiereEquipamiento: quiereEquipamiento && equipamientosParaEnviar.length > 0
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);

    } catch (err) {
      setError(err.message || 'Error al procesar la reserva.');
    }
  };
  
  // Obtiene una lista única de los tipos de equipamiento disponibles
  const tiposDeEquipamiento = [...new Set(inventario.map(item => item.tipo))];

  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Reserva para {court.nombre} el {date}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Sección de Horarios y Checkbox de Equipamiento */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div><label>Hora de inicio:</label><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div>
          <div><label>Hora de término:</label><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></div>
          <label><input type="checkbox" checked={quiereEquipamiento} onChange={(e) => setQuiereEquipamiento(e.target.checked)} />¿Necesita equipamiento?</label>
        </div>

        {/* --- SECCIÓN DE EQUIPAMIENTO DINÁMICO RESTAURADA --- */}
        {quiereEquipamiento && (
          <section className="equipamiento-section" style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '5px' }}>
            <h4>Seleccionar Equipamiento</h4>
            {loadingEquipamiento && <p>Cargando inventario...</p>}
            
            {equiposSeleccionados.map((equipo, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <select value={equipo.tipo || ''} onChange={(e) => handleEquipoSelectionChange(index, 'tipo', e.target.value)}>
                    <option value="" disabled>-- Seleccione Tipo --</option>
                    {tiposDeEquipamiento.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>

                <select value={equipo.id || ''} onChange={(e) => handleEquipoSelectionChange(index, 'id', e.target.value)} disabled={!equipo.tipo}>
                    <option value="" disabled>-- Seleccione Artículo --</option>
                    {inventario.filter(item => item.tipo === equipo.tipo).map(item => (
                        <option key={item.id} value={item.id}>{item.nombre} (Stock: {item.stock})</option>
                    ))}
                </select>

                <input 
                    type="number" min="1" 
                    max={inventario.find(i => i.id == equipo.id)?.stock || 1} 
                    value={equipo.cantidad} 
                    onChange={(e) => handleEquipoSelectionChange(index, 'cantidad', e.target.value)}
                    style={{ width: '80px' }}
                />
                <button type="button" onClick={() => handleRemoveEquipoRow(index)}>X</button>
              </div>
            ))}

            <button type="button" onClick={handleAddEquipoRow} style={{ alignSelf: 'flex-start' }}>Añadir Equipamiento</button>
          </section>
        )}

        <hr />

        {/* Formulario de Jugadores */}
        <h4>Jugadores (Máximo {court.maxJugadores || 4})</h4>
        {jugadores.map((jugador, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', border: '1px solid #eee', padding: '10px', borderRadius: '5px' }}>
            <span>{index + 1}.</span>
            <input type="text" name="nombre" placeholder="Nombre" value={jugador.nombre} onChange={e => handleJugadorChange(e, index)} required style={{flex: 1}} />
            <input type="text" name="apellido" placeholder="Apellido" value={jugador.apellido} onChange={e => handleJugadorChange(e, index)} required style={{flex: 1}} />
            <input type="text" name="rut" placeholder="RUT" value={jugador.rut} onChange={e => handleJugadorChange(e, index)} required style={{flex: 1}} />
            <input type="number" name="edad" placeholder="Edad" value={jugador.edad} onChange={e => handleJugadorChange(e, index)} required style={{width: '80px'}} />
            {jugadores.length > 1 && (<button type="button" onClick={() => handleRemoveJugador(index)}>X</button>)}
          </div>
        ))}
        {jugadores.length < (court.maxJugadores || 4) && (<button type="button" onClick={handleAddJugador}>Añadir Jugador</button>)}

        <hr />
        
        <div style={{ marginTop: '10px' }}>
          <button type="submit">Confirmar Reserva</button>
          <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>Cerrar</button>
        </div>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default ReservationForm;