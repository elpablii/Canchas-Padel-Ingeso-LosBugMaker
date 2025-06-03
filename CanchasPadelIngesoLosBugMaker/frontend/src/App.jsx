// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegistrationPage from './pages/RegistrationPage';
import ReservationPage from './pages/ReservationPage';
import LoginPage from './pages/LoginPage';
import UserHomePage from './pages/UserHomePage';
import AvailabilityPage from './pages/AvailabilityPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // Importar página de admin
import { useAuth } from './context/AuthContext';

import './App.css';

// Componente para Rutas Protegidas (usuarios logueados en general)
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// NUEVO: Componente para Rutas Protegidas de Administrador
function AdminProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    // Primero, debe estar logueado
    return <Navigate to="/login" replace />;
  }
  if (user && user.rol !== 'admin') {
    // Si está logueado pero NO es admin, redirige a la página de usuario normal
    return <Navigate to="/user-home" replace />;
  }
  if (!user) { 
    // Caso improbable si isAuthenticated es true, pero por seguridad
    return <Navigate to="/login" replace />;
  }
  // Si está logueado y es admin, permite el acceso
  return children; 
}

// Navbar actualizada para reflejar el rol
function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  // Saludo personalizado
  const userGreeting = user ? (user.nombre || user.email || user.rut) : '';

  return (
    <nav className="app-navbar">
      <RouterLink to="/" className="navbar-brand">Pádel Ucenin</RouterLink>
      <div className="navbar-links">
        <RouterLink to="/">Inicio</RouterLink>
        {!isAuthenticated && <RouterLink to="/register">Registrarse</RouterLink>}
        {!isAuthenticated && <RouterLink to="/login">Iniciar Sesión</RouterLink>}
        
        {isAuthenticated && user && (
          <>
            <span style={{ color: 'white', marginRight: '10px' }}>
              Hola, {userGreeting} {user.rol === 'admin' && '(Admin)'}
            </span>
            {/* Enlace al dashboard correspondiente */}
            {user.rol === 'admin' ? (
              <RouterLink to="/admin/dashboard" style={{ color: 'yellow', marginRight: '10px' }}>Panel Admin</RouterLink>
            ) : (
              <RouterLink to="/user-home" style={{ color: 'cyan', marginRight: '10px' }}>Mi Página</RouterLink>
            )}
            <button 
              onClick={logout} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer', 
                padding: '8px 15px',
                fontSize: 'inherit' 
              }}
            >
              Cerrar Sesión
            </button>
          </>
        )}
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

          <Route 
            path="/user-home" 
            element={
              <ProtectedRoute>
                <UserHomePage />
              </ProtectedRoute>
            } 
          />
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
          
          {/* NUEVA RUTA PARA EL DASHBOARD DEL ADMINISTRADOR */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute> {/* Usar el nuevo protector de ruta */}
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          
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
