import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  async create() {
    this.add.image(300, 325, 'titlebackground');
    this.add.text(this.scale.width/2, 200, 'CosmicWar', {
      fontFamily: '"Press Start 2P"',
      fontSize: '64px',
      fill: '#000000',
      stroke: '#fff',
      strokeThickness: 12,
    }).setOrigin(0.5);
  
    const playButton = this.add.text(this.scale.width / 2, 550, 'Jugar', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      fill: '#fff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive();

    playButton.on('pointerover', () => {
      playButton.setStyle({ fill: '#ff0' });
    });

    playButton.on('pointerout', () => {
      playButton.setStyle({ fill: '#fff' });
    });
  
    playButton.setInteractive();
    playButton.on('pointerdown', () => {
      this.scene.start('LoadingScene');
    });
  }
}