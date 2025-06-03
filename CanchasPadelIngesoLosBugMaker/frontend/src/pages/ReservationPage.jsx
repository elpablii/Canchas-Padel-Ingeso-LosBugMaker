import React, { useState } from 'react';
import AvailableCourts from '../components/AvailableCourts';

function ReservationPage() {
  const [date, setDate] = useState('');

  return (
    <div style={{ padding: '20px' }}>
      <h2>Reserve a Court</h2>
      <label>Select a date:</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {date && <AvailableCourts date={date} />}
    </div>
  );
}

export default ReservationPage;