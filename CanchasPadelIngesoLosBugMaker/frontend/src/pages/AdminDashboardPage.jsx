// frontend/src/pages/AdminDashboardPage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Para obtener datos del admin si es necesario
import { Link } from 'react-router-dom';
import './AdminDashboardPage.css'; // Crearemos un CSS básico

function AdminDashboardPage() {
  const { user, logout } = useAuth();

  if (!user) {
    // Esto no debería suceder si la ruta está protegida, pero es una salvaguarda
    return <p>Cargando...</p>;
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido/a, Administrador {user.nombre || user.rut}!</p>
      </header>

      <nav className="admin-dashboard-nav">
        {/* Aquí irán los enlaces a las diferentes secciones de administración */}
        <Link to="/admin/historial-reservas" className="admin-nav-link">Historial de Reservas</Link>
        <Link to="/admin/gestionar-usuarios" className="admin-nav-link">Gestionar Usuarios</Link>
        <Link to="/admin/gestionar-canchas" className="admin-nav-link">Gestionar Canchas</Link>
        {/* Puedes añadir más enlaces según las funcionalidades del admin */}
      </nav>

      <main className="admin-dashboard-main-content">
        <p>Seleccione una opción del menú para comenzar.</p>
        {/* Aquí podrías renderizar componentes hijos basados en la sub-ruta o estado */}
      </main>

      <button onClick={logout} className="admin-logout-button">
        Cerrar Sesión (Admin)
      </button>
    </div>
  );
}

export default AdminDashboardPage;
