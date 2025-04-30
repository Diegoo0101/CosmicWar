import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    // Carga cualquier recurso necesario para la pantalla de título
    this.load.image('titlebackground', '/assets/titlescreen_background.png'); // Fondo opcional
    this.load.image('playButton', '/assets/play_button.png'); // Botón de jugar
    this.load.image('title', '/assets/titlescreen_title.png');
  }

  create() {
    // Agregar fondo (opcional)
    this.add.image(300, 325, 'titlebackground');

    this.add.image(300, 200, 'title')

    // Agregar botón de jugar
    const playButton = this.add.image(300, 550, 'playButton').setInteractive();
    playButton;

    // Evento al hacer clic en el botón
    playButton.on('pointerdown', () => {
      this.scene.start('GameScene'); // Inicia la escena del juego
    });
  }
}