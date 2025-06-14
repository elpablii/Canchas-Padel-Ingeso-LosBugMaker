// frontend/src/pages/UserHomePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Importa Link
import Notificaciones from '../components/Notificaciones';
import './UserHomePage.css'; // Importa el archivo CSS

function UserHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  const handleLogout = () => {
    logout();
    // AuthContext ya redirige a /login
  };

  if (!user) {
    // Esto no debería pasar si tienes rutas protegidas, pero es una salvaguarda
    // Opcionalmente, podrías redirigir al login aquí si no hay usuario
    // useEffect(() => {
    //   if (!user) {
    //     navigate('/login');
    //   }
    // }, [user, navigate]);
    return <p>Cargando datos del usuario o no estás autenticado...</p>;
  }

  return (
    <div className="user-homepage-container">
      <header className="user-homepage-header">
        <h1>¡Bienvenido/a, {user.nombre}!</h1>
      </header>
      
      <section className="user-homepage-content">
        <p>Desde aquí puedes gestionar tus actividades en el club.</p>
      </section>

      {/* Sección de Acciones Principales */}
      <section className="user-actions-section">
        <h2>¿Qué te gustaría hacer?</h2>
        <div className="action-buttons-container">
          <Link to="/reservar-cancha" className="action-button primary-action">
            Reservar Cancha
          </Link>
          <Link to="/disponibilidad-canchas" className="action-button secondary-action">
            Ver Disponibilidad de Canchas
          </Link>
          <Link to="/historial-reservas" className="action-button historial-action">
            Ver Historial de Reservas
          </Link>
          <button 
            className="action-button notificaciones-action"
            onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
          >
            {mostrarNotificaciones ? 'Ocultar Notificaciones' : 'Ver Notificaciones'}
          </button>
        </div>
      </section>
      
      {mostrarNotificaciones && (
        <div className="notificaciones-section">
          <Notificaciones />
        </div>
      )}
      
      <section className="user-data-section">
        <h3>Tus Datos Registrados:</h3>
        <pre className="user-data-json">
          {JSON.stringify(user, null, 2)}
        </pre>
      </section>
      
      <button onClick={handleLogout} className="logout-button">
        Cerrar Sesión
      </button>
    </div>
  );
}

export default UserHomePage;
