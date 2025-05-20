// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegistrationPage from './pages/RegistrationPage';
import ReservationPage from './pages/ReservationPage';
import LoginPage from './pages/LoginPage';
import UserHomePage from './pages/UserHomePage'; // Importa la nueva página
import { useAuth } from './context/AuthContext'; // Importa useAuth
import AvailabilityPage from './pages/AvailabilityPage';


import './App.css'; // Tus estilos globales de App

// Componente para Rutas Protegidas
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // Si no está autenticado, redirige a la página de login
    return <Navigate to="/login" replace />;
  }
  return children; // Si está autenticado, renderiza el componente hijo
}

// Un componente simple para una Navbar básica si la necesitas
function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="app-navbar">
      <RouterLink to="/" className="navbar-brand">Pádel Ucenin</RouterLink>
      <div className="navbar-links">
        <RouterLink to="/">Inicio</RouterLink>
        {!isAuthenticated && <RouterLink to="/register">Registrarse</RouterLink>}
        {!isAuthenticated && <RouterLink to="/login">Iniciar Sesión</RouterLink>}
        {isAuthenticated && user && <span style={{ color: 'white', marginRight: '15px' }}>Hola, {user.email || user.rut}</span>}
        {isAuthenticated && <button onClick={logout} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px 15px' }}>Cerrar Sesión</button>}
      </div>
    </nav>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Ruta para la página principal del usuario (protegida) */}
          <Route 
            path="/user-home" 
            element={
              <ProtectedRoute>
                <UserHomePage />
              </ProtectedRoute>
            } 
          />
          {/* Página de reservas (protegida) */}
          <Route
            path="/reservar-cancha"
            element={
              <ProtectedRoute>
                <ReservationPage />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/disponibilidad-canchas" 
            element={
              <ProtectedRoute>
                <AvailabilityPage />
              </ProtectedRoute>
            }
          />
          
          {/* Ruta para manejar páginas no encontradas */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h1>404 - Página No Encontrada</h1>
              <p>Lo sentimos, la página que buscas no existe.</p>
              <RouterLink to="/">Volver al Inicio</RouterLink>
            </div>
          } />
        </Routes>
      </div>
    </>
  );
}

export default App;
