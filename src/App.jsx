import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PhaserGame from './components/PhaserGame';
import './App.css';
import GoogleAuthButton from './components/GoogleAuthButton';
import ComoJugar from './components/ComoJugar';
import ClasificacionModal from './components/ClasificacionModal';
import TiendaModal from './components/TiendaModal';
import PersonalizacionModal from './components/PersonalizacionModal';
import { useState } from 'react';


function App() {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
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
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PhaserGame />} />
            <Route path="/como-jugar" element={<ComoJugar />} />
          </Routes>
        </main>
        <footer className="footer">
  <Link to="/" className="footer-title">CosmicWar</Link>
  <ul className="footer-links">
    <li><a href="/como-jugar" className="link-button">Cómo jugar</a></li>
    <li><button onClick={() => setIsShopOpen(true)} className="link-button">Tienda</button></li>
    <li><button onClick={() => setIsPersonalizationOpen(true)} className="link-button">Personalización</button></li>
    <li><button onClick={() => setIsLeaderboardOpen(true)} className="link-button">Tabla de clasificación</button></li>
  </ul>
</footer>

        <TiendaModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        <PersonalizacionModal isOpen={isPersonalizationOpen} onClose={() => setIsPersonalizationOpen(false)} />
        <ClasificacionModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      </div>
    </Router>
  );
}

export default App;