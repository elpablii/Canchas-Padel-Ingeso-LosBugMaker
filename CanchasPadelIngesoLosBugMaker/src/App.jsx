import './App.css';


function App() {
 
  return (
    <>
      <h1>Canchas Pádel Ucenin</h1>

      {/* Este div puede ser el contenedor principal para el contenido de la página de inicio */}
      <div className="main-content">
        <h2>Bienvenido/a</h2>
        <p>Gestiona tus reservas de pádel de forma fácil y rápida.</p>

        {/* Contenedor para los botones de autenticación */}
        <div className="auth-buttons">
          {/* Botón para iniciar sesión */}
          <button onClick={() => console.log('Clic en Iniciar Sesión')}>
            Iniciar Sesión
          </button>

          {/* Botón para registrarse */}
          <button onClick={() => console.log('Clic en Registrarse')}>
            Registrarse
          </button>
        </div>

        {/* Mensaje de estado o pie de página */}
        <p className="status-message">
          FrontEnd en construcción. ¡Se agregarán más funciones pronto!
        </p>
      </div>

    </>
  );
}

export default App;