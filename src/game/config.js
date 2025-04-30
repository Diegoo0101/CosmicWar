import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import TitleScene from './scenes/TitleScene';

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 650,
  backgroundColor: '#666',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [TitleScene, GameScene],
  parent: 'phaser-container',
};

export default config;
