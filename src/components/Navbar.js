import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  // Lógica para mostrar diferentes enlaces si el usuario está logueado o es admin
  const isLoggedIn = false; // Ejemplo
  const isAdmin = false; // Ejemplo

  return (
    <nav>
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/disponibilidad">Ver Disponibilidad</Link></li>
        {isLoggedIn ? (
          <li><Link to="/mis-reservas">Mis Reservas</Link></li>
        ) : (
          <li><Link to="/login">Login</Link></li>
        )}
        {isAdmin && (
          <li><Link to="/admin">Dashboard Admin</Link></li>
        )}
      </ul>
      <hr /> {/* Separador visual */}
    </nav>
  );
}

export default Navbar;