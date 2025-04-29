import React from 'react';
import { auth } from '../firebase/config';
import './PersonalizacionModal.css';

const PersonalizacionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const user = auth.currentUser;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          X
        </button>
        {user ? (
          <p>Bienvenido a la personalización. Aquí puedes comprar personalizar las apariencias del juego.</p>
        ) : (
          <p>Debes iniciar sesión para acceder a la personalzación.</p>
        )}
      </div>
    </div>
  );
};

export default PersonalizacionModal;