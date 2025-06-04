import React, { useEffect, useState } from 'react';

function ReservationHistory() {
  const [reservations, setReservations] = useState([]);
  const rutReserva = localStorage.getItem('rutUsuario');

  const fetchReservations = async () => {
    try {
      const res = await fetch(`/api/reservas/historial/${rutReserva}`);
      if (!res.ok) throw new Error('Respuesta no válida del servidor');
      const data = await res.json();
      setReservations(data.reservas || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id) => {
    try {
      await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
      fetchReservations();
    } catch (err) {
      console.error('Error canceling reservation:', err);
    }
  };

  const now = new Date();

  const sorted = [...reservations].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.horaInicio}`);
    const dateB = new Date(`${b.fecha}T${b.horaInicio}`);
    const isAActive = !a.cancelada && dateA > now;
    const isBActive = !b.cancelada && dateB > now;

    if (isAActive && !isBActive) return -1;
    if (!isAActive && isBActive) return 1;
    return dateB - dateA; // más reciente primero
  });

  return (
    <div>
      <h2>Historial de Reservas</h2>
      <div style={{ marginTop: 20 }}>
        {sorted.length === 0 ? (
          <p>No tienes reservas registradas.</p>
        ) : (
          sorted.map((r) => {
            const isFuture = new Date(`${r.fecha}T${r.horaInicio}`) > now;
            const isActive = !r.cancelada && isFuture;

            return (
              <div
                key={r.id}
                style={{
                  border: '1px solid #ccc',
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: r.cancelada ? '#fdd' : '#dfd',
                  borderLeft: r.cancelada ? '4px solid red' : '4px solid green',
                  borderRadius: 6
                }}
              >
                <p><strong>Fecha:</strong> {r.fecha}</p>
                <p><strong>Hora:</strong> {r.horaInicio}</p>
                <p><strong>Cancha:</strong> {r.cancha?.nombre || r.canchaId}</p>
                <p><strong>Estado:</strong> {r.cancelada ? 'Cancelada' : 'Activa'}</p>
                {isActive && (
                  <button onClick={() => handleCancel(r.id)}>
                    Cancelar Reserva
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ReservationHistory;
