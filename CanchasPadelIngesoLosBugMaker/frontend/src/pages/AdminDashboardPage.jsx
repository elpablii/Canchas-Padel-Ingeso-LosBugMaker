// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const { user, logout, token } = useAuth();
  
  // Estado para el formulario de nueva cancha
  const [nombreCancha, setNombreCancha] = useState('');
  const [costoCancha, setCostoCancha] = useState('');
  const [canchaMsg, setCanchaMsg] = useState('');
  const [canchaError, setCanchaError] = useState('');
  const [canchaLoading, setCanchaLoading] = useState(false);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  // Estado para mostrar/ocultar el formulario
  const [mostrarFormularioCancha, setMostrarFormularioCancha] = useState(false);

  // Estado para mostrar/ocultar el historial de reservas
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // --- NUEVA FUNCIÓN: Registrar cancha ---
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
      // Ocultar el formulario y volver al panel principal
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
      setError("No se encontró el token de autenticación. Por favor, inicie sesión de nuevo.");
      return;
    }
    setLoading(true);
    setError('');
    setHasFetched(true);
    try {
      const response = await fetch('/api/admin/reservas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al obtener el historial.' }));
        throw new Error(errorData.message);
      }
      
      const data = await response.json();
      setReservations(data);
      setMostrarHistorial(true); // Mostrar historial
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Cargando...</p>;

  // Función para formatear la fecha de forma segura
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Reemplazar '-' por '/' evita problemas de zona horaria en algunos navegadores
    const date = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(date.getTime())) {
      return 'Fecha Inválida';
    }
    return date.toLocaleDateString('es-CL');
  };

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido/a, Administrador {user.nombre || user.rut}!</p>
      </header>

      {/* --- BOTÓN Y FORMULARIO DE REGISTRO DE CANCHA --- */}
      <section className="admin-register-court-section">
        {/* El título solo aparece cuando NO se muestra el formulario ni el historial */}
        {!mostrarFormularioCancha && !mostrarHistorial && <h2>Registrar Nueva Cancha</h2>}
        {/* Botón para registrar cancha solo si no se muestra el formulario ni el historial */}
        {!mostrarFormularioCancha && !mostrarHistorial && (
          <button
            className="btn btn-primary"
            onClick={() => setMostrarFormularioCancha(true)}
            style={{ marginBottom: '1rem' }}
          >
            Registrar Cancha
          </button>
        )}
        {/* Formulario de registrar cancha */}
        {mostrarFormularioCancha && (
          <form onSubmit={handleRegisterCancha} className="register-court-form">
            <div className="form-group">
              <label htmlFor="nombreCancha">Nombre de la cancha:</label>
              <input
                id="nombreCancha"
                type="text"
                value={nombreCancha}
                onChange={e => setNombreCancha(e.target.value)}
                required
                minLength={2}
                disabled={canchaLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="costoCancha">Costo ($):</label>
              <input
                id="costoCancha"
                type="number"
                value={costoCancha}
                onChange={e => setCostoCancha(e.target.value)}
                required
                min={0}
                step="0.01"
                disabled={canchaLoading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={canchaLoading}>
              {canchaLoading ? 'Registrando...' : 'Registrar'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: '1rem' }}
              onClick={() => {
                setMostrarFormularioCancha(false);
                setCanchaMsg('');
                setCanchaError('');
              }}
              disabled={canchaLoading}
            >
              Cancelar
            </button>
          </form>
        )}
        {canchaMsg && <p className="success-message">{canchaMsg}</p>}
        {canchaError && <p className="error-message">{canchaError}</p>}
      </section>

      {/* Botón para ver historial solo si no se muestra el formulario ni el historial */}
      {!mostrarFormularioCancha && !mostrarHistorial && (
        <nav className="admin-dashboard-nav">
          <button onClick={fetchReservationHistory} className="admin-nav-link" disabled={loading}>
            {loading ? 'Cargando...' : 'Ver Historial de Reservas'}
          </button>
        </nav>
      )}

      {/* Mostrar historial solo si mostrarHistorial es true */}
      {mostrarHistorial && (
        <main className="admin-dashboard-main-content">
          {loading && <p>Cargando historial de reservas...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && hasFetched && (
            <div className="reservations-history-section">
              <h3>Historial Completo de Reservas</h3>
              {reservations.length > 0 ? (
                <table className="reservations-table">
                  <thead>
                    <tr>
                      <th>ID Reserva</th>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>Cancha</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Estado</th>
                      <th>Costo Reserva</th>
                      <th>Costo Equip.</th>
                      <th>Saldo Usuario</th>
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
                        <td>${reserva.usuario ? Number(reserva.usuario.saldo).toLocaleString('es-CL') : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No se encontraron reservas en el sistema.</p>
              )}
              <button
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
                onClick={() => setMostrarHistorial(false)}
              >
                Volver al Panel
              </button>
            </div>
          )}
        </main>
      )}

      {/* El mensaje y el botón de cerrar sesión solo aparecen si no se muestra el formulario ni el historial */}
      {!mostrarFormularioCancha && !mostrarHistorial && (
        <>
          <button onClick={logout} className="admin-logout-button">Cerrar Sesión</button>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
