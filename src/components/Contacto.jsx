import React, { useState } from 'react';
import Modal from './Modal'; 

const Contacto = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState(''); 
  // URL para enviar los datos del formulario
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xwpodgly';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Envia los datos del formulario en formato JSON para que sean validados
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      // Si la validación es exitosa
      if (response.ok) {
        setModalMessage('¡Mensaje enviado con éxito!');
        setModalType('success');
        setIsModalOpen(true);
        setFormData({ name: '', email: '', message: '' }); 
      } else {
        // Si hay un error lee el cuerpo de la respuesta para obtener detalles
        const errorData = await response.json();
        let errorMessage = 'Ha ocurrido un error al enviar el mensaje. Por favor, inténtalo de nuevo.'; 

        // Muestra los detalles del error traducidos
        if (errorData.errors && errorData.errors.length > 0) { 
          const translatedErrors = errorData.errors.map(err => { 
            switch (err.field) { 
              case 'email':
                if (err.message === 'should be an email') return 'El correo electrónico no es válido.'; 
                if (err.message === 'must be present') return 'El correo electrónico es obligatorio.'; 
                break;
              case 'name':
                if (err.message === 'must be present') return 'El nombre es obligatorio.'; 
                break;
              case 'message':
                if (err.message === 'must be present') return 'El mensaje es obligatorio.'; 
                break;
              
              default:
                
                if (err.message.includes('The form has expired')) return 'El formulario ha caducado. Por favor, recarga la página.';
                if (err.message.includes('Submission limit exceeded')) return 'Has excedido el límite de envíos. Por favor, inténtalo de nuevo más tarde.';
                return `Error desconocido en el campo ${err.field || ''}: ${err.message}`; 
            }
            return `Error en el campo ${err.field || ''}: ${err.message}`; 
          });
          errorMessage = translatedErrors.join(', '); 
        }
        
        setModalMessage(`${errorMessage}`); 
        setModalType('error'); 
        setIsModalOpen(true); 
      }
    } catch (error) {
      
      setModalMessage('Error de conexión. Por favor, asegúrate de tener conexión a internet y vuelve a intentarlo.');
      setModalType('error');
      setIsModalOpen(true);
      console.error('Error al enviar el formulario:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false); 
  };

  return (
    <div className="contact-page-container">
      <div className="contact-content-wrapper">
        <div className="contact-info-left">
          <h2>Contáctanos</h2>
          <p>¿Tienes dudas? ¿Quieres notificar de algún error? ¿Tienes sugerencias? ¿O simplemente quieres saludar? ¡Te escuchamos! Puedes enviarnos un correo directamente a:</p>
          <a href="mailto: cosmicwar.team@gmail.com" className="contact-email">cosmicwar.team@gmail.com</a>
          <p>O rellena el formulario de contacto a la derecha para enviarnos un mensaje rápido.</p>
        </div>

        <div className="contact-form-right">
          <h2>Envíanos un Mensaje</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nombre:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Mensaje:</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="submit-button">Enviar Mensaje</button>
          </form>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} type={modalType}>
        <h3>{modalType === 'success' ? '¡Mensaje Enviado!' : 'Error'}</h3>
        <p>{modalMessage}</p>
        <button onClick={closeModal} className="close-button">✖</button>
      </Modal>
    </div>
  );
};

export default Contacto;