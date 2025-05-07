import Phaser from 'phaser';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase/config';
import WebFont from 'webfontloader';

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super('LoadingScene');
  }

  async preload() {
    this.add.text(this.scale.width/2, 300, 'Cargando...', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);;
  
    try {
      const usuarioCargado = auth.currentUser;
      if (usuarioCargado) {
        const docSnapshot = await getDoc(doc(getFirestore(), 'usuarios', usuarioCargado.uid));
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          this.playerSkin = data.playerSkin_seleccionado;
          this.enemySkin = data.enemySkin_seleccionado;
          this.background = data.background_seleccionado;
        }
      }
  
      // Si no se inicia sesión, los cosméticos son los predeterminados
      this.playerSkin = this.playerSkin || 'default';
      this.enemySkin = this.enemySkin || 'default';
      this.background = this.background || 'default';
    } catch (err) {
      console.error('Error al cargar desde Firestore:', err);
      // Asignar cosméticos predeterminados en caso de error
      this.playerSkin = 'default';
      this.enemySkin = 'default';
      this.background = 'default';
    }
  
    // Cargar recursos necesarios
    this.load.image('background', `/assets/Fondo/${this.background}.png`);
    this.load.image('player', `/assets/Jugador/${this.playerSkin}.png`);
    this.load.image('bullet', '/assets/bullet.png');
    this.load.image('enemy', `/assets/Enemigo/${this.enemySkin}.png`);
    this.load.image('boss', `/assets/Enemigo/${this.enemySkin}_boss.png`);
    this.load.image('item_multishot', '/assets/item_multishot.png');
    this.load.image('item_specialshot', '/assets/item_specialshot.png');
    this.load.image('item_stoptime', '/assets/item_stoptime.png');
    this.load.image('item_health', 'https://labs.phaser.io/assets/sprites/heart.png');
    this.load.image('coin', '/assets/coin.png');
  
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.fontsReady = false;
    WebFont.load({
      google: {
        families: ['Press Start 2P']
      }
    });
  
    // Espera a que todos los recursos se carguen antes de iniciar la siguiente escena
    this.load.on('complete', () => {
      this.scene.start('GameScene');
    });

        
    // Inicia la carga de recursos
    this.load.start();
  }
}