// frontend/src/pages/UserHomePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // Importa Link
import './UserHomePage.css'; // Importa el archivo CSS

function UserHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <h1>¡Bienvenido/a, {user.email || user.rut}!</h1>
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
        </div>
      </section>
      
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
