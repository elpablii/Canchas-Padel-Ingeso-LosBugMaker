// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegistrationPage from './pages/RegistrationPage';
import ReservationPage from './pages/ReservationPage';
import LoginPage from './pages/LoginPage';
import UserHomePage from './pages/UserHomePage';
import AvailabilityPage from './pages/AvailabilityPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ReservationHistory from './components/ReservationHistory';
import { useAuth } from './context/AuthContext';
import ReportePagosPage from './pages/ReportePagosPage';

import BilleteraPage from './pages/BilleteraPage'; 
import UserProfilePage from './pages/UserProfilePage';

import './App.css';

// --- Componente ProtectedRoute (sin cambios) ---
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// --- Componente AdminProtectedRoute (sin cambios) ---
function AdminProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user && user.rol !== 'admin') {
    return <Navigate to="/user-home" replace />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// --- Navbar ---
function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const userGreeting = user ? (user.nombre || user.email || user.rut) : '';
  
  // Formateador para el saldo, para que se vea como $15.000
  const formatCurrency = (value) => {
      if (typeof value !== 'number') return '$...';
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  }

  return (
    <nav className="app-navbar">
      <RouterLink to="/" className="navbar-brand">Pádel Ucenin</RouterLink>
      <div className="navbar-links">
        <RouterLink to="/">Inicio</RouterLink>
        {!isAuthenticated && <RouterLink to="/register">Registrarse</RouterLink>}
        {!isAuthenticated && <RouterLink to="/login">Iniciar Sesión</RouterLink>}
        
        {isAuthenticated && user && (
          <>
            <div className="navbar-user-info">
                <span>Hola, {userGreeting} {user.rol === 'admin' && '(Admin)'}</span>
                
                {/* --- Mostramos el saldo --- */}
                {/* Lo hacemos un enlace a la página de la billetera */}
                <RouterLink to="/billetera" className="navbar-saldo">
                    Saldo
                </RouterLink>
            </div>

            <RouterLink to="/perfil">Mi Perfil</RouterLink>

            {user.rol === 'admin' ? (
              <RouterLink to="/admin/dashboard">Panel Admin</RouterLink>
              
            ) : (
              <RouterLink to="/user-home">Mi Página</RouterLink>
            )}
            
            <button onClick={logout} className="navbar-logout-btn">
              Cerrar Sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

// --- Componente App (CON LA NUEVA RUTA) ---
function App() {
  return (
    <>
      <Navbar />
      <div className="app-container">
        <Routes>
          {/* --- Rutas Públicas --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* --- Rutas Protegidas para Socios --- */}
          <Route path="/user-home" element={<ProtectedRoute><UserHomePage /></ProtectedRoute>} />
          <Route path="/historial-reservas" element={<ProtectedRoute><ReservationHistory /></ProtectedRoute>} />
          <Route path="/reservar-cancha" element={<ProtectedRoute><ReservationPage /></ProtectedRoute>} />
          <Route path="/disponibilidad-canchas" element={<ProtectedRoute><AvailabilityPage /></ProtectedRoute>} />
          
          {/* --- RUTA PROTEGIDA --- */}
          <Route path="/billetera" element={<ProtectedRoute><BilleteraPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          
          {/* --- Ruta Protegida para Admin --- */}
          <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
          
          {/* --- Ruta Reporte de Pagos --- */}
          <Route path="/admin/reporte-pagos" element={<AdminProtectedRoute><ReportePagosPage /></AdminProtectedRoute>} />
          

          {/* --- Ruta para Página no encontrada --- */}
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