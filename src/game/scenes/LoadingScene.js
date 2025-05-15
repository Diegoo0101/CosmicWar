import Phaser from 'phaser';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase/config';

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
    this.load.image('enemy', `/assets/Enemigo/${this.enemySkin}.png`);
    this.load.image('boss', `/assets/Enemigo/${this.enemySkin}_boss.png`);
    this.load.image('bullet', '/assets/sprites/bullet.png');
    this.load.image('enemybullet', '/assets/sprites/enemybullet.png');
    this.load.image('specialbullet', '/assets/sprites/specialbullet.png');
    this.load.image('item_multishot', '/assets/sprites/item_multishot.png');
    this.load.image('item_specialshot', '/assets/sprites/item_specialshot.png');
    this.load.image('item_stoptime', '/assets/sprites/item_stoptime.png');
    this.load.image('item_health', '/assets/sprites/health.png');
    this.load.image('coin', '/assets/sprites/coin.png');
    this.load.image('mute', '/assets/sprites/mute.png');
    this.load.image('unmute', '/assets/sprites/unmute.png');
    
  
    this.load.spritesheet('explosion', '/assets/sprites/explosion.png', {
      frameWidth: 256,
      frameHeight: 256,
    });

    this.load.audio('jefe_aparece', '/assets/audio/jefe.mp3');
    this.load.audio('disparo_jugador', '/assets/audio/disparo.mp3');
    this.load.audio('disparo', '/assets/audio/disparo2.mp3');
    this.load.audio('impacto', '/assets/audio/impacto.mp3');
    this.load.audio('impacto_jugador', '/assets/audio/impacto_jugador.mp3');
    this.load.audio('powerup', '/assets/audio/powerup.mp3');
    this.load.audio('moneda', '/assets/audio/moneda.mp3');
    this.load.audio('explosion', '/assets/audio/explosion.mp3');
    this.load.audio('explosion_jugador', '/assets/audio/explosion_jugador.mp3');
    this.load.audio('especial', '/assets/audio/especial.mp3');
    this.load.audio('explosion_jefe', 'assets/audio/explosion_jefe.wav');

    this.load.audio('oleada1-1', '/assets/audio/music/neonlight.m4a');
    this.load.audio('oleada1-2', '/assets/audio/music/overhaul.m4a');
    this.load.audio('oleada10', '/assets/audio/music/bluereflection.m4a');
    this.load.audio('oleada20', '/assets/audio/music/finalstrike.m4a');
  
    // Espera a que todos los recursos se carguen antes de iniciar la siguiente escena
    this.load.on('complete', () => {
      this.scene.start('GameScene');
    });

        
    // Inicia la carga de recursos
    this.load.start();
  }
}