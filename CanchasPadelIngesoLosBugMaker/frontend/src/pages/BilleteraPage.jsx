import React from 'react';
import Billetera from '../components/Billetera'; // Importa el componente que ya creamos
import { useAuth } from '../context/AuthContext'; // Importa el contexto para saber quién es el usuario
import './BilleteraPage.css'

function BilleteraPage() {
  // Obtenemos el usuario actual del contexto de autenticación
  const { user } = useAuth();

  // Si por alguna razón no hay un usuario, mostramos un mensaje.
  if (!user) {
    return (
      <div>
        <h2>Error</h2>
        <p>Debes iniciar sesión para ver tu billetera.</p>
      </div>
    );
  }

  return (
    <div>
      {/* El componente Billetera es el que tiene toda la lógica para mostrar el saldo y recargar.
        Simplemente le pasamos el RUT del usuario que está actualmente logueado.
      */}
      <Billetera userRut={user.rut} />
    </div>
  );
}

export default BilleteraPage;