import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Para obtener el token

function AdminDisponibilidad() {
  const [canchas, setCanchas] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { token } = useAuth();

  const [filtros, setFiltros] = useState({
    fecha: '',
    horaInicio: '',
    horaTermino: ''
  });

  // Cargar lista de canchas al montar el componente
  useEffect(() => {
    const fetchCanchas = async () => {
      const res = await fetch('/api/canchas'); 
      const data = await res.json();
      setCanchas(data);
    };
    fetchCanchas();
  }, []);

  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleBuscar = async () => {
    const { fecha, horaInicio, horaTermino } = filtros;
    if (!fecha || !horaInicio || !horaTermino) {
        setError("Por favor, complete todos los campos de fecha y hora.");
        return;
    }
    const queryString = new URLSearchParams({ date: fecha, horaInicio, horaTermino }).toString();
    const res = await fetch(`/api/disponibilidad?${queryString}`);
    const data = await res.json();
    setDisponibilidad(data.disponibles);
  };

  const handleBloquear = async (canchaId) => {
    const { fecha, horaInicio, horaTermino } = filtros;
    if (!window.confirm(`¿Seguro que quieres bloquear el horario de ${horaInicio} a ${horaTermino} para ${canchaId === 'todas' ? 'TODAS las canchas' : `la cancha ${canchaId}`}?`)) {
        return;
    }

    try {
        const res = await fetch('/api/admin/bloquear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fecha, horaInicio, horaTermino, canchaId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        setMensaje('¡Horario bloqueado con éxito!');
        handleBuscar(); 
    } catch (err) {
        setError(err.message);
    }
  };

  return (
    <div className="admin-disponibilidad-section">
        <h3>Gestionar Disponibilidad de Canchas</h3>
        <div className="filtros-container">
            <input type="date" name="fecha" value={filtros.fecha} onChange={handleChange} />
            <input type="time" name="horaInicio" value={filtros.horaInicio} onChange={handleChange} />
            <input type="time" name="horaTermino" value={filtros.horaTermino} onChange={handleChange} />
            <button onClick={handleBuscar}>Ver Disponibilidad</button>
        </div>

        {error && <p className="error-message">{error}</p>}
        {mensaje && <p className="success-message">{mensaje}</p>}

        {disponibilidad.length > 0 && (
            <div className="resultados-disponibilidad">
                <h4>Canchas Disponibles</h4>
                <ul>
                    {disponibilidad.map(cancha => (
                        <li key={cancha.id}>
                           <span>Cancha {cancha.nombre}</span>
                           <button onClick={() => handleBloquear(cancha.id)}>Bloquear esta cancha</button>
                        </li>
                    ))}
                </ul>
                <button onClick={() => handleBloquear('todas')} className="btn-bloquear-todas">
                    Bloquear este horario en TODAS las canchas disponibles
                </button>
            </div>
        )}
    </div>
  );
}

export default AdminDisponibilidad;