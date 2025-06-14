import Phaser from 'phaser';
import WebFont from 'webfontloader';

export default class TitlePreloadScene extends Phaser.Scene {
  constructor() {
    super('TitlePreloadScene');
  }

  async preload() {
    // Cargar imagen de fondo
    this.load.image('titlebackground', '/assets/Fondo/titlescreen_background.png');
    // Cargar fuente de texto
    WebFont.load({
      google: {
        families: ['Press Start 2P']
      }
    });
  
    // Espera a que todos los recursos se carguen antes de iniciar la siguiente escena
    this.load.on('complete', () => {
      this.scene.start('TitleScene');
    });

        
    // Inicia la carga de recursos
    this.load.start();
  }
}