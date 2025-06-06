import React, { useEffect, useState } from 'react';

function ReservationHistory() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  // Usamos el RUT guardado en localStorage al iniciar sesión
  const userRut = localStorage.getItem('rutUsuario'); 

  // Función para obtener las reservas
  const fetchReservations = async () => {
    if (!userRut) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/reservas/historial/${userRut}`);
      if (!res.ok) throw new Error('Respuesta no válida del servidor');
      const data = await res.json();
      setReservations(data.reservas || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar las reservas cuando el componente se monta
  useEffect(() => {
    fetchReservations();
  }, [userRut]); // Depende de userRut por si cambia

  // Función para cancelar una reserva
  const handleCancel = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return;

    try {
      const res = await fetch(`/api/reservas/${id}/cancelar`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert('Reserva cancelada exitosamente.');
      fetchReservations(); // Recargar la lista para mostrar el estado actualizado
    } catch (err) {
      console.error('Error canceling reservation:', err);
      alert(`Error: ${err.message}`);
    }
  };

  //confirmar reserva
  const handleConfirmar = async (id) => {
  try {
    const res = await fetch(`/api/reservas/${id}/confirmar`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert('¡Reserva confirmada!');
    // Actualizar el estado local para reflejar el cambio
    setReservations(prev => prev.map(r => 
      r.id === id ? { ...r, estadoReserva: 'Confirmada' } : r
    ));
  } catch (err) {
    console.error('Error al confirmar reserva:', err);
    alert(`Error: ${err.message}`);
  }
};

  const now = new Date();

  // Ordenar las reservas: activas primero, luego por fecha más reciente
  const sortedReservations = [...reservations].sort((a, b) => {
    const dateA = new Date(`${a.fecha}T${a.horaInicio}`);
    const dateB = new Date(`${b.fecha}T${b.horaInicio}`);
    
    // Una reserva es activa si su estado es cancelable Y es en el futuro
    const isAActive = ['Pendiente', 'Confirmada'].includes(a.estadoReserva) && dateA > now;
    const isBActive = ['Pendiente', 'Confirmada'].includes(b.estadoReserva) && dateB > now;

    if (isAActive && !isBActive) return -1;
    if (!isAActive && isBActive) return 1;
    
    return dateB - dateA; // Si ambas son activas o inactivas, ordena por fecha
  });
  
  if (loading) return <p>Cargando historial...</p>;

  return (
    <div>
      <h2>Historial de Reservas</h2>
      <div style={{ marginTop: 20 }}>
        {sortedReservations.length === 0 ? (
          <p>No tienes reservas registradas.</p>
        ) : (
        sortedReservations.map((r) => {
            const isFuture = new Date(`${r.fecha}T${r.horaInicio}`) > now;
            const isCancelable = ['Pendiente', 'Confirmada'].includes(r.estadoReserva) && isFuture;
            const isCancelledBySystem = r.estadoReserva.startsWith('Cancelada');

            return (
              <div
                key={r.id}
                style={{
                    border: '1px solid #ccc',
                    marginBottom: '12px',
                    padding: '10px',
                    backgroundColor: isCancelledBySystem ? '#ffebee' : (isCancelable ? '#e8f5e9' : '#f5f5f5'),
                    borderLeft: isCancelledBySystem ? '4px solid #f44336' : (isCancelable ? '4px solid #4caf50' : '4px solid #9e9e9e'),
                    borderRadius: 6
                }}
              >
                <p><strong>Cancha:</strong> {r.cancha?.nombre || `ID ${r.canchaId}`}</p>
                <p><strong>Fecha:</strong> {new Date(r.fecha).toLocaleDateString('es-CL')}</p>
                <p><strong>Hora:</strong> {r.horaInicio}</p>
                <p><strong>Estado:</strong> {r.estadoReserva}</p>
                
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  
                  {/* Botón para CONFIRMAR (con la condición corregida) */}
                  {r.estadoReserva === 'Pendiente' && isFuture && ( // <--- ¡AQUÍ ESTÁ EL CAMBIO!
                    <button 
                      onClick={() => handleConfirmar(r.id)} 
                      style={{backgroundColor: '#007bff', color: 'white', border:'none', padding: '8px 12px', borderRadius: '4px', cursor:'pointer'}}
                    >
                      Confirmar Reserva
                    </button>
                  )}

                  {/* Botón para CANCELAR (este ya estaba bien) */}
                  {isCancelable && (
                    <button 
                      onClick={() => handleCancel(r.id)} 
                      style={{backgroundColor: '#dc3545', color: 'white', border:'none', padding: '8px 12px', borderRadius: '4px', cursor:'pointer'}}
                    >
                      Cancelar Reserva
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ReservationHistory;
