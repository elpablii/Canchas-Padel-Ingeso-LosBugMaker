// frontend/src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Crearemos un archivo CSS básico para esta página

function HomePage() {
  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1>Canchas Pádel Ucenin</h1>
      </header>
      <main className="homepage-main">
        <div className="welcome-box">
          <h2>Bienvenido/a</h2>
          <p>¡Las mejores canchas de pádel para usar y jugar!</p>
          <div className="action-buttons">
            {/* Asumimos que tendrás una ruta /login más adelante */}
            <Link to="/login" className="btn btn-primary">
              Iniciar Sesión
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Registrarse
            </Link>
          </div>
          <p className="construction-notice">
            La página está en construcción. ¡Se irán agregando más funciones pronto!
          </p>
        </div>
      </main>
    </div>
  );
}

export default HomePage;