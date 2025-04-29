import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    // Carga cualquier recurso necesario para la pantalla de título
    this.load.image('background', '/assets/background.png'); // Fondo opcional
    this.load.image('playButton', '/assets/play_button.png'); // Botón de jugar
  }

  create() {
    // Agregar fondo (opcional)
    this.add.image(300, 350, 'background').setScale(1);

    // Agregar botón de jugar
    const playButton = this.add.image(300, 500, 'playButton').setInteractive();
    playButton;

    // Evento al hacer clic en el botón
    playButton.on('pointerdown', () => {
      this.scene.start('GameScene'); // Inicia la escena del juego
    });
  }
}