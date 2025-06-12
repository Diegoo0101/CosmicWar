import Phaser from 'phaser';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase/config';
import GrayscalePipeline from '../GrayscalePipeline';

const db = getFirestore();

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    // Vida del jugador
    this.playerHealth = 100;
    // Vida máxima del jugador
    this.maxHealth = 100;
    // Puntuación
    this.puntuacion = 0;
    // Objetos de multidisparo
    this.powerUps = null;
    // Determina si el jugador puede hacer multidisparo
    this.hasMultiShot = false;
    // Objetos curativos
    this.hearts = null
    // Objetos para llenar la barra de poder especial
    this.fires = null;
    // Cuenta cuanto poder especial tiene el jugador. Si tiene 3, puede hacer el disparo especial
    this.contFires = 0;
    // Se está disparando el disparo especial;
    this.activeSpecialBullet = null;
    // Objetos de relojes
    this.clocks = null;
    // Determina si el tiempo se ralentiza por efecto de haber recolectado un reloj
    this.slowTime = false;
    // Objetos de monedas
    this.coins = null;
    // Cuenta cuantas monedas ha recolectado el jugador
    this.contCoins = 0;
    // Balas enemigas
    this.enemyBullets = null;
    // Jefe
    this.boss = null;
    // Determina si el jefe puede aparecer (solo lo hace al eliminar a todos los enemigos)
    this.bossActive = false;
    // Determina si el jugador está muerto
    this.isPlayerDead = false;
    // Cuenta la oleada actual
    this.currentWave = 0;
    // Texto que muestra al usuario en qué oleada está
    this.waveText = null;
    // Determina si se aplica un filtro de blanco y negro
    this.grayscaleApplied = false;
    // Música que suena actualmente
    this.currentMusic = null;
    //Botón de mutear
    this.muteButton = null;
    // Determina si el sonido está muteado
    this.isMuted = false;
    // Determina el ángulo de rotación del patrón circular de disparo del jefe, para hacer más dificil esquivarlo
    this.bossAngleOffset = 0;
  }

  create() {
    // Pipeline con filtro blanco y negro
    this.renderer.pipelines.addPostPipeline('GrayscalePipeline', GrayscalePipeline);
    // Fondo del juego
    this.add.image(300, 325, 'background').setOrigin(0.5);
    // Sprite del jugador
    this.player = this.physics.add.sprite(300, 550, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.7);
    this.player.setDepth(10);

    // Teclas de movimiento
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.shift = this.input.keyboard.addKey("SHIFT");

    // Evita que la página haga scroll al pulsar espacio
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
      }
    });
    // Tecla de disparo
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // Cooldown de disparo del jugador
    this.shootCooldown = 0;
    // Tecla de disparo especial
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Balas
    this.bullets = this.physics.add.group();
    // Bala especial
    this.specialBullets = this.physics.add.group();
    // Enemigos
    this.enemies = this.physics.add.group();
    //Colisiona bala con enemigo
    this.physics.add.overlap(this.enemies, this.bullets, this.handleBulletEnemyCollision, null, this);
    //Colisiona el personaje con enemigo
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // Crear barra de vida
    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(999);
    this.updateHealthBar();
    // Crear barra de poder especial
    this.specialBar = this.add.graphics();
    this.updateSpecialBar();
    this.specialBar.setDepth(999);

    // Crear items de multidisparo
    this.powerUps = this.physics.add.group();
    // Crear items curativos
    this.hearts = this.physics.add.group();
    // Crear items de poder especial
    this.fires = this.physics.add.group();
    // Crear relojes ralentizadores
    this.clocks = this.physics.add.group();
    // Crear monedas
    this.coins = this.physics.add.group();

    // Tratar colisión entre nave e items
    this.physics.add.overlap(this.player, this.hearts, this.collectHeart, null, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
    this.physics.add.overlap(this.player, this.fires, this.collectFire, null, this);
    this.physics.add.overlap(this.player, this.clocks, this.collectClock, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    // Balas enemigas
    this.enemyBullets = this.physics.add.group();
    // Colisión entre balas enemigas y el jugador
    this.physics.add.overlap(this.player, this.enemyBullets, this.handleEnemyBulletHit, null, this);

    // Crea la animación de la explosión
    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 9 }),
      frameRate: 20,
      hideOnComplete: true
    });

    // Audio
    this.jefeSFX = this.sound.add('jefe_aparece');
    this.disparoSFX = this.sound.add('disparo');
    this.disparo_jugadorSFX = this.sound.add('disparo_jugador');
    this.impactoSFX = this.sound.add('impacto');
    this.impacto_jugadorSFX = this.sound.add('impacto_jugador');
    this.explosionSFX = this.sound.add('explosion');
    this.explosion_jugadorSFX = this.sound.add('explosion_jugador');
    this.explosion_jefeSFX = this.sound.add('explosion_jefe');
    this.powerupSFX = this.sound.add('powerup');
    this.monedaSFX = this.sound.add('moneda');
    this.especialSFX = this.sound.add('especial');
    this.oleada1_1 = this.sound.add('oleada1-1');
    this.oleada1_2 = this.sound.add('oleada1-2');
    this.oleada10 = this.sound.add('oleada10');
    this.oleada20 = this.sound.add('oleada20');

    // Cooldown de disparos del jefe
    this.bossShootCooldown = 0;

    //Botón de mute de música
    this.muteButton = this.add.image(this.scale.width - 40, 40, 'unmute')
      .setInteractive()
      .setScrollFactor(0)
      .setScale(3)
      .setDepth(999)
      .setOrigin(0.5)
      .on('pointerdown', this.toggleMute, this);

    // Iniciar la primera oleada
    this.startWave();
  }

  update(time) {
    // Controles de movimiento
    // Izquierda y derecha
    if (this.cursors.left.isDown || this.wasd.left.isDown){
      this.player.setVelocityX(-200);
      if(this.shift.isDown) {
        this.player.setVelocityX(-350);
      }
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.setVelocityX(200);
      if(this.shift.isDown) {
        this.player.setVelocityX(350);
      }
    } else {
      this.player.setVelocityX(0);
    }
    // Arriba y abajo
    if (this.cursors.up.isDown || this.wasd.up.isDown){
      this.player.setVelocityY(-200);
      if(this.shift.isDown) {
        this.player.setVelocityY(-350);
      }
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.player.setVelocityY(200);
      if(this.shift.isDown) {
        this.player.setVelocityY(350);
      }
    } else {
      this.player.setVelocityY(0);
    }

    // Disparo normal (pulsar espacio)
    if (this.spaceKey.isDown || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (time > this.shootCooldown) {
        this.shootBullet();
        this.shootCooldown = time + 200;
      }
    }
    
    // Disparo especial (pulsar Z)
    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.specialShot();
    }

    // Balas del jugador en pantalla
    this.bullets.getChildren().forEach(bullet => {
      // Elimina las que se salen del mapa
      if (bullet.y < 0) {
        bullet.setActive(false).setVisible(false);
        bullet.body.stop();
        bullet.destroy();
        return;
      }
    })

    // Todos los enemigos en pantalla
    this.enemies.getChildren().forEach(enemy => {
      // Refresca la velocidad según si el tiempo está ralentizado o no y según la oleada actual
      const targetSpeed = this.slowTime ? 30 : 50 + this.currentWave * 10;
      if (enemy.body.velocity.y !== targetSpeed) {
        enemy.setVelocityY(targetSpeed);
      }

      // Verifica si se ha salido de la pantalla
      if (enemy.y > this.game.config.height) {
        // Jugador pierde 3 de vida
        this.playerHealth -= 3;
        this.updateHealthBar();
        // Si el jugador muere debido a un enemigo que se sale de la pantalla
        if (this.playerHealth === 0 && !this.isPlayerDead) {
          this.isPlayerDead = true;
          this.player.visible = false;
          const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
          explosion.setScale(0.7);
          explosion.play('explode');
          this.explosion_jugadorSFX.play();
          explosion.on('animationcomplete', () => {
            this.gameOver();
          });
        }
        // Enemigo vuelve a spawnear en la parte superior
        enemy.setPosition(Phaser.Math.Between(50, 550), 0);
      }

      // Refresca el cooldown de disparos enemigos según si el tiempo está ralentizado o no
      // Cada 800ms
      const shootDelay = this.slowTime ? 1500 : 800;
      if (time > enemy.shootCooldown) {
        this.enemyShoot(enemy);
        // Se añaden pequeñas variaciones al cooldown de disparo enemigo para que sea aleatorio
        enemy.shootCooldown = time + shootDelay + Phaser.Math.Between(-200, 200);
      }
    });

    // Todas las balas enemigas en pantalla
    this.enemyBullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
    
      // Elimina las que se salen de la pantalla
      if (bullet.y > this.game.config.height || bullet.y < 0 || bullet.x > this.game.config.width || bullet.x < 0) {
        bullet.setActive(false).setVisible(false);
        bullet.body.stop();
        bullet.destroy();
        return;
      }
          
      // Refresca la velocidad de las balas enemigassegún si el tiempo está ralentizado o no y según la oleada actual
      const newSpeed = this.slowTime ? 60 : 200 + (this.currentWave * 10);
    
      // Obtener dirección actual normalizada según la velocidad direccional de la bala
      const velocity = bullet.body.velocity;
      const angle = Math.atan2(velocity.y, velocity.x);
    
      // Aplicar la nueva velocidad en la misma dirección
      bullet.setVelocity(
        Math.cos(angle) * newSpeed,
        Math.sin(angle) * newSpeed
      );
    });
    

    // Si el jefe llega hasta la posición stopY se detiene y comienza a moverse lateralmente
    if (this.boss && !this.boss.hasStartedMovingSideways && this.boss.y >= this.boss.stopY) {
      this.boss.setVelocityY(0);
      this.boss.setVelocityX(this.slowTime ? 30 : 50);
      this.boss.hasStartedMovingSideways = true;
    }
    
    // Determina si el jefe tiene que moverse a la izquierda o a la derecha
    if (this.boss && this.boss.hasStartedMovingSideways) {
      const speed = this.slowTime ? 30 : 50;
      if (this.boss.x <= 50 && this.boss.body.velocity.x < 0) {
        // Se mueve a la derecha
        this.boss.setVelocityX(speed);
      } else if (this.boss.x >= this.game.config.width - 50 && this.boss.body.velocity.x > 0) {
        // Se mueve a la izquierda
        this.boss.setVelocityX(-speed);
      }
    }

    // Refresca el cooldown de disparos del jefe si el tiempo está ralentizado o no
    if (this.boss && this.boss.active) {
      // Dispara cada 500ms o 1500ms
      const delay = this.slowTime ? 1500 : 500;
      if (time > this.bossShootCooldown) {
        this.bossShoot(this.boss);
        this.bossShootCooldown = time + delay;
      }
    }

    // Filtro de blanco y negro si se ralentiza el tiempo
    if (this.slowTime && !this.grayscaleApplied) {
      this.cameras.main.setPostPipeline('GrayscalePipeline');
      this.grayscaleApplied = true;
    }
    // Se quita el filtro si ya no se ralentiza el tiempo
    if (!this.slowTime && this.grayscaleApplied && !this.isPlayerDead) {
      this.cameras.main.resetPostPipeline();
      this.grayscaleApplied = false;
    }

    //Mantiene la imagen del disparo especial ligeramentesobre el jugador en todo momento si el disparo especial se está realizando.
    if (this.activeSpecialBullet && this.player) {
      this.activeSpecialBullet.x = this.player.x;
      this.activeSpecialBullet.y = this.player.y - (this.player.displayHeight / 2) - (this.activeSpecialBullet.displayHeight / 2);
    }
  }

  // Se encarga de crear y disparar balas desde la posición del jugador
  shootBullet() {
    if(this.isPlayerDead) return;
    this.disparo_jugadorSFX.play();
    // Si tiene multidisparo
    if (this.hasMultiShot) {
      // Posiciones horizontales de las balas
      const offsets = [-10, -5, 0, 5, 10];
      const speedY = -300;
      // Velocidad horizontal de las balas
      const horizontalSpreadFactor = 10;

      offsets.forEach(offset => {
        // Crea la bala
        const bullet = this.bullets.create(this.player.x + offset, this.player.y - 20, 'bullet');
        const speedX = offset * horizontalSpreadFactor;

        bullet.setVelocity(speedX, speedY);
        bullet.setScale(0.02);
        // Gira la imagen de la bala según su velocidad direccional
        const angle = Math.atan2(speedY, speedX);
        bullet.setAngle(Phaser.Math.RadToDeg(angle) + 90);
      });
    } else {
      // Si no tiene multidisparo, crea una sola bala
      const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
      bullet.setVelocityY(-300);
      bullet.setScale(0.02);
    }
  }

  // Realiza el disparo especial
  specialShot() {
    if(this.isPlayerDead) return;
    // Comprueba que el jugador tenga suficiente poder especial (tres "fuegos")
    if (this.contFires >= 3) {
      // Vacía el poder especial
      this.contFires = 0;
      this.updateSpecialBar();

      // Evita el spam de disparo especial
      if (this.activeSpecialBullet) {
        this.activeSpecialBullet.destroy();
        this.activeSpecialBullet = null;
      }

      // Sprite y efecto de sonido
      this.especialSFX.play();
      const specialBullet = this.add.image(this.player.x, this.player.y, 'specialbullet');
      specialBullet.setDepth(11);
      this.activeSpecialBullet = specialBullet;
      specialBullet.y = this.player.y - (this.player.displayHeight / 2) - (specialBullet.displayHeight / 2);

      // Efecto de flash en toda la pantalla (500ms)
      const { width, height } = this.sys.game.config;
      const flash = this.add.graphics({ fillStyle: { color: 0xffffff, alpha: 1 } });
      flash.fillRect(0, 0, width, height);
      flash.setDepth(999);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        ease: 'Linear',
        duration: 500,
        onComplete: () => {
          flash.destroy();
        }
      });

      // Efecto de pantalla agitada (1000ms)
      this.cameras.main.shake(1000, 0.01);

      // A todos los enemigos en pantalla
      this.enemies.getChildren().slice().forEach(enemy => {
        if (enemy.shootTimer) enemy.shootTimer.remove();
        // Reducción de vida
        enemy.vida -= 19;
        // Suma de puntos
        this.puntuacion += 100;
        this.handleBulletEnemyCollision(enemy, null);
      });

      // Al jefe
      if (this.boss && this.boss.active) {
        this.impactoSFX.play();
        // Reducción de 20 puntos de vida al jefe
        this.boss.vida -= 20;
        this.updateBossHealthBar();
        // Parpadeo de imagen del jefe
        this.tweens.add({
          targets: this.boss,
          alpha: 0,
          ease: 'Linear',
          duration: 10,
          repeat: 2,
          yoyo: true,
          onComplete: () => {
            if (this.boss && this.boss.active) {
              this.boss.alpha = 1;
            }
          }
        });
        // Si el jefe pierde toda la vida con el disparo especial
        if (this.boss.vida <= 0) {
          this.handleBulletBossCollision(this.boss, null);
        }
      }

      // Destruye el sprite del disparo especial después de 1 segundo
      this.time.delayedCall(1000, () => {
        if (this.activeSpecialBullet) {
          this.activeSpecialBullet.destroy();
          this.activeSpecialBullet = null;
        }
      }, [], this);

      // Comprueba si todos los enemigos de la oleada han muerto
      this.checkWaveComplete();
    }
  }

  // Spawnea un enemigo en la pantalla durante una oleada
  spawnEnemy() {
    // Comprueba si ha spawneado todos los enemigos de la oleada
    if (this.currentWaveEnemies >= this.waveEnemyCount) return;

    this.currentWaveEnemies++;

    // Crea al enemigo en una posición horizontal aleatoria
    const x = Phaser.Math.Between(50, 550);
    const enemy = this.enemies.create(x, 0, 'enemy');
    const velocityY = 50 + this.currentWave * 10;
    enemy.setVelocityY(velocityY);
    enemy.shootCooldown = 0;
    enemy.vida = 3;
    enemy.setScale(0.4);
  }

  // Maneja colisión entre bala y enemigo
  handleBulletEnemyCollision(enemy, bullet) {
    // Enemigo pierde vida y se destruye la bala
    enemy.vida -= 1;
    if (bullet) bullet.destroy();
    // Si el enemigo no muere por la bala, parpadea
    if (enemy.vida > 0) {
      this.impactoSFX.play();
      // Animación de parpadeo, indicando que recibe daño
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        ease: 'Linear',
        duration: 10,
        repeat: 2,
        yoyo: true,
        onComplete: () => {
          enemy.alpha = 1;
        }
      });
      // Si el enemigo muere por la bala
    } else {
      this.enemiesDefeated++;
      const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
      explosion.setScale(0.7);
      explosion.play('explode');
      this.explosionSFX.play();
      enemy.destroy();
      // Puntuación y objeto drop
      this.puntuacion += 100;
      this.itemDrop(enemy);
    }
    // Comprueba si han muerto todos los enemigos de la oleada
    this.checkWaveComplete();
  }

  // Decide aleatoriamente si un enemigo suelta un objeto al morir
  itemDrop(enemy) {
    // 10% de probabilidad de soltar objeto de multidisparo
    if (Phaser.Math.FloatBetween(0, 1) < 0.1) {
      const powerUp = this.powerUps.create(Phaser.Math.FloatBetween(enemy.x+15, enemy.x-15), Phaser.Math.FloatBetween(enemy.y+15, enemy.y-15), 'item_multishot').setScale(0.8);
      powerUp.setVelocityY(Phaser.Math.FloatBetween(110, 90));
    }
    // 7% de probabilidad de soltar objeto curativo
    if (Phaser.Math.FloatBetween(0, 1) < 0.07) {
      const health = this.hearts.create(Phaser.Math.FloatBetween(enemy.x+15, enemy.x-15), Phaser.Math.FloatBetween(enemy.y+15, enemy.y-15), 'item_health').setScale(1.3);
      health.setVelocityY(Phaser.Math.FloatBetween(110, 90));
    }
    // 5% de probabilidad de soltar objeto de poder especial
    if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
      const fire = this.fires.create(Phaser.Math.FloatBetween(enemy.x+15, enemy.x-15), Phaser.Math.FloatBetween(enemy.y+15, enemy.y-15), 'item_specialshot').setScale(0.75);
      fire.setVelocityY(Phaser.Math.FloatBetween(110, 90));
    }
    // 5% de probabilidad de soltar objeto de reloj ralentizador
    if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
      const clock = this.clocks.create(Phaser.Math.FloatBetween(enemy.x+15, enemy.x-15), Phaser.Math.FloatBetween(enemy.y+15, enemy.y-15), 'item_stoptime').setScale(0.75);
      clock.setDepth(7);
      clock.setVelocityY(Phaser.Math.FloatBetween(110, 90));
    }
    // 30% de probabilidad de soltar moneda
    if (Phaser.Math.FloatBetween(0, 1) < 0.3) {
      const coin = this.coins.create(Phaser.Math.FloatBetween(enemy.x+15, enemy.x-15), Phaser.Math.FloatBetween(enemy.y+15, enemy.y-15), 'coin').setScale(0.25);
      coin.setDepth(8);
      coin.setVelocityY(Phaser.Math.FloatBetween(110, 90));
    }
  }

  // Maneja la colisión entre el jugador y el enemigo
  handlePlayerEnemyCollision(player, enemy) {
    if (this.isPlayerDead) return;
    // Pierde 0.1 de vida, suma 0.1 más por cada oleada, en un máximo de 0.5
    if(this.currentWave < 5) {
      this.playerHealth -= 0.1 * (1 + this.currentWave);
    } else {
      this.playerHealth -= 0.5;
    }
    this.updateHealthBar();
    // Si el jugador muere por la colisión
    if (this.playerHealth === 0 && !this.isPlayerDead) {
      this.isPlayerDead = true;
      this.player.visible = false;
      const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
      explosion.setScale(0.7);
      explosion.play('explode');
      this.explosion_jugadorSFX.play();
      explosion.on('animationcomplete', () => {
        this.gameOver();
      });
    }    
  }

  // Maneja el fin de la partida
  gameOver() {
    // Detiene el spawneo de enemigos
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }

    // Detiene la música, aplica filtro visual y pausa la física del juego
    this.currentMusic.stop();
    this.cameras.main.setPostPipeline('GrayscalePipeline');
    this.grayscaleApplied = true;
    this.physics.pause();

    // Tras 100ms, muestra datos finales y mensaje de Game Over
    this.time.delayedCall(100, () => {
      this.add.text(150, 150, `Oleada: ${this.currentWave + 1}`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setDepth(9999);
      this.add.text(150, 200, `Puntuación: ${this.puntuacion}`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setDepth(9999);
      this.add.text(150, 250, `Monedas: ${this.contCoins}`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setDepth(9999);
      this.add.text(150, 350, 'GAME OVER', { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setDepth(9999);;
    });

    const user = auth.currentUser;
    // Si el usuario está autenticado, guarda la puntuación máxima y las monedas en Firestore
    if (user) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      // Leer el documento en referencia al usuario
      getDoc(userDocRef).then((docSnapshot) => {
        let currentPuntuacion = 0;
        let currentMonedas = 0;
        // Obtiene los datos del usuario (puntuación y monedas actuales)
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          currentPuntuacion = data.puntuacion || 0;
          currentMonedas = data.monedas || 0;
        }

        // Actualiza la puntuación si la obtenida es mayor a la anterior
        const newPuntuacion = this.puntuacion > currentPuntuacion ? this.puntuacion : currentPuntuacion;
        // Suma las monedas nuevas con las actuales
        const newMonedas = currentMonedas + this.contCoins;
        // Guardar los valores actualizados en Firestore
        return setDoc(
          userDocRef,
          {
            puntuacion: newPuntuacion,
            monedas: newMonedas,
          },
          { merge: true }
        );
      }).catch((error) => {
        console.error('Error al guardar en Firestore:', error);
      });
    }

    // Habilitar reinicio tras 2000ms
    this.time.delayedCall(2000, () => {
      this.add.text(this.scale.width/2, 460, 'Presiona cualquier tecla', { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(9999);
      this.add.text(this.scale.width/2, 500, 'para volver al título.', { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(9999);

      // Si se pulsa cualquier tecla, reinicia el juego y vuelve a la pantalla de título
      this.input.keyboard.once('keydown', () => {
        this.resetGame();
        this.scene.start('TitleScene');
      });
    });
  }

  // Reinicia todos los valores críticos del juego
  resetGame() {
    this.playerHealth = 100;
    this.isPlayerDead = false;
    this.contFires = 0;
    this.contCoins = 0;
    this.puntuacion = 0;
    this.currentWave = 0;
    this.bossActive = false;
    this.grayscaleApplied = false;
    this.bossAngleOffset = 0;
    this.isMuted = false;
    this.currentMusic = null;

    // Limpia grupos de enemigos, balas, etc.
    this.enemies.clear(true, true);
    this.bullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.powerUps.clear(true, true);
    this.hearts.clear(true, true);
    this.fires.clear(true, true);
    this.clocks.clear(true, true);
    this.coins.clear(true, true);

    // Reinicia las barras de vida y poder especial
    this.updateHealthBar();
    this.updateSpecialBar();

    // Elimina el jefe si está activo
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
  }

  // Actualiza gráfico de la barra de vida
  updateHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;
    // Asegura que la vida no exceda los límites
    if(this.playerHealth > 100) {
      this.playerHealth = 100;
    }
    if(this.playerHealth < 0) {
      this.playerHealth = 0;
    }

    // Calcula el porcentaje de la vida del jugador
    const percent = this.playerHealth / this.maxHealth;
    // Limpia la barra de vida para después dibujarla de nuevo
    this.healthBar.clear();

    // Dibujo de la barra de vida
    if(percent > 0.5) {
      this.healthBar.fillStyle(0x008000); // Verde
    } else if(percent > 0.25) {
      this.healthBar.fillStyle(0xffa500); // Naranja
    } else {
      this.healthBar.fillStyle(0xff0000); // Rojo
    }
    this.healthBar.fillRect(x, y, barWidth * percent, barHeight);

    // Borde blanco
    this.healthBar.lineStyle(2, 0xffffff);
    this.healthBar.strokeRect(x, y, barWidth, barHeight);
  }

  // Actualiza gráfico de la barra de poder especial
  updateSpecialBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 45;

    // Porcentaje de poder especial (el máximo es 3)
    const percent = this.contFires / 3;
    
    // Limpia la barra de poder especial para después dibujarla de nuevo
    this.specialBar.clear();
    this.specialBar.fillStyle(0xffff00);
    this.specialBar.fillRect(x, y, barWidth * percent, barHeight);
    // Borde blanco
    this.specialBar.lineStyle(2, 0xffffff);
    this.specialBar.strokeRect(x, y, barWidth, barHeight);
  }

  // Jugador recolecta item de multidisparo
  collectPowerUp(player, powerUp) {
    powerUp.destroy();
    this.powerupSFX.play();
    this.puntuacion += 10;
    // Tiene multidisparo activo durante 10 segundos
    this.hasMultiShot = true;
    this.time.delayedCall(10000, () => {
       this.hasMultiShot = false;
    });
  }

  // Jugador recolecta objeto curativo
  collectHeart(player, heart) {
    heart.destroy();
    this.powerupSFX.play();
    this.puntuacion += 5;
    // Recupera 10 de vida
    this.playerHealth += 10;
    this.updateHealthBar();
  }

  // Jugador recolecta objeto de poder especial
  collectFire(player, fire) {
    fire.destroy();
    this.powerupSFX.play();
    this.puntuacion += 100;
    // Suma un "fuego" al contador de poder especial, hasta un máximo de 3
    this.contFires++;
    if(this.contFires >= 3) {
      this.contFires = 3;
    }
    this.updateSpecialBar();
  }

  // Jugador recolecta objeto de reloj ralentizador
  collectClock(player, clock) {
    clock.destroy();
    this.powerupSFX.play();
    this.puntuacion += 75;
    // Se activa el ralentizador de tiempo durante 10 segundos
    this.slowTime = true;
    this.time.delayedCall(10000, () => {
      this.slowTime = false;
    });
  }

  // Jugador recolecta moneda
  collectCoin(player, coin) {
    coin.destroy();
    this.monedaSFX.play();
    this.puntuacion += 7;
    // Suma monedas al contador de monedas
    if(!this.slowTime) {
      // Suma 1 moneda por cada oleada
      this.contCoins += 1 + this.currentWave;
    } else {
      // Si el tiempo está ralentizado, las monedas valen más
      this.contCoins += 5 + this.currentWave;
    }

  }

  // Bala enemiga impacta con jugador
  handleEnemyBulletHit(player, bullet) {
    bullet.destroy();
    this.impacto_jugadorSFX.play();
    if (this.isPlayerDead) return;

    // Pierde 1 de vida, más 0.05 por cada oleada hasta un máximo de 1.5
    if(this.currentWave < 10) {
      this.playerHealth -= 1 + (0.05 * this.currentWave);
    } else {
      this.playerHealth -= 1.5;
    }
    // El jefe hace 0.5 de daño extra
    if (this.bossActive) {
      this.playerHealth -= 0.5;
    }
    this.updateHealthBar();

    // Si el jugador muere a causa de la bala enemiga
    if (this.playerHealth === 0 && !this.isPlayerDead) {
      this.isPlayerDead = true;
      this.player.visible = false;
      const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
      explosion.play('explode');
      this.explosion_jugadorSFX.play();
      explosion.on('animationcomplete', () => {
        this.gameOver();
      });
    }    
  }
  
  // Hace que los enemigos disparen
  enemyShoot(enemy) {
    if (!enemy.active || this.isPlayerDead) return;
    this.disparoSFX.play();
    // Crea la bala enemiga en la posición del enemigo
    const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, 'enemybullet');
    // Velocidad vertical de bala, dependiendo de si el tiempo está ralentizado y de la oleada actual
    const speedY = this.slowTime ? 60 : 200 + (this.currentWave * 10);
    // Velocidad horizontal de bala, también dependiente y además aleatoria entre -20 y 20 o -50 y 50
    const speedX = Phaser.Math.Between(this.slowTime ? -20 : -50, this.slowTime ? 20 : 50);

    bullet.setVelocityY(speedY);
    bullet.setVelocityX(speedX);
    // Gira la imagen de la bala según su velocidad direccional
    const angle = Math.atan2(speedY, speedX);
    bullet.setAngle(Phaser.Math.RadToDeg(angle) - 90);

    bullet.setScale(0.1);
  }

  // Inicia una nueva oleada
  startWave() {
    // Enemigos spawneados en la oleada
    this.currentWaveEnemies = 0;
    // Enemigos derrotados en la oleada
    this.enemiesDefeated = 0;

    // Cantidad de enemigos por oleada
    // 10 enemigos en un principio
    let baseEnemyCount = 10;
    // A partir de la oleada 3, se añaden 2 enemigos más por oleada
    let extraEnemies = Math.max(0, (this.currentWave - 2) * 2);
    let enemyCount = baseEnemyCount + extraEnemies;
    // Se guarda la cantidad de enemigos en la variable GameScene en vez de en la variable local enemyCount
    this.waveEnemyCount = enemyCount;

    // Determina la velocidad de aparición de los enemigos dependiendo de si el tiempo está ralentizado
    let spawnRate = Math.max(200, this.slowTime ? 2000 : 1000);

    // Crea el texto de oleada fuera de la pantalla a la izquierda y transparente
    if (this.waveText) {
      this.waveText.destroy();
    }
    this.waveText = this.add.text(
      -this.scale.width / 2,
      this.scale.height / 2,
      `Oleada ${this.currentWave + 1}`,
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '58px',
        fill: '#fff',
        stroke: '#000000',
        strokeThickness: 8,
        alpha: 0
      }
    ).setOrigin(0.5)
    this.waveText.setDepth(999);

    // Texto se desliza hasta el centro y se vuelve más opaco
    this.tweens.add({
      targets: this.waveText,
      x: this.scale.width / 2,
      alpha: 0.7,
      duration: 1000,
      ease: 'Cubic.Out',
      yoyo: false,
      hold: 2000,
      repeat: 0,
      // Tras 2 segundos, se desliza hacia la derecha, se vuelve transparente y se destruye
      onComplete: () => {
        this.tweens.add({
          targets: this.waveText,
          x: this.scale.width * 1.5,
          alpha: 0,
          duration: 1000,
          ease: 'Cubic.In',
          onComplete: () => {
            if (this.waveText) {
              this.waveText.destroy();
              this.waveText = null;
            }
          }
        });
      }
    });

    // Iniciar temporizador para generar enemigos, según el spawnRate calculado y se llama a spawnEnemy
    this.spawnTimer = this.time.addEvent({
      delay: spawnRate,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });

    this.setMusic();
  }

  // Controla la música de fondo que se reproduce según la oleada actual y estado de muteo
  setMusic() {
    // Música de oleada 1-4
    if (this.currentWave === 0) {
      // Probabilidad de que se reproduzca una u otra música
      if (Phaser.Math.FloatBetween(0, 1) < 0.5) {
        this.currentMusic = this.oleada1_1;
      } else {
        this.currentMusic = this.oleada1_2;
      }
      this.currentMusic.loop = true;
      this.currentMusic.play();
      this.currentMusic.setMute(this.isMuted);
      // Música de oleada 5-9
    } else if (this.currentWave === 4) {
      this.currentMusic.stop();
      this.currentMusic = this.oleada10;
      this.currentMusic.loop = true;
      this.currentMusic.play();
      this.currentMusic.setMute(this.isMuted);
      // Música de oleada 10+
    } else if (this.currentWave === 9) {
      this.currentMusic.stop();
      this.currentMusic = this.oleada20;
      this.currentMusic.loop = true;
      this.currentMusic.play();
      this.currentMusic.setMute(this.isMuted);
    }
  }

  // Maneja el muteo de la música y cambia el icono del botón
  toggleMute() {
    // Cambia el estado de muteo
    this.isMuted = !this.isMuted;
    if (this.currentMusic) {
      // Mutea o desmutea según el estado
      this.currentMusic.setMute(this.isMuted);
    }
    // Cambia el icono del botón según el estado
    this.muteButton.setTexture(this.isMuted ? 'mute' : 'unmute');
  }

  // Comprueba si se han derrotado a todos los enemigos de la oleada
  checkWaveComplete() {
    // Si la cantidad de enemigos derrotados es igual a la cantidad de enemigos de la oleada y no hay jefe, spawnea al jefe.
    if (this.enemiesDefeated >= this.waveEnemyCount && !this.bossActive) {
      this.spawnBoss();
    }
  }

  // Crea y configura al jefe
  spawnBoss() {
    this.jefeSFX.play();
    this.bossActive = true;
    // Crea el sprite del jefe en la parte superior de la pantalla
    this.boss = this.physics.add.sprite(300, 0, 'boss');
    const bossVelocityY = this.slowTime ? 25 : 50 + (this.currentWave * 5);
    this.boss.setScale(0.6);
    // El jefe tiene 20 de vida más 5 por cada oleada
    this.boss.vida = 20 + (this.currentWave * 5);
    this.boss.maxVida = this.boss.vida;
    this.boss.setVelocityY(bossVelocityY);
    // Posición vertical en la que deja de descender
    this.boss.stopY = 150;

    // Barra de vida del jefe y nombre
    this.jefeText = this.add.text(this.scale.width/2, 585, 'Jefe Alienígena', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      fill: '#fff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.jefeText.setDepth(999);
    this.bossHealthBar = this.add.graphics();
    this.bossHealthBar.setVisible = true;
    this.bossHealthBar.setDepth(999);
    this.updateBossHealthBar();
  
    // Colisión con balas
    this.physics.add.overlap(this.bullets, this.boss, this.handleBulletBossCollision, null, this);
    // Colisión con jugador
    this.physics.add.overlap(this.player, this.boss, this.handlePlayerEnemyCollision, null, this);
  }

  bossShoot(boss) {
    if (!boss.active || this.isPlayerDead) return;

    this.disparoSFX.play();

    // Configura patrón de disparo del jefe
    // Número de balas que se disparan en círculo
    const numBullets = 18;
    // Velocidad de las balas dependiendo de la ralentización del tiempo y la oleada actual
    const speed = this.slowTime ? 60 : 200 + (this.currentWave * 2);
    // Distancia de las balas desde el centro del jefe
    const radius = 24;
    // Ángulo de rotación del círculo, para hacer más díficil esquivar las balas, suma 1 por cada disparo
    this.bossAngleOffset += 1;

    // Crea las balas en un círculo alrededor del jefe, una a una
    for (let i = 0; i < numBullets; i++) {
      // Calcula el ángulo de la bala, dividiendo el círculo en partes iguales para cada bala. This.bossAngleOffset hace que el círculo rote un poco con cada disparo.
      const angle = this.bossAngleOffset + (i / numBullets) * Math.PI * 2;
      // Calcula la posición de la bala en el círculo
      const x = boss.x + radius * Math.cos(angle);
      const y = boss.y + radius * Math.sin(angle);
      // Calcula la velocidad direccional de la bala
      const velocityX = speed * Math.cos(angle);
      const velocityY = speed * Math.sin(angle);
      // Crea la bala del jefe
      const bullet = this.enemyBullets.create(x, y, 'enemybullet');
      bullet.setScale(0.15);
      bullet.setVelocityX(velocityX);
      bullet.setVelocityY(velocityY);
      // Gira la imagen de la bala según su velocidad direccional
      const angleSprite = Math.atan2(velocityY, velocityX);
      bullet.setAngle(Phaser.Math.RadToDeg(angleSprite) - 90);
    }
  }

  // Maneja colisiones de balas con el jefe
  handleBulletBossCollision(boss, bullet) {
    // Jefe pierde un punto de vida
    boss.vida -= 1;
    if (bullet) bullet.destroy();
    this.updateBossHealthBar();

    // Si el jefe no ha muerto por la bala, parpadea
    if (boss.vida > 0) {
      this.impactoSFX.play();
      this.tweens.add({
        targets: boss,
        alpha: 0,
        ease: 'Linear',
        duration: 10,
        repeat: 2,
        yoyo: true,
        onComplete: () => {
          boss.alpha = 1;
        }
      });
    } else {
      // Si el jefe muere por la bala
      this.enemiesDefeated++;
      const explosion = this.add.sprite(boss.x, boss.y, 'explosion');
      explosion.setScale(2);
      this.explosion_jefeSFX.play();
      explosion.play('explode');
      // Jefe destruido, posibilidad de drop de objeto, suma de puntuación y monedas. Cuanto mayor sea la oleada, más monedas dará.
      boss.destroy();
      this.itemDrop(boss);
      this.puntuacion += 1000;
      this.contCoins += 20 + (5 * this.currentWave);
      // Destruye el texto y barra de vida del jefe
      this.jefeText.setVisible = false;
      this.jefeText.destroy();
      this.bossHealthBar.setVisible = false;
      this.bossHealthBar.destroy();

      // Termina la oleada
      this.endWave();
    }
  }

  // Actualiza barra de vida del jefe
  updateBossHealthBar() {
    const barWidth = this.scale.width - 50;
    const barHeight = 10;
    const x = 25;
    const y = 600;
    // Asegura que la vida del jefe no exceda los límites
    if(this.boss.vida > this.boss.maxVida) {
      this.boss.vida = this.boss.maxVida;
    }
    if(this.boss.vida < 0) {
      this.boss.vida = 0;
    }

    const percent = this.boss.vida / this.boss.maxVida;

    // Limpia la barra de vida para dibujarla de nuevo
    this.bossHealthBar.clear();

    // Barra de vida
    this.bossHealthBar.fillStyle(0xff0000);
    this.bossHealthBar.fillRect(x, y, barWidth * percent, barHeight);

    // Borde blanco
    this.bossHealthBar.lineStyle(2, 0xffffff);
    this.bossHealthBar.strokeRect(x, y, barWidth, barHeight);
  }
  
  // Finaliza la oleada actual por la muerte del jefe y prepara la siguiente oleada
  endWave() {
    // Se elimina el temporizador de spawn de enemigos
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
    // Se eliminan todos los enemigos y al jefe
    this.enemies.clear(true, true);
    this.bossActive = false;
    this.boss = null;
    // Suma la oleada completada e inicia la siguiente
    this.currentWave++;
    this.startWave();
  }
}