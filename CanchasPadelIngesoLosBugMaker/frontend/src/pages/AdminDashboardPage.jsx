import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AdminDisponibilidad from '../components/AdminDisponibilidad.jsx';
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const { user, logout, token } = useAuth();
  
  // --- ESTADOS PARA CONTROLAR LA VISIBILIDAD DE CADA SECCIÓN ---
  const [mostrarFormularioCancha, setMostrarFormularioCancha] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarFormularioNotificacion, setMostrarFormularioNotificacion] = useState(false);
  const [mostrarGestionDisponibilidad, setMostrarGestionDisponibilidad] = useState(false); // <-- NUEVO ESTADO

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

  // Variable para saber si se está mostrando alguna sección y así ocultar el menú principal
  const mostrandoSeccion = mostrarFormularioCancha || mostrarHistorial || mostrarFormularioNotificacion || mostrarGestionDisponibilidad;

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
          </nav>
          <section className="admin-availability-section">
            <button onClick={() => setMostrarGestionDisponibilidad(true)} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
              Bloquear Disponibilidad de Canchas
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
                          {/* --- BOTÓN CONDICIONAL --- */}
                          {reserva.estadoReserva === 'CanceladaPorAdmin' && (
                            <button 
                              className="btn-desbloquear"
                              onClick={() => handleDesbloquear(reserva.id)}
                            >
                              Desbloquear
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
    </div>
  );
}

export default AdminDashboardPage;
