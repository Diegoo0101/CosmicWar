import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import config from '../game/config';

function PhaserGame() {
  const gameContainerRef = useRef(null);

  useEffect(() => {
    let game;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const container = gameContainerRef.current;
      if (container) {
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.height = '650px';
        container.style.backgroundColor = 'black';
        container.innerHTML = '<h1 style="color: white; text-align: center;">Lo siento, el juego no está disponible en este dispositivo.</h1>';
      }
    } else {
      const gameConfig = {
        ...config,
        parent: gameContainerRef.current,
      };
      game = new Phaser.Game(gameConfig);
    }

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, []);

  return <div id="phaser-container" ref={gameContainerRef} />;
}

export default PhaserGame;