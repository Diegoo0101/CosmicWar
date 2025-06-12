import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import TitleScene from './scenes/TitleScene';
import LoadingScene from './scenes/LoadingScene';
import TitlePreloadScene from './scenes/TitlePreloadScene';

const config = {
  // Phaser elige el renderizador automáticamente
  type: Phaser.AUTO,
  // Tamaño del juego y color de fondo predeterminado
  width: 600,
  height: 650,
  backgroundColor: 'black',
  // Configuración de motor de físicas
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  // Lista de escenas ordenadas
  scene: [TitlePreloadScene, TitleScene, LoadingScene, GameScene],
  // Elemento HTML donde se montará el juego
  parent: 'phaser-container',
};

export default config;
