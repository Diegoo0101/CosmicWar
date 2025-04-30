import Phaser from 'phaser';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase/config';
import GrayscalePipeline from '../GrayscalePipeline';

const db = getFirestore();

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.playerHealth = 100;
    this.maxHealth = 100;
    this.puntuacion = 0;
    this.powerUps = null;
    this.hasMultiShot = false;
    this.hearts = null
    this.fires = null;
    this.contFires = 0;
    this.clocks = null;
    this.slowTime = false;
    this.coins = null;
    this.contCoins = 0;
    this.enemyBullets = null;
    this.boss = null;
    this.bossActive = false;
    this.isPlayerDead = false;
    this.currentWave = 0;
    this.waveText = null;
    this.grayscaleApplied = false;
    this.background = 'default_background.png';
    this.playerSkin = 'default_player.png';
    this.enemySkin = 'default_enemy.png';
    this.bossSkin = 'default_boss.png';
  }

  preload() {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      getDoc(userDocRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          this.background = data.background_seleccionado || 'default_background.png';
          this.playerSkin = data.playerSkin_seleccionado || 'default_player.png';
          this.enemySkin = data.enemySkin_seleccionado || 'default_enemy.png';
          this.bossSkin = data.bossSkin_seleccionado || 'default_boss.png';
        }
        return setDoc(
          userDocRef,
          {
            background_seleccionado: this.background,
            playerSkin_seleccionado: this.playerSkin,
            enemySkin_seleccionado: this.enemySkin,
            bossSkin_seleccionado: this.bossSkin,
          },
          { merge: true }
        );
      }).then(() => {
        console.log('Datos de personalización obtenidos');
      }).catch((error) => {
        console.error('Error al recoger datos de Firestore:', error);
      });
    }
    this.load.image('background', `/assets/background/${this.background}`);
    this.load.image('player', `/assets/player/${this.playerSkin}`);
    this.load.image('bullet', '/assets/bullet.png');
    this.load.image('enemy', `/assets/enemy/${this.enemySkin}`);
    this.load.image('boss', `/assets/enemy/${this.bossSkin}`);
    this.load.image('item_multishot', '/assets/item_multishot.png');
    this.load.image('item_specialshot', '/assets/item_specialshot.png');
    this.load.image('item_stoptime', '/assets/item_stoptime.png'); 
    this.load.image('item_health', 'https://labs.phaser.io/assets/sprites/heart.png');
    this.load.image('coin', '/assets/coin.png');

    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 64,
      frameHeight: 64
    }); 
  }


  create() {
    // Pipeline blanco y negro
    this.renderer.pipelines.addPostPipeline('GrayscalePipeline', GrayscalePipeline);
    // Background
    this.add.image(300, 325, 'background');
    // Personaje
    this.player = this.physics.add.sprite(300, 550, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.05);

    // Controles
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
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shootCooldown = 0;
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Balas
    this.bullets = this.physics.add.group();
    // Enemigos
    this.enemies = this.physics.add.group();
    //Colisiona bala con enemigo
    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, null, this);
    //Colisiona el personaje con enemigo
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // Crear barra de vida
    this.healthBar = this.add.graphics();
    this.updateHealthBar();
    // Crear barra de poder especial
    this.specialBar = this.add.graphics();
    this.updateSpecialBar();

    // Crear items de multidisparo
    this.powerUps = this.physics.add.group();
    // Crear corazones curativos
    this.hearts = this.physics.add.group();
    // Crear items de poder especial
    this.fires = this.physics.add.group();
    // Crear relojes ralentizadores
    this.clocks = this.physics.add.group();
    // Crear monedas
    this.coins = this.physics.add.group();

    // Tratar colisión entre personaje e items
    this.physics.add.overlap(this.player, this.hearts, this.collectHeart, null, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
    this.physics.add.overlap(this.player, this.fires, this.collectFire, null, this);
    this.physics.add.overlap(this.player, this.clocks, this.collectClock, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    // Crear balas enemigas
    this.enemyBullets = this.physics.add.group();
    // Colisión entre balas enemigas y el jugador
    this.physics.add.overlap(this.player, this.enemyBullets, this.handleEnemyBulletHit, null, this);

    // Crea la animación de la explosión
    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }), // ajusta los frames
      frameRate: 20,
      hideOnComplete: true // oculta el sprite al terminar
    });

    // Cooldown de disparos del jefe (Se actualiza según el delay)
    this.bossShootCooldown = 0;

    // Iniciar la primera oleada
    this.startWave();
  }

  update(time) {
    // Controles de movimiento
    // Izquierda y derecha
    if (this.cursors.left.isDown || this.wasd.left.isDown){
      this.player.setVelocityX(-200);
      if(this.shift.isDown) {
        this.player.setVelocityX(-400);
      }
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.setVelocityX(200);
      if(this.shift.isDown) {
        this.player.setVelocityX(400);
      }
    } else {
      this.player.setVelocityX(0);
    }
    // Arriba y abajo
    if (this.cursors.up.isDown || this.wasd.up.isDown){
      this.player.setVelocityY(-200);
      if(this.shift.isDown) {
        this.player.setVelocityY(-400);
      }
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.player.setVelocityY(200);
      if(this.shift.isDown) {
        this.player.setVelocityY(400);
      }
    } else {
      this.player.setVelocityY(0);
    }

    // Pulsar el espacio
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shootBullet();
      this.shootCooldown = time + 300;
    }

    // Mantener pulsado el espacio
    if (this.spaceKey.isDown) {
      if (time > this.shootCooldown) {
        this.shootBullet();
        this.shootCooldown = time + 300;
      }
    }
    // Disparo especial
    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.specialShot();
    }

    // Elimina las balas del jugador que se salen del mapa
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.y < 0) {
        bullet.setActive(false).setVisible(false);
        bullet.body.stop();
        bullet.destroy();
        return;
      }
    })
    

    this.enemies.getChildren().forEach(enemy => {
      // Refresca la velocidad de los enemigos si el tiempo está ralentizado o no
      const targetSpeed = this.slowTime ? 30 : 50 + this.currentWave * 10;
      if (enemy.body.velocity.y !== targetSpeed) {
        enemy.setVelocityY(targetSpeed);
      }

      // Verificar si el enemigo está fuera de la pantalla
      if (enemy.y > this.game.config.height) {
        this.playerHealth -= 3;
        this.updateHealthBar();
        enemy.setPosition(Phaser.Math.Between(50, 550), 0);
      }

       // Refresca el cooldown de los disparos si el tiempo está ralentizado o no
      const shootDelay = this.slowTime ? 1500 : 800;
      if (time > enemy.shootCooldown) {
        this.enemyShoot(enemy);
        enemy.shootCooldown = time + shootDelay + Phaser.Math.Between(-200, 200);
    }
    });

    this.enemyBullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
    
      // Desactiva si sale de pantalla
      if (bullet.y > this.game.config.height || bullet.y < 0 || bullet.x > this.game.config.width || bullet.x < 0) {
        bullet.setActive(false).setVisible(false);
        bullet.body.stop();
        bullet.destroy();
        return;
      }
    
      // Obtener dirección actual normalizada
      const velocity = bullet.body.velocity;
      const angle = Math.atan2(velocity.y, velocity.x);
    
      // Calcular nueva velocidad según slowTime
      const newSpeed = this.slowTime ? 60 : 200 + (this.currentWave * 10);
    
      // Aplicar la nueva velocidad en la misma dirección
      bullet.setVelocity(
        Math.cos(angle) * newSpeed,
        Math.sin(angle) * newSpeed
      );
    });
    

    // Si el jefe baja lo suficiente se detiene y comienza a moverse lateralmente
    if (this.boss && !this.boss.hasStartedMovingSideways && this.boss.y >= this.boss.stopY) {
      this.boss.setVelocityY(0);
      this.boss.setVelocityX(this.slowTime ? 30 : 50);
      this.boss.hasStartedMovingSideways = true;
    }
    
    // Determina si el jefe tiene que moverse a la izquierda o a la derecha
    if (this.boss && this.boss.hasStartedMovingSideways) {
      const speed = this.slowTime ? 30 : 50;
      if (this.boss.x <= 50 && this.boss.body.velocity.x < 0) {
        this.boss.setVelocityX(speed); // derecha
      } else if (this.boss.x >= this.game.config.width - 50 && this.boss.body.velocity.x > 0) {
        this.boss.setVelocityX(-speed); // izquierda
      }
    }

    // Refresca el cooldown de disparos del jefe si el tiempo está ralentizado o no
    if (this.boss && this.boss.active) {
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
    if (!this.slowTime && this.grayscaleApplied) {
      this.cameras.main.resetPostPipeline();
      this.grayscaleApplied = false;
    }
    // Filtro de blanco y negro si se muere
    if (this.isPlayerDead) {
      this.cameras.main.setPostPipeline('GrayscalePipeline');
      this.grayscaleApplied = true;
    }
    

  }

  // Hace que el jugador dispare
  shootBullet() {
    // Si tiene multidisparo
    if (this.hasMultiShot) {
      const offsets = [-10, -5, 0, 5, 10]; // Posiciones para las balas
      offsets.forEach(offset => {
        const bullet = this.bullets.create(this.player.x + offset, this.player.y - 20, 'bullet');
        bullet.setVelocityY(-300);
        bullet.setVelocityX(offset * 2); // dirección horizontal
      });
    // Si no tiene multidisparo
    } else {
        const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
        bullet.setVelocityY(-300);
    }
  }

  // Hace que el jugador haga el disparo especial
  specialShot() {
    // Comprueba que el jugador tenga suficiente poder especial
    if(this.contFires >= 3) {
      // Vacía el poder especial
      this.contFires = 0;
      this.updateSpecialBar();
  
      // Destruye a todos los enemigos
      this.enemies.getChildren().slice().forEach(enemy => {
        if (enemy.shootTimer) enemy.shootTimer.remove();
        enemy.vida -= 19;
        this.puntuacion += 100;
        this.handleBulletEnemyCollision();
      });
  
      // Quita 20 puntos de vida al jefe
      if (this.boss && this.boss.active) {
        this.boss.vida -= 20;
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

      // Comprueba si todos los enemigos han muerto para spawnear al jefe
      this.checkWaveComplete();
    }
  }

  // Spawnea un enemigo
  spawnEnemy() {
    // Si han spawneado todos los enemigos de la oleada no lo hace
    if (this.currentWaveEnemies >= this.waveEnemyCount) return;
  
    this.currentWaveEnemies++;
  
    const x = Phaser.Math.Between(50, 550);
    const enemy = this.enemies.create(x, 0, 'enemy');
    const velocityY = 50 + this.currentWave * 10;
    enemy.setVelocityY(velocityY);
    enemy.shootCooldown = 0;
    enemy.vida = 3;
    enemy.setScale(2);
  }

  // Maneja colisión entre bala y enemigo
  handleBulletEnemyCollision(bullet, enemy) {
    enemy.vida -= 1;
    if (bullet) bullet.destroy();

    if (enemy.vida > 0) {
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
    } else {
      // Enemigo muere y explota
      this.enemiesDefeated++;
      const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
      explosion.play('explode');
      enemy.destroy();
      this.puntuacion += 100;
      this.itemDrop(enemy);
    }
    // Comprueba si han muerto todos los enemigos de la oleada
    this.checkWaveComplete();
  }

  itemDrop(enemy) {
    // 10% de probabilidad de soltar item de multidisparo
    if (Phaser.Math.FloatBetween(0, 1) < 0.1) {
      const powerUp = this.powerUps.create(enemy.x, enemy.y, 'item_multishot');
      powerUp.setScale(1.2);
      powerUp.setVelocityY(100);
    }
    // 7% de probabilidad de soltar corazón
    if (Phaser.Math.FloatBetween(0, 1) < 0.07) {
      const heart = this.hearts.create(enemy.x, enemy.y, 'item_health').setScale(0.25);
      heart.setVelocityY(100);
    }
    // 5% de probabilidad de soltar item de poder especial
    if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
      const fire = this.fires.create(enemy.x, enemy.y, 'item_specialshot').setScale(0.5);
      fire.setVelocityY(100);
    }
    // 5% de probabilidad de soltar item de reloj ralentizador
    if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
      const clock = this.clocks.create(enemy.x, enemy.y, 'item_stoptime').setScale(0.45);
      clock.setVelocityY(100);
    }
    // 30% de probabilidad de soltar moneda
    if (Phaser.Math.FloatBetween(0, 1) < 0.3) {
      const coin = this.coins.create(enemy.x, enemy.y, 'coin').setScale(0.04);
      coin.setVelocityY(100);
    }
  }

  // Maneja la colisión entre el jugador y el enemigo
  handlePlayerEnemyCollision(player, enemy) {
    if (this.isPlayerDead) return;
    this.playerHealth -= 0.1;
    this.updateHealthBar();

    if (this.playerHealth === 0 && !this.isPlayerDead) {
      // Jugador muere y explota
      this.isPlayerDead = true;
      this.player.visible = false;
      const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
      explosion.play('explode');
      explosion.on('animationcomplete', () => {
        this.gameOver();
      });
    }    
  }

  // Fin de la partida tras muerte del jugador
  gameOver() {
    this.waveText.destroy();
    this.scene.pause();
    this.add.text(150, 150, `Oleada: ${this.currentWave + 1}`, { fontSize: '32px', fill: '#fff' });
    this.add.text(150, 200, `Puntuación: ${this.puntuacion}`, { fontSize: '32px', fill: '#fff' });
    this.add.text(150, 250, `Monedas: ${this.contCoins}`, { fontSize: '32px', fill: '#fff' });
    this.add.text(150, 350, 'GAME OVER', { fontSize: '32px', fill: '#fff' });

    // Verifica si el usuario ha iniciado sesión
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      // Leer el documento en referencia al usuario
      getDoc(userDocRef).then((docSnapshot) => {
        let currentPuntuacion = 0;
        let currentMonedas = 0;

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          currentPuntuacion = data.puntuacion || 0;
          currentMonedas = data.monedas || 0;
        }

        // Actualizar sólo si la puntuación es mayor
        const newPuntuacion = this.puntuacion > currentPuntuacion ? this.puntuacion : currentPuntuacion;
        // Sumar las monedas actuales con las nuevas
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
      }).then(() => {
        console.log('Puntuación y monedas actualizadas en Firestore');
      }).catch((error) => {
        console.error('Error al guardar en Firestore:', error);
      });
    }
  }

  // Actualiza gráfico de la barra de vida
  updateHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;
    if(this.playerHealth > 100) {
      this.playerHealth = 100;
    }
    if(this.playerHealth < 0) {
      this.playerHealth = 0;
    }

    const percent = this.playerHealth / this.maxHealth;

    this.healthBar.clear();

    // Fondo gris
    this.healthBar.fillStyle(0x555555);
    this.healthBar.fillRect(x, y, barWidth, barHeight);

    // Barra de vida
    if(percent > 0.5) {
      this.healthBar.fillStyle(0x008000);
    } else if(percent > 0.25) {
      this.healthBar.fillStyle(0xffa500);
    } else {
      this.healthBar.fillStyle(0xff0000);
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

    const percent = this.contFires / 3;

    this.specialBar.clear();

    // Fondo gris
    this.specialBar.fillStyle(0x555555);
    this.specialBar.fillRect(x, y, barWidth, barHeight);
    // Barra de poder especial
    this.specialBar.fillStyle(0xffff00);
    this.specialBar.fillRect(x, y, barWidth * percent, barHeight);
    // Borde blanco
    this.specialBar.lineStyle(2, 0xffffff);
    this.specialBar.strokeRect(x, y, barWidth, barHeight);
  }

  // Jugador recolecta item de multidisparo
  collectPowerUp(player, powerUp) {
    powerUp.destroy();
    this.puntuacion += 10;
    this.hasMultiShot = true;
    this.time.delayedCall(10000, () => {
       this.hasMultiShot = false;
    });
  }

  // Jugador recolecta corazón
  collectHeart(player, heart) {
    heart.destroy();
    this.puntuacion += 5;
    this.playerHealth += 10;
    this.updateHealthBar();
  }

  // Jugador recolecta item de poder especial
  collectFire(player, fire) {
    fire.destroy();
    this.puntuacion += 100;
    this.contFires++;
    if(this.contFires >= 3) {
      this.contFires = 3;
    }
    this.updateSpecialBar();
  }

  // Jugador recolecta reloj ralentizador
  collectClock(player, clock) {
    clock.destroy();
    this.puntuacion += 75;
    this.slowTime = true;
    this.time.delayedCall(10000, () => {
      this.slowTime = false;
    });
  }

  // Jugador recolecta moneda
  collectCoin(player, coin) {
    coin.destroy();
    this.puntuacion += 7;
    this.contCoins += 1 + this.currentWave;
  }

  // Bala enemiga impacta con jugador
  handleEnemyBulletHit(player, bullet) {
    bullet.destroy();
    if (this.isPlayerDead) return;
    this.playerHealth -= 1;
    this.updateHealthBar();

    // Si el jugador muere
    if (this.playerHealth === 0 && !this.isPlayerDead) {
      this.isPlayerDead = true;
      this.player.visible = false;
      const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
      explosion.play('explode');
      explosion.on('animationcomplete', () => {
        this.gameOver();
      });
    }    
  }
  
  // Hace que los enemigos disparen
  enemyShoot(enemy) {
    if (!enemy.active) return;
    const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, 'bullet');
    const speedY = this.slowTime ? 60 : 200 + (this.currentWave * 10);
    const speedX = Phaser.Math.Between(this.slowTime ? -20 : -50, this.slowTime ? 20 : 50);
    bullet.setVelocityY(speedY);
    bullet.setVelocityX(speedX);
  }

  // Sistema de oleadas
  startWave() {
    // Enemigos spawneados
    this.currentWaveEnemies = 0;
    // Enemigos derrotados
    this.enemiesDefeated = 0;
  
    // Cantidad de enemigos por oleada
    let baseEnemyCount = 10;
    let extraEnemies = Math.max(0, (this.currentWave - 2) * 2); // Se van añadiendo enemigos extra a partir de la la oleada 4
    let enemyCount = baseEnemyCount + extraEnemies;
    this.waveEnemyCount = enemyCount;
  
    let spawnRate = Math.max(200, this.slowTime ? 2000 : 1000); // Maneja la velocidad de spawneo
  
    // Mostrar el texto de la nueva oleada
    if (this.waveText) {
      this.waveText.destroy();
    }
    this.waveText = this.add.text(350, 30, `Oleada ${this.currentWave + 1}`, {
      fontSize: '32px',
      fill: '#fff'
    }).setOrigin(0.5);
  
    // Iniciar spawner
    this.spawnTimer = this.time.addEvent({
      delay: spawnRate,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
  }

  // Comprueba si se han derrotado a todos los enemigos de la oleada
  checkWaveComplete() {
    // Si todos los enemigos están derrotados se spawnea al jefe
    if (this.enemiesDefeated >= this.waveEnemyCount && !this.bossActive) {
      this.spawnBoss();
    }
  }
  
  // Spawnea al jefe
  spawnBoss() {
    this.bossActive = true;
    this.boss = this.physics.add.sprite(300, 0, 'boss');
    this.boss.setAngle(180);
    const bossVelocityY = this.slowTime ? 25 : 50;
    this.boss.setScale(0.6);
    this.boss.vida = 20 + (this.currentWave * 5);
    this.boss.setVelocityY(bossVelocityY);
    // Posición vertical en la que se detiene
    this.boss.stopY = 150;
  
    // Colisión con balas
    this.physics.add.overlap(this.bullets, this.boss, this.handleBulletBossCollision, null, this);
    // Colisión con jugador
    this.physics.add.overlap(this.player, this.boss, this.handlePlayerEnemyCollision, null, this);
  }

  // Maneja disparos del jefe
  bossShoot(boss) {
    if (!boss.active) return;
    const numBullets = 24;
    const speed = this.slowTime ? 60 : 200 + (this.currentWave * 2);
    const radius = 24;

    for (let i = 0; i < numBullets; i++) {
      // Calcula ángulo para cada bala
      const angle = (i / numBullets) * Math.PI * 2;

      // Calcula posiciones de la bala
      const x = boss.x + radius * Math.cos(angle);
      const y = boss.y + radius * Math.sin(angle);

      // Calcula velocidades de la bala
      const velocityX = speed * Math.cos(angle);
      const velocityY = speed * Math.sin(angle);

      // Crea las balas y las dispara
      const bullet = this.enemyBullets.create(x, y, 'bullet');
      bullet.setScale(1.5);
      bullet.setVelocityX(velocityX);
      bullet.setVelocityY(velocityY);
    }
  }


  // Maneja colisiones de balas con el jefe
  handleBulletBossCollision(boss, bullet) {
    boss.vida -= 1;
    if (bullet) bullet.destroy();
    if (boss.vida > 0) {
      // El jefe parpadea, indicando que recibe daño
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
      // El jefe muere y explota
      this.enemiesDefeated++;
      const explosion = this.add.sprite(boss.x, boss.y, 'explosion');
      explosion.setScale(4);
      explosion.play('explode');
      boss.destroy();
      this.itemDrop(boss);
      this.puntuacion += 1000;

      // Termina la oleada
      this.endWave();
    }
  }
  
  

  endWave() {
    // Se elimina el spawner
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
    // Se eliminan los enemigos y jefes
    this.enemies.clear(true, true);
    this.bossActive = false;
    this.boss = null;
    // Se inicia una nueva oleada
    this.currentWave++;
    this.startWave();
  }
  
  
}
