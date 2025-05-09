import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import TitleScene from './scenes/TitleScene';
import LoadingScene from './scenes/LoadingScene';
import TitlePreloadScene from './scenes/TitlePreloadScene';

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 650,
  backgroundColor: 'black',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [TitlePreloadScene, TitleScene, LoadingScene, GameScene],
  parent: 'phaser-container',
};

export default config;
