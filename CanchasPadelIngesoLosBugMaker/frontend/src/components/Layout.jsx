import Notificaciones from './Notificaciones';

function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">Canchas de Pádel</Link>
        </div>
        <div className="navbar-menu">
          {user && (
            <>
              <Notificaciones />
              <Link to="/perfil" className="navbar-item">
                Mi Perfil
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="navbar-item">
                  Panel Admin
                </Link>
              )}
              <button onClick={handleLogout} className="navbar-item">
                Cerrar Sesión
              </button>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout; 