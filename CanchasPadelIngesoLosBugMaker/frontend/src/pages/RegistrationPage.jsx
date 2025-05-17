// frontend/src/pages/RegistrationPage.jsx
import React from 'react';
import RegistrationForm from '../components/RegistrationForm'; // Importa el formulario
import './RegistrationPage.css'; // CSS para la página de registro

function RegistrationPage() {
  return (
    <div className="registration-page-container">
      <header className="registration-page-header">
        {/* Podrías tener un logo o un enlace para volver al inicio aquí */}
        <h1>Crea tu Cuenta en Canchas Pádel Ucenin</h1>
      </header>
      <main>
        <RegistrationForm /> {/* Renderiza el formulario */}
      </main>
    </div>
  );
}

export default RegistrationPage;