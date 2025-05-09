import { useEffect } from 'react';
import Phaser from 'phaser';
import config from '../game/config';

function PhaserGame() {
  useEffect(() => {
    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="phaser-container" />;
}

export default PhaserGame;
