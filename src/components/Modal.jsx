import React from 'react';

const Modal = ({ isOpen, onClose, children, type }) => {
  if (!isOpen) return null;

  // Modal personalizado
  // Type determina el estilo que tendrá (rojo si es error, verde si es ok)
  // children es el contenido del modal
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${type}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;