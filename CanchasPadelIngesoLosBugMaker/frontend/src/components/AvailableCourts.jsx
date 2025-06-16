import React, { useEffect, useState } from 'react';
import ReservationForm from './ReservationForm';

function AvailableCourts({ date }) {
  // Estados para el componente
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFullDayAvailability = async () => {
      // Si no hay fecha, no hacemos nada.
      if (!date) return;

      setLoading(true);
      setError('');
      setCourts([]);
      setSelectedCourt(null); 

      try {
        const horaInicio = '08:00';
        const horaTermino = '20:00';

        const queryString = new URLSearchParams({
          date: date,
          horaInicio: horaInicio,
          horaTermino: horaTermino,
        }).toString();

        const response = await fetch(`/api/disponibilidad?${queryString}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al obtener la disponibilidad.');
        }

        setCourts(data.disponibles || []);

      } catch (error) {
        console.error('Error fetching courts:', error);
        setError('Error al cargar la disponibilidad de las canchas.');
      } finally {
        setLoading(false);
      }
    };

    fetchFullDayAvailability();
  }, [date]); 

  return (
    <div>
      <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Canchas totalmente disponibles para el día: {date}
      </h3>

      <div style={{ marginTop: '20px' }}>
        {loading && <p>Buscando canchas disponibles...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && courts.length === 0 && (
          <p>Lo sentimos, no hay canchas completamente libres para esta fecha.</p>
        )}

        <div style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          marginTop: '16px'
        }}>
          {courts.map((court) => (
            <div
              key={court.id}
              className="court-card"
              onClick={() => setSelectedCourt(court)}
              style={{
                 border: '1px solid #ccc',
                 padding: '16px',
                 borderRadius: '8px',
                 cursor: 'pointer',
                 textAlign: 'center'
              }}
            >
              <h4>{court.nombre}</h4>
              <p>
                <strong>Costo:</strong>{' '}
                {Number(court.costo).toLocaleString('es-CL', {
                  style: 'currency',
                  currency: 'CLP'
                })}
              </p>
              <button className="reserve-button">Reservar en esta cancha</button>
            </div>
          ))}
        </div>
      </div>

      {selectedCourt && (
        <ReservationForm
          court={selectedCourt}
          date={date}
          onClose={() => setSelectedCourt(null)}
        />
      )}
    </div>
  );
}

export default AvailableCourts;
