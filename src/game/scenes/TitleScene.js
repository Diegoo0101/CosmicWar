import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.image('titlebackground', '/assets/titlescreen_background.png');
    this.load.image('playButton', '/assets/play_button.png');
    this.load.image('title', '/assets/titlescreen_title.png');
  }

  async create() {
    this.add.image(300, 325, 'titlebackground');
    this.add.image(300, 200, 'title');
  
    const playButton = this.add.image(300, 550, 'playButton').setInteractive();
    playButton.setInteractive();
    playButton.on('pointerdown', () => {
      this.scene.start('LoadingScene');
    });
  }
}