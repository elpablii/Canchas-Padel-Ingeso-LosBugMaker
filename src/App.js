import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AvailabilityPage from './pages/AvailabilityPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import Navbar from './components/Navbar';

function App() {
  // Lógica para determinar si el usuario es admin o socio iría aquí
  const isAdmin = false; // Ejemplo simple, esto sería dinámico

  return (
    <div className="App">
      <Navbar /> {/* Renderiza la barra de navegación */}

      {/* Definición de las rutas */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/disponibilidad" element={<AvailabilityPage />} />
        <Route path="/mis-reservas" element={<UserDashboardPage />} />

        {/* Ruta protegida para el admin */}
        {isAdmin && (
           <Route path="/admin" element={<AdminDashboardPage />} />
        )}

        {/* Puedes añadir una ruta para "No encontrado" */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </div>
  );
}

export default App;