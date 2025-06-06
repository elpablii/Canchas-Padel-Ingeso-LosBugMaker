// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const { user, logout, token } = useAuth();
  
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

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
      console.log("Datos de Reservas Recibidos del Backend:", data); // Log de depuración útil
      setReservations(data);
    } catch (err) {
      console.error("Error fetching reservation history:", err);
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

      <nav className="admin-dashboard-nav">
        <button onClick={fetchReservationHistory} className="admin-nav-link" disabled={loading}>
          {loading ? 'Cargando...' : 'Ver Historial de Reservas'}
        </button>
      </nav>

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
                      {/* CORRECCIÓN FINAL: Usar el nombre de campo correcto que viene del backend */}
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
          </div>
        )}
        
        {!hasFetched && !loading && (
            <p>Haga clic en "Ver Historial de Reservas" para comenzar.</p>
        )}
      </main>

      <button onClick={logout} className="admin-logout-button">Cerrar Sesión</button>
    </div>
  );
}

export default AdminDashboardPage;
