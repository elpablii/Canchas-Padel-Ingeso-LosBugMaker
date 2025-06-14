import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Notificaciones.css';

function Notificaciones() {
  const { token, user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  const obtenerNotificaciones = async () => {
    if (!token || !user) return;
    
    console.log('RUT usado para obtener notificaciones:', user.rut);
    setLoading(true);
    try {
      const response = await fetch(`/api/notificaciones/${user.rut}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener notificaciones');
      }

      const data = await response.json();
      console.log('Respuesta de la API de notificaciones:', data);
      setNotificaciones(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (notificacionId) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificacionId}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }

      setNotificaciones(prev =>
        prev.map(notif =>
          notif.id === notificacionId ? { ...notif, leida: true } : notif
        )
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    obtenerNotificaciones();
    const intervalo = setInterval(obtenerNotificaciones, 60000);
    return () => clearInterval(intervalo);
  }, [token, user]);

  return (
    <div className="notificaciones-container">
      {loading ? (
        <p className="loading-message">Cargando notificaciones...</p>
      ) : notificaciones.length > 0 ? (
        <ul className="notificaciones-lista">
          {notificaciones.map(notif => (
            <li key={notif.id} className={`notificacion-item${notif.leida ? ' leida' : ''}`}>
              <div className="notificacion-contenido">
                <p className="notificacion-mensaje">{notif.mensaje}</p>
                <small className="notificacion-fecha">
                  {new Date(notif.createdAt).toLocaleString('es-CL')}
                </small>
                {notif.leida && (
                  <span className="notificacion-leida-label" title="Leída">(leída)</span>
                )}
              </div>
              {!notif.leida && (
                <button
                  className="notificacion-leer"
                  onClick={() => marcarComoLeida(notif.id)}
                  title="Marcar como leída"
                >
                  ✓
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-notificaciones">No tienes notificaciones</p>
      )}
    </div>
  );
}

export default Notificaciones; 