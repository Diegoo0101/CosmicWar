import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import TitleScene from './scenes/TitleScene';

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 700,
  backgroundColor: '#666',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [TitleScene, GameScene], // Agrega TitleScene como la primera escena
  parent: 'phaser-container',
};

export default config;
