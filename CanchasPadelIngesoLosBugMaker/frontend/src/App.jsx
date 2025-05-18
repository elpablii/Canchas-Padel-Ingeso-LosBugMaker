// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage'; // Descomenta cuando crees LoginPage

import './App.css'; // Tus estilos globales de App

// Un componente simple para una Navbar básica si la necesitas
function Navbar() {
  return (
    <nav className="app-navbar">
      <RouterLink to="/" className="navbar-brand">Pádel Ucenin</RouterLink>
      <div className="navbar-links">
        <RouterLink to="/">Inicio</RouterLink>
        {/* <RouterLink to="/login">Login</RouterLink> */} {/* Podrías añadirlo si no estás logueado */}
        <RouterLink to="/register">Registrarse</RouterLink>
        {/* Aquí podrías añadir más enlaces o un botón de logout condicionalmente */}
      </div>
    </nav>
  );
}


function App() {
  return (
    <> {/* Fragmento para no añadir un div extra si Navbar es el único elemento "hermano" de Routes */}
      <Navbar /> {/* Navbar opcional */}
      <div className="app-container"> {/* Contenedor principal para el contenido de las páginas */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Crea un componente LoginPage.jsx similar a RegistrationPage.jsx
          que contenga un LoginForm.jsx 
          <Route path="/login" element={<LoginPage />} /> 
          */}
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