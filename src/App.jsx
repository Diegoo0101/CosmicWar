import { useEffect } from 'react';
import Phaser from 'phaser';
import config from './game/config';
import './App.css';

function App() {
  useEffect(() => {
    const game = new Phaser.Game(config);
    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-title">CosmicWar</div>
        <ul className="navbar-links">
          <li><a href="#">Cómo jugar</a></li>
          <li><a href="#">Tienda</a></li>
          <li><a href="#">Personalización</a></li>
          <li><a href="#">Tabla de clasificación</a></li>
        </ul>
      </nav>
      <main className="main-content">
        <div id="phaser-container" />
      </main>
    </div>
  );
}

export default App;
