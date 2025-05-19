// frontend/src/pages/UserHomePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserHomePage.css'; // Importa el archivo CSS

function UserHomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // AuthContext ya redirige a /login
  };

  if (!user) {
    // Considera un componente de carga más elaborado o una redirección si es necesario
    // Esto también podría manejarse con el ProtectedRoute más efectivamente
    return <p>Cargando datos del usuario o no estás autenticado...</p>;
  }

  return (
    <div className="user-homepage-container">
      <header className="user-homepage-header">
        <h1>¡Bienvenido/a, {user.email || user.rut}!</h1>
      </header>
      
      <section className="user-homepage-content">
        <p>Esta es tu página principal después de iniciar sesión.</p>
        <p>Aquí podrás ver tus reservas, perfil, y más funcionalidades que se añadan.</p>
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