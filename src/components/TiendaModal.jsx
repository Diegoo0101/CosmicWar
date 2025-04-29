import React from 'react';
import { auth } from '../firebase/config';
import './TiendaModal.css';

const TiendaModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const user = auth.currentUser;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          X
        </button>
        {user ? (
          <p>Bienvenido a la tienda. Aquí puedes comprar cosméticos.</p>
        ) : (
          <p>Debes iniciar sesión para acceder a la tienda.</p>
        )}
      </div>
    </div>
  );
};

export default TiendaModal;