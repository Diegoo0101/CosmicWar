import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import PhaserGame from './components/PhaserGame';
import GoogleAuthButton from './components/GoogleAuthButton';
import ComoJugar from './components/ComoJugar';
import Contacto from './components/Contacto';
import Terminos from './components/Terminos';
import Privacidad from './components/Privacidad';
import ClasificacionModal from './components/ClasificacionModal';
import TiendaModal from './components/TiendaModal';
import PersonalizacionModal from './components/PersonalizacionModal';
import { useState } from 'react';
import twitterIcon from '/assets/iconos/twitter-icon.png';
import facebookIcon from '/assets/iconos/facebook-icon.png';
import instagramIcon from '/assets/iconos/instagram-icon.png';


function App() {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        {/*Header de navegación*/}
        <nav className="navbar">
        <Link to="/" className="navbar-title">CosmicWar</Link>
          <ul className="navbar-links">
            <li><a href="/como-jugar" className="link-button">Cómo jugar</a></li>
            <li><button onClick={() => setIsShopOpen(true)} className="link-button">Tienda</button></li>
            <li><button onClick={() => setIsPersonalizationOpen(true)} className="link-button">Personalización</button></li>
            <li><button onClick={() => setIsLeaderboardOpen(true)} className="link-button">Tabla de clasificación</button></li>
            <li><GoogleAuthButton/></li>
          </ul>
        </nav>

        {/*Contenido principal y rutas*/}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PhaserGame />} />
            <Route path="/como-jugar" element={<ComoJugar />} />
            <Route path="/contacto" element={<Contacto/>} />
            <Route path="/terminos" element={<Terminos/>} />
            <Route path="/privacidad" element={<Privacidad/>} />
          </Routes>
        </main>

        {/*Footer de navegación*/}
        <footer className="footer">
          <Link to="/" className="footer-title">CosmicWar</Link>
          <ul className="footer-links">
            <li><a href="/como-jugar" className="link-button">Cómo jugar</a></li>
            <li><button onClick={() => setIsShopOpen(true)} className="link-button">Tienda</button></li>
            <li><button onClick={() => setIsPersonalizationOpen(true)} className="link-button">Personalización</button></li>
            <li><button onClick={() => setIsLeaderboardOpen(true)} className="link-button">Tabla de clasificación</button></li>
          </ul>

          <div className="footer-social">
            <h3 className="social-title">Síguenos</h3>
            <div className="social-icons">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <img src={twitterIcon} alt="Twitter" className="social-icon" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <img src={facebookIcon} alt="Facebook" className="social-icon" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <img src={instagramIcon} alt="Instagram" className="social-icon" />
              </a>
            </div>
            <h3 className="social-title">Contáctanos</h3>
            <a href="/contacto" className="link-button">Contacto</a>
          </div>

          <div className="footer-legal">
            <h3 className="legal-title">Legal</h3>
            <a href="/terminos" className="link-button">Términos y Condiciones</a>
            <a href="/privacidad" className="link-button">Política de Privacidad</a>
          </div>

          <p className="copyright-notice">
            © 2025 CosmicWar. Todos los derechos reservados.
          </p>
        </footer>

        {/*Modales*/}
        <TiendaModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        <PersonalizacionModal isOpen={isPersonalizationOpen} onClose={() => setIsPersonalizationOpen(false)} />
        <ClasificacionModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      </div>
    </Router>
  );
}

export default App;