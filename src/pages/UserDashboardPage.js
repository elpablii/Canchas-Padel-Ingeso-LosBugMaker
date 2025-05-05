import React, { useState, useEffect } from 'react';
// Asumiendo que tendrás un componente para mostrar cada reserva
// import ReservationCard from '../components/ReservationCard';
// Asumiendo que tendrás un servicio para obtener los datos del backend
// import apiService from '../services/apiService';

function UserDashboardPage() {
  // Estados para guardar las reservas del usuario
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect para cargar las reservas cuando el componente se monta
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      try {
        // --- Lógica para llamar al backend ---
        // Ejemplo: const data = await apiService.getMyReservations();
        // Simulación con datos de ejemplo:
        const data = {
          upcoming: [
            { id: 1, court: 'Cancha 1', date: '2025-05-10', time: '18:00', status: 'Confirmada' },
            { id: 2, court: 'Cancha 3', date: '2025-05-12', time: '19:00', status: 'Confirmada' },
          ],
          past: [
            { id: 3, court: 'Cancha 1', date: '2025-04-28', time: '20:00', status: 'Completada' },
          ],
        };
        // ------------------------------------

        setUpcomingReservations(data.upcoming || []);
        setPastReservations(data.past || []);
        setError(null); // Limpiar errores previos
      } catch (err) {
        console.error("Error al cargar reservas:", err);
        setError("No se pudieron cargar las reservas. Inténtalo de nuevo más tarde.");
        setUpcomingReservations([]);
        setPastReservations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  const handleCancelReservation = async (reservationId) => {
    // --- Lógica para llamar al backend y cancelar ---
    console.log(`Cancelar reserva ${reservationId}`);
    // Ejemplo: await apiService.cancelReservation(reservationId);
    // Después de cancelar, volver a cargar las reservas o actualizar el estado local
    // fetchReservations();
    alert(`Reserva ${reservationId} cancelada (simulación)`);
    // Actualizar estado local para reflejar cancelación
    setUpcomingReservations(prev => prev.filter(res => res.id !== reservationId));
    // -------------------------------------------------
  };

  return (
    <div>
      <h2>Mi Panel de Usuario</h2>

      {/* Sección de Notificaciones/Recordatorios */}
      {/* Podría mostrar mensajes importantes o recordatorios aquí */}
      {/* [cite: 11] */}
      <div style={{ border: '1px solid lightblue', padding: '10px', marginBottom: '20px' }}>
         <h4>Notificaciones</h4>
         <p>Recordatorio: Tu reserva para la Cancha 1 es mañana a las 18:00.</p>
      </div>


      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Próximas Reservas</h3>
      {isLoading ? (
        <p>Cargando próximas reservas...</p>
      ) : upcomingReservations.length > 0 ? (
        <ul>
          {upcomingReservations.map((res) => (
            // Idealmente, usar un componente ReservationCard aquí
            <li key={res.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              <strong>{res.court}</strong> - {res.date} a las {res.time} ({res.status})
              {/* Botón para cancelar [cite: 11] (considerando reglas de negocio) */}
              <button onClick={() => handleCancelReservation(res.id)} style={{ marginLeft: '15px' }}>
                 Cancelar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tienes próximas reservas.</p>
      )}

      <h3>Historial de Reservas</h3>
       {/* [cite: 9] - Aunque el historial es más relevante para el admin, el usuario puede verlo */}
      {isLoading ? (
        <p>Cargando historial...</p>
      ) : pastReservations.length > 0 ? (
        <ul>
          {pastReservations.map((res) => (
            <li key={res.id} style={{ margin: '5px' }}>
              {res.court} - {res.date} a las {res.time} ({res.status})
            </li>
          ))}
        </ul>
      ) : (
        <p>No tienes reservas pasadas.</p>
      )}

      {/* Podría haber una sección para gestionar perfil */}
      {/* <h3>Mi Perfil</h3> */}
      {/* <p>Editar información personal...</p> */}

    </div>
  );
}

export default UserDashboardPage;