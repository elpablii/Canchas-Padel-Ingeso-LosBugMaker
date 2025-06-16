import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AdminDisponibilidad from '../components/AdminDisponibilidad.jsx';
import ReportePagosPage from './ReportePagosPage.jsx'; 
import AdminInventario from '../components/AdminInventario.jsx'; 
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const { user, logout, token } = useAuth();
  
  // --- ESTADOS PARA CONTROLAR LA VISIBILIDAD DE CADA SECCIÓN ---
  const [mostrarFormularioCancha, setMostrarFormularioCancha] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarFormularioNotificacion, setMostrarFormularioNotificacion] = useState(false);
  const [mostrarGestionDisponibilidad, setMostrarGestionDisponibilidad] = useState(false); // <-- NUEVO ESTADO
  const [mostrarReportePagos, setMostrarReportePagos] = useState(false);
  const [mostrarCrearReserva, setMostrarCrearReserva] = useState(false);
  const [mostrarGestionInventario, setMostrarGestionInventario] = useState(false);

  // Estados para los formularios y datos
  const [nombreCancha, setNombreCancha] = useState('');
  const [costoCancha, setCostoCancha] = useState('');
  const [canchaMsg, setCanchaMsg] = useState('');
  const [canchaError, setCanchaError] = useState('');
  const [canchaLoading, setCanchaLoading] = useState(false);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  
  const [mensajeNotificacion, setMensajeNotificacion] = useState("");
  const [notiMsg, setNotiMsg] = useState("");
  const [notiError, setNotiError] = useState("");
  const [notiLoading, setNotiLoading] = useState(false);

   // ---> AÑADIDO: Todos los estados necesarios para el nuevo flujo de creación de reserva
  const [selectedDate, setSelectedDate] = useState('');
  const [availableCourts, setAvailableCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courtFetchLoading, setCourtFetchLoading] = useState(false);
  const [courtFetchError, setCourtFetchError] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [equipamiento, setEquipamiento] = useState(false);
  const [userRut, setUserRut] = useState('');
  const [jugadores, setJugadores] = useState([{ nombre: '', apellido: '', rut: '', edad: '' }]);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');

    // --- NUEVOS ESTADOS PARA MANEJAR EQUIPAMIENTO ---
  const [quiereEquipamiento, setQuiereEquipamiento] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [loadingEquipamiento, setLoadingEquipamiento] = useState(false);

  const mostrandoSeccion = mostrarFormularioCancha || mostrarHistorial || mostrarFormularioNotificacion || mostrarGestionDisponibilidad || mostrarReportePagos || mostrarCrearReserva || mostrarGestionInventario;
  
  // --- NUEVO USEEFFECT PARA CARGAR EQUIPAMIENTO ---
  useEffect(() => {
    if (quiereEquipamiento && inventario.length === 0) {
      setLoadingEquipamiento(true);
      fetch('/api/equipamiento')
        .then(res => res.ok ? res.json() : Promise.reject('No se pudo cargar inventario.'))
        .then(data => setInventario(data || []))
        .catch(err => setCourtFetchError(err.toString())) // Reutilizamos el estado de error
        .finally(() => setLoadingEquipamiento(false));
    }
  }, [quiereEquipamiento]);

  // --- NUEVAS FUNCIONES PARA MANEJAR EQUIPAMIENTO ---
  const handleAddEquipoRow = () => setEquiposSeleccionados([...equiposSeleccionados, { id: '', cantidad: 1, tipo: '' }]);
  const handleRemoveEquipoRow = (index) => setEquiposSeleccionados(equiposSeleccionados.filter((_, i) => i !== index));
  const handleEquipoSelectionChange = (index, field, value) => {
    const newList = [...equiposSeleccionados];
    const currentItem = { ...newList[index] };
    if (field === 'tipo') {
        currentItem.tipo = value;
        currentItem.id = '';
    } else {
        currentItem[field] = value;
    }
    newList[index] = currentItem;
    setEquiposSeleccionados(newList);
  };

  useEffect(() => {
    if (mostrarCrearReserva && selectedDate && token) {
      setCourtFetchLoading(true);
      setCourtFetchError('');
      setSelectedCourt(null);
      setAvailableCourts([]);

      const horaInicio = '08:00';
      const horaTermino = '20:00';
      const queryString = new URLSearchParams({
        date: selectedDate,
        horaInicio: horaInicio,
        horaTermino: horaTermino,
      }).toString();

      // ---> CAMBIO 2: Usamos el endpoint y la query string correctos.
      fetch(`/api/disponibilidad?${queryString}`, {
          // Se mantiene el header de autorización porque es una llamada del admin.
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
          if (!res.ok) throw new Error('No se pudieron cargar las canchas disponibles.');
          return res.json();
      })
      .then(data => {
          // Mantenemos la lógica que extrae el array de 'disponibles'.
          const courtsArray = data.disponibles || [];
          setAvailableCourts(courtsArray);
          
          if (courtsArray.length === 0) {
              setCourtFetchError('No hay canchas disponibles para la fecha seleccionada.');
          }
      })
      .catch(err => setCourtFetchError(err.message))
      .finally(() => setCourtFetchLoading(false));
    }
  }, [selectedDate, mostrarCrearReserva, token]);

  const handleAddJugador = () => setJugadores([...jugadores, { nombre: '', apellido: '', rut: '', edad: '' }]);
  const handleRemoveJugador = (index) => setJugadores(jugadores.filter((_, i) => i !== index));
  const handleJugadorChange = (e, index) => {
      const { name, value } = e.target;
      const list = [...jugadores];
      list[index][name] = value;
      setJugadores(list);
  };

  const handleReservationSubmit = async (e) => {
      e.preventDefault();
      setSubmissionLoading(true);
      setSubmissionMessage('');
      setSubmissionError('');
      if (!startTime || !endTime || !userRut || !selectedCourt) {
          setSubmissionError('Por favor, completa el horario y el RUT del usuario.');
          setSubmissionLoading(false);
          return;
      }
      try {
          // --- LÓGICA ACTUALIZADA PARA ENVIAR EQUIPAMIENTO ---
          const equipamientosParaEnviar = equiposSeleccionados
            .filter(item => item.id && parseInt(item.cantidad, 10) > 0)
            .map(item => ({ id: parseInt(item.id), cantidad: parseInt(item.cantidad) }));

          const res = await fetch('/api/admin/reservas', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  canchaId: selectedCourt.id,
                  fecha: selectedDate,
                  horaInicio: startTime,
                  horaTermino: endTime,
                  userRut: userRut,
                  jugadores: jugadores,
                  equipamientos: equipamientosParaEnviar,
                  requiereEquipamiento: quiereEquipamiento && equipamientosParaEnviar.length > 0
              }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setSubmissionMessage(data.message);
          setTimeout(() => handleCloseReservationFlow(), 2000);
      } catch (err) {
          setSubmissionError(err.message || 'Error al procesar la reserva.');
      } finally {
          setSubmissionLoading(false);
      }
  };

  const handleCloseReservationFlow = () => {
      setMostrarCrearReserva(false);
      setSelectedDate('');
      setAvailableCourts([]);
      setSelectedCourt(null);
      setCourtFetchError('');
      setStartTime('');
      setEndTime('');
      setEquipamiento(false);
      setUserRut('');
      setJugadores([{ nombre: '', apellido: '', rut: '', edad: '' }]);
      setSubmissionMessage('');
      setSubmissionError('');
      setQuiereEquipamiento(false);
      setEquiposSeleccionados([]);
  };

  const handleRegisterCancha = async (e) => {
    e.preventDefault();
    setCanchaMsg('');
    setCanchaError('');
    setCanchaLoading(true);
    try {
      const response = await fetch('/api/admin/canchas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: nombreCancha, costo: costoCancha })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar la cancha.');
      }
      setCanchaMsg('Cancha registrada exitosamente.');
      setNombreCancha('');
      setCostoCancha('');
      setTimeout(() => {
        setMostrarFormularioCancha(false);
        setCanchaMsg('');
      }, 1200);
    } catch (err) {
      setCanchaError(err.message);
    } finally {
      setCanchaLoading(false);
    }
  };

  const fetchReservationHistory = async () => {
    if (!token) {
      setError("No se encontró el token de autenticación.");
      return;
    }
    setLoading(true);
    setError('');
    setHasFetched(true);
    try {
      const response = await fetch('/api/admin/reservas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al obtener el historial.' }));
        throw new Error(errorData.message);
      }
      const data = await response.json();
      setReservations(data);
      setMostrarHistorial(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEnviarNotificacion = async (e) => {
    e.preventDefault();
    setNotiMsg("");
    setNotiError("");
    setNotiLoading(true);
    try {
      const response = await fetch('/api/admin/notificaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mensaje: mensajeNotificacion })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al enviar la notificación.');
      }
      setNotiMsg('¡Notificación enviada a todos los usuarios!');
      setMensajeNotificacion("");
      setTimeout(() => {
        setMostrarFormularioNotificacion(false);
        setNotiMsg("");
      }, 1500);
    } catch (err) {
      setNotiError(err.message);
    } finally {
      setNotiLoading(false);
    }
  };
  const handleDesbloquear = async (reservaId) => {
    if (!window.confirm(`¿Estás seguro de que quieres desbloquear este horario (ID: ${reservaId})?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/reservas/${reservaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al desbloquear.");
      }
      alert('¡Horario desbloqueado exitosamente!');

      fetchReservationHistory(); 
    } catch (err) {
      setError(err.message);
    }
  };

  // --- NUEVA FUNCIÓN: Confirmar una reserva como Admin ---
  const handleAdminConfirm = async (reservaId) => {
    if (!window.confirm(`¿Estás seguro de que quieres confirmar la reserva ID: ${reservaId}?`)) return;
    try {
      const res = await fetch(`/api/admin/reservas/${reservaId}/confirmar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Reserva confirmada exitosamente.');
      fetchReservationHistory(); // Recargar el historial para ver el cambio
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // --- NUEVA FUNCIÓN: Cancelar una reserva como Admin ---
  const handleAdminCancel = async (reservaId) => {
    if (!window.confirm(`¿Estás seguro de que quieres cancelar la reserva ID: ${reservaId}? Se reembolsará el saldo al usuario.`)) return;
    try {
      const res = await fetch(`/api/admin/reservas/${reservaId}/cancelar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Reserva cancelada exitosamente.');
      fetchReservationHistory(); // Recargar el historial
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(date.getTime())) return 'Fecha Inválida';
    return date.toLocaleDateString('es-CL');
  };

  if (!user) return <p>Cargando...</p>;

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido/a, Administrador {user.nombre || user.rut}!</p>
      </header>

      {!mostrandoSeccion && (
        <>
          <section className="admin-register-court-section">
            <button
              className="btn btn-primary"
              onClick={() => setMostrarFormularioCancha(true)}
              style={{ marginBottom: '1rem' }}
            >
              Registrar Cancha
            </button>
          </section>
          <nav className="admin-dashboard-nav">
            <button onClick={fetchReservationHistory} className="admin-nav-link" disabled={loading}>
              {loading ? 'Cargando...' : 'Ver Historial de Reservas'}
            </button>

            <button onClick={() => setMostrarReportePagos(true)} className="admin-nav-link">
              Ver Reporte de Pagos/Ingresos
            </button>
          
          </nav>
          <section className="admin-availability-section">
            <button onClick={() => setMostrarGestionDisponibilidad(true)} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
              Bloquear Disponibilidad de Canchas
            </button>
          </section>

          <section className="admin-create-reservation-section">
            <button onClick={() => setMostrarCrearReserva(true)} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
                Crear Reserva para Usuario
            </button>
          </section>

          <section className="admin-inventory-section">
            <button onClick={() => setMostrarGestionInventario(true)} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
              Gestionar Inventario
            </button>
          </section>

          <section className="admin-notificacion-section">
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarFormularioNotificacion(true)}
                style={{ marginBottom: '1rem' }}
              >
                Enviar Notificación
              </button>
          </section>
          
          <button onClick={logout} className="admin-logout-button">Cerrar Sesión</button>
        </>
      )}

      
      {mostrarFormularioCancha && (
        <section className="admin-section">
            <form onSubmit={handleRegisterCancha} className="register-court-form">
                <div className="form-group">
                    <label htmlFor="nombreCancha">Nombre de la cancha:</label>
                    <input id="nombreCancha" type="text" value={nombreCancha} onChange={e => setNombreCancha(e.target.value)} required minLength={2} disabled={canchaLoading} />
                </div>
                <div className="form-group">
                    <label htmlFor="costoCancha">Costo ($):</label>
                    <input id="costoCancha" type="number" value={costoCancha} onChange={e => setCostoCancha(e.target.value)} required min={0} step="0.01" disabled={canchaLoading} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={canchaLoading}>{canchaLoading ? 'Registrando...' : 'Registrar'}</button>
                <button type="button" className="btn btn-secondary" style={{ marginLeft: '1rem' }} onClick={() => { setMostrarFormularioCancha(false); setCanchaMsg(''); setCanchaError(''); }} disabled={canchaLoading}> Cancelar</button>
            </form>
            {canchaMsg && <p className="success-message">{canchaMsg}</p>}
            {canchaError && <p className="error-message">{canchaError}</p>}
        </section>
      )}

      {mostrarHistorial && (
        <main className="admin-dashboard-main-content">
          {loading && <p>Cargando historial de reservas...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && hasFetched && (
            <div className="reservations-history-section">
              <h3>Historial Completo de Reservas y Bloqueos</h3>
              {reservations.length > 0 ? (
                <table className="reservations-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>Cancha</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Estado</th>
                      <th>Costo Reserva</th>
                      <th>Costo Equip.</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(reserva => (
                      <tr key={reserva.id}>
                        <td>{reserva.id}</td>
                        <td>{formatDate(reserva.fechaReserva || reserva.fecha)}</td>
                        <td>{reserva.horaInicio} - {reserva.horaTermino}</td>
                        <td>{reserva.cancha?.nombre || 'N/A'}</td>
                        <td>{reserva.usuario?.nombre || reserva.userRut}</td>
                        <td>{reserva.usuario?.email || 'N/A'}</td>
                        <td>{reserva.estadoReserva}</td>
                        <td>${reserva.cancha ? Number(reserva.cancha.costo).toLocaleString('es-CL') : 'N/A'}</td>
                        <td>${Number(reserva.costoEquipamiento).toLocaleString('es-CL')}</td>
                        <td>
                          {reserva.estadoReserva === 'Pendiente' && (
                            <button onClick={() => handleAdminConfirm(reserva.id)} className="btn-confirm">Confirmar</button>
                          )}
                          
                          {['Pendiente', 'Confirmada'].includes(reserva.estadoReserva) && (
                            <button onClick={() => handleAdminCancel(reserva.id)} className="btn-cancel">Cancelar</button>
                          )}
                          {reserva.estadoReserva === 'CanceladaPorAdmin' && (
                            <button 
                              className="btn-desbloquear"
                              onClick={() => handleDesbloquear(reserva.id)}
                            >
                              Desbloquear Horario
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No se encontraron reservas en el sistema.</p>
              )}
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setMostrarHistorial(false)}>Volver al Panel</button>
            </div>
          )}
        </main>
      )}
      
      {mostrarGestionDisponibilidad && (
        <section className="admin-section">
          <AdminDisponibilidad token={token} />
          <button onClick={() => setMostrarGestionDisponibilidad(false)} style={{marginTop: '20px'}}>
            Volver al Panel
          </button>
        </section>
      )}

      {mostrarFormularioNotificacion && (
        <section className="admin-section">
            <form className="notificacion-form" onSubmit={handleEnviarNotificacion}>
                <label htmlFor="mensajeNotificacion"><b>Mensaje de Notificación:</b></label>
                <textarea id="mensajeNotificacion" value={mensajeNotificacion} onChange={e => setMensajeNotificacion(e.target.value)} rows={3} required placeholder="Escribe el mensaje para todos los usuarios..." style={{ width: '100%', marginBottom: '1rem', borderRadius: '8px', padding: '10px', fontSize: '1.1em' }} />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button type="submit" className="btn btn-primary" disabled={notiLoading}>{notiLoading ? 'Enviando...' : 'Enviar'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setMostrarFormularioNotificacion(false)}>Cancelar</button>
                </div>
                {notiMsg && <div className="success-message" style={{ marginTop: '1rem' }}>{notiMsg}</div>}
                {notiError && <div className="error-message" style={{ marginTop: '1rem' }}>{notiError}</div>}
            </form>
        </section>
      )}

      {mostrarReportePagos && (
        <section className="admin-dashboard-main-content">
          <ReportePagosPage /> 
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: '20px' }} 
            onClick={() => setMostrarReportePagos(false)}
          >
            Volver al Panel Principal
          </button>
        </section>
      )}
      {mostrarCrearReserva && (
        <section className="admin-section">
          {!selectedCourt ? (
            <div>
              <h2>Crear Reserva para Usuario</h2>
              <p>Disponibilidad de reservas de 8:00hrs a 20:00hrs.</p>
              <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <label htmlFor="reserva-fecha-admin" style={{ marginRight: '10px', fontWeight: 'bold' }}>Paso 1: Seleccione la fecha</label>
                <input type="date" id="reserva-fecha-admin" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
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
          ) : (
            <div>
              <h3>Reserva para {selectedCourt.nombre} el {selectedDate}</h3>
              <form onSubmit={handleReservationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* SECCIÓN MODIFICADA */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <div>
                      <label>Hora de inicio:</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                  </div>
                  <div>
                      <label>Hora de término:</label>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                  </div>
                  {/* ESTE ES EL NUEVO CAMPO PARA EL RUT */}
                  <div>
                      <label>RUT de quien reserva:</label>
                      <input 
                          type="text" 
                          placeholder="Ej: 11222333-4" 
                          value={userRut} 
                          onChange={(e) => setUserRut(e.target.value)} 
                          required 
                      />
                  </div>
                    <label style={{ marginLeft: 'auto', userSelect: 'none', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={quiereEquipamiento} 
                            onChange={(e) => setQuiereEquipamiento(e.target.checked)} 
                        /> ¿Necesita equipamiento?
                    </label>
                </div>
                  {quiereEquipamiento && (
                    <div style={{ border: '1px solid #007bff', borderRadius: '8px', padding: '20px', marginTop: '10px', backgroundColor: '#f8f9fa' }}>
                      <h4 style={{ textAlign: 'center', marginTop: 0, marginBottom: '15px' }}>Seleccionar Equipamiento</h4>
                      
                      {loadingEquipamiento && <p>Cargando inventario...</p>}
                      {!loadingEquipamiento && inventario.length === 0 && <p>No hay equipamiento disponible en inventario.</p>}
                      
                      {!loadingEquipamiento && inventario.length > 0 && equiposSeleccionados.map((equipo, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          
                          <select value={equipo.tipo} onChange={(e) => handleEquipoSelectionChange(index, 'tipo', e.target.value)} style={{ flex: 2 }}>
                            <option value="">-- Tipo de Equipo --</option>
                            {[...new Set(inventario.map(item => item.tipo))].map(tipo => (
                              <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                          </select>

                          <select value={equipo.id} onChange={(e) => handleEquipoSelectionChange(index, 'id', e.target.value)} disabled={!equipo.tipo} style={{ flex: 3 }}>
                            <option value="">-- Modelo (Stock) --</option>
                            {inventario.filter(item => item.tipo === equipo.tipo).map(item => (
                              <option key={item.id} value={item.id}>
                                {item.nombre} (Stock: {item.stock})
                              </option>
                            ))}
                          </select>
                          
                          <input type="number" min="1" value={equipo.cantidad} onChange={(e) => handleEquipoSelectionChange(index, 'cantidad', e.target.value)} placeholder="Cant." style={{ width: '70px' }} />
                          
                          <button type="button" onClick={() => handleRemoveEquipoRow(index)} style={{ border: 'none', background: 'transparent', color: 'red', cursor: 'pointer', fontSize: '1.5rem', padding: 0, lineHeight: 1 }}>
                            &times;
                          </button>
                        </div>
                      ))}

                      {!loadingEquipamiento && inventario.length > 0 && (
                        <button type="button" onClick={handleAddEquipoRow} style={{ display: 'block', margin: '15px auto 0' }} className="btn btn-secondary">
                          Añadir Equipamiento
                        </button>
                      )}
                    </div>
                  )}
                <hr />

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

                <div style={{ marginTop: '10px' }}>
                  <button type="submit" disabled={submissionLoading}>{submissionLoading ? 'Creando Reserva...' : 'Crear Reserva'}</button>
                  <button type="button" onClick={() => setSelectedCourt(null)} style={{ marginLeft: '10px' }}>Volver a elegir cancha</button>
                </div>
                
                {submissionMessage && <p style={{ color: 'green' }}>{submissionMessage}</p>}
                {submissionError && <p style={{ color: 'red' }}>{submissionError}</p>}
              </form>
            </div>
          )}
          <button onClick={handleCloseReservationFlow} className="btn btn-secondary" style={{ marginTop: '20px' }}>
            Cancelar y Volver al Panel
          </button>
        </section>
      )}

      {mostrarGestionInventario && (
        <section className="admin-section">
          <AdminInventario /> {/* <-- Renderiza el nuevo componente aquí */}
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: '20px' }} 
            onClick={() => setMostrarGestionInventario(false)}
          >
            Volver al Panel Principal
          </button>
        </section>
      )}
    </div>
  );
}

export default AdminDashboardPage;
