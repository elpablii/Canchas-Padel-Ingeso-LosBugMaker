// frontend/src/pages/UserProfilePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import './userProfilePage.css';

function UserProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="profile-container">
        <h2>Cargando perfil...</h2>
        <p>Por favor, inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Mi Perfil</h1>
          <span className={`role-badge role-${user.rol}`}>{user.rol}</span>
        </div>
        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">Nombre Completo:</span>
            <span className="detail-value">{user.nombre}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">RUT:</span>
            <span className="detail-value">{user.rut}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email}</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;