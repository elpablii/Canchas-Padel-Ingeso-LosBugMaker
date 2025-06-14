import React, { useEffect, useState } from 'react';
import ReservationForm from './ReservationForm';

function AvailableCourts({ date }) {
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourts = async () => {
      if (!date) return;

      try {
        const response = await fetch(`/api/disponibilidad?date=${date}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || 'Error fetching court disponibilidad');
          setCourts([]);
          return;
        }

        const data = await response.json();
        setCourts(data.disponibles || []);
        setError('');
      } catch (error) {
        console.error('Error fetching courts:', error);
        setError('Error fetching courts');
        setCourts([]);
      }
    };

    fetchCourts();
  }, [date]);

  return (
    <div>
      <h3>Canchas disponibles para: {date}</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {courts.length === 0 && !error && <p>Lo sentimos, no hay canchas disponibles para esta fecha.</p>}

      <div style={{
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        marginTop: '16px'
      }}>
        {courts.map((court) => (
          <div
            key={court.id}
            style={{
              border: '1px solid #ccc',
              padding: '16px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: '#f0faff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
            }}
            onClick={() => setSelectedCourt(court)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
          <h4>{court.name || `${court.nombre}`}</h4>
          <p><strong>ID:</strong> {court.id}</p>
          <p>
            <strong>Valor de reserva:</strong>{' '}
            {court.costo
              ? `$${parseInt(court.costo, 10).toLocaleString('es-CL')}`
              : 'N/A'}
          </p>
          </div>
        ))}
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