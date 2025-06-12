import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import config from '../game/config';

function PhaserGame() {
  // Referencia al contenedor del juego
  const gameContainerRef = useRef(null);

  useEffect(() => {
    let game;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // Si el navegador está en un dispositivo móvil, no muestra el juego sino un mensaje
    if (isMobile) {
      const container = gameContainerRef.current;
      if (container) {
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.height = '650px';
        container.style.backgroundColor = 'black';
        container.innerHTML = '<h2 style="color: white; text-align: center;">Lo siento, CosmicWar no está disponible en este dispositivo.</h2>';
      }
    } else {
      // Si no está en un móvil, crea el juego utilizando su configuración y lo monta en el contenedor
      const gameConfig = {
        ...config,
        parent: gameContainerRef.current,
      };
      game = new Phaser.Game(gameConfig);
    }

    // Destruye el juego al desmontar el componente
    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, []);

  // Renderiza el contenedor del juego
  return <div id="phaser-container" ref={gameContainerRef} />;
}

export default PhaserGame;