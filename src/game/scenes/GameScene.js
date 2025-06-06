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
    // Objetos de corazones
    this.hearts = null
    // Objetos para llenar la barra de poder especial
    this.fires = null;
    // Cuenta cuanto poder especial tiene el jugador. Si tiene 3, puede hacer el disparo especial
    this.contFires = 0;
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
  }

  create() {
    // Pipeline blanco y negro
    this.renderer.pipelines.addPostPipeline('GrayscalePipeline', GrayscalePipeline);
    // Background
    this.add.image(300, 325, 'background');
    // Jugador
    this.player = this.physics.add.sprite(300, 550, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.7);
    this.player.setDepth(10);

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
    this.physics.add.overlap(this.enemies, this.bullets, this.handleBulletEnemyCollision, null, this);
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
    // Balas del jugador en pantalla
    this.bullets.getChildren().forEach(bullet => {
      // Elimina las balas del jugador que se salen del mapa
      if (bullet.y < 0) {
        bullet.setActive(false).setVisible(false);
        bullet.body.stop();
        bullet.destroy();
        return;
      }
    })

    // Enemigos en pantalla
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
        enemy.setPosition(Phaser.Math.Between(50, 550), 0);
      }

       // Refresca el cooldown de los disparos si el tiempo está ralentizado o no
      const shootDelay = this.slowTime ? 1500 : 800;
      if (time > enemy.shootCooldown) {
        this.enemyShoot(enemy);
        enemy.shootCooldown = time + shootDelay + Phaser.Math.Between(-200, 200);
    }
    });

    // Balas enemigas en pantalla
    this.enemyBullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
    
      // Desactiva si la bala enemiga se sale de pantalla
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
    if (!this.slowTime && this.grayscaleApplied && !this.isPlayerDead) {
      this.cameras.main.resetPostPipeline();
      this.grayscaleApplied = false;
    }
  }

  // Hace que el jugador dispare
  shootBullet() {
    // Si tiene multidisparo
    if(this.isPlayerDead) return;
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
        this.handleBulletEnemyCollision(enemy, null);
      });
  
      // Quita 20 puntos de vida al jefe
      if (this.boss && this.boss.active) {
        this.boss.vida -= 20;
        this.updateBossHealthBar();
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
    enemy.setScale(0.4);
  }

  // Maneja colisión entre bala y enemigo
  handleBulletEnemyCollision(enemy, bullet) {
    enemy.vida -= 1;
    if(this.bossActive) {
      enemy.vida -= 3;
    }
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

  // Maneja el drop de objetos al eliminar un enemigo
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
    if(this.currentWave < 5) {
      this.playerHealth -= 0.1 * (1 + this.currentWave);
    } else {
      this.playerHealth -= 0.5;
    }
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
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
    this.cameras.main.setPostPipeline('GrayscalePipeline');
    this.grayscaleApplied = true;
    this.waveText.destroy();
    this.physics.pause();

    this.time.delayedCall(100, () => {
      this.add.text(150, 150, `Oleada: ${this.currentWave + 1}`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 });
      this.add.text(150, 200, `Puntuación: ${this.puntuacion}`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 });
      this.add.text(150, 250, `Monedas: ${this.contCoins}`, { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 });
      this.add.text(150, 350, 'GAME OVER', { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#fff', stroke: '#000000', strokeThickness: 4 });
    });
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
      }).catch((error) => {
        console.error('Error al guardar en Firestore:', error);
      });
    }

    // Habilitar reinicio tras 2 segundos
    this.time.delayedCall(2000, () => {
    this.add.text(this.scale.width/2, 460, 'Presiona cualquier tecla', { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(this.scale.width/2, 500, 'para volver al título.', { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#fff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);

    // Detectar cualquier tecla para reiniciar el juego
    this.input.keyboard.once('keydown', () => {
      this.resetGame();
      this.scene.start('TitleScene');
    });
  });
}

// Método para reiniciar valores críticos
resetGame() {
  this.playerHealth = 100;
  this.isPlayerDead = false;
  this.contFires = 0;
  this.contCoins = 0;
  this.puntuacion = 0;
  this.currentWave = 0;
  this.bossActive = false;
  this.grayscaleApplied = false;

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
    if(this.playerHealth > 100) {
      this.playerHealth = 100;
    }
    if(this.playerHealth < 0) {
      this.playerHealth = 0;
    }

    const percent = this.playerHealth / this.maxHealth;

    this.healthBar.clear();

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
    if(!this.slowTime) {
      this.contCoins += 1 + this.currentWave;
    } else {
      this.contCoins += 5 + this.currentWave;
    }

  }

  // Bala enemiga impacta con jugador
  handleEnemyBulletHit(player, bullet) {
    bullet.destroy();
    if (this.isPlayerDead) return;
    if(this.currentWave < 10) {
      this.playerHealth -= 1 + (0.05 * this.currentWave);
    } else {
      this.playerHealth -= 1.5;
    }
    if (this.bossActive) {
      this.playerHealth -= 0.5;
    }
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
    if (!enemy.active || this.isPlayerDead) return;
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
    let extraEnemies = Math.max(0, (this.currentWave - 2) * 2);
    let enemyCount = baseEnemyCount + extraEnemies;
    this.waveEnemyCount = enemyCount;
  
    let spawnRate = Math.max(200, this.slowTime ? 2000 : 1000);
  
    // Mostrar el texto de la nueva oleada
    if (this.waveText) {
      this.waveText.destroy();
    }
    this.waveText = this.add.text(this.scale.width/2 + 30, 45, `Oleada ${this.currentWave + 1}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      fill: '#fff',
      stroke: '#000000',
      strokeThickness: 4
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
    const bossVelocityY = this.slowTime ? 25 : 50 + (this.currentWave * 5);
    this.boss.setScale(0.6);
    this.boss.vida = 20 + (this.currentWave * 5);
    this.boss.maxVida = this.boss.vida;
    this.boss.setVelocityY(bossVelocityY);
    // Posición vertical en la que se detiene
    this.boss.stopY = 150;

    // Barra de vida del jefe y nombre
    this.jefeText = this.add.text(this.scale.width/2, 585, 'Jefe Alienígena', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      fill: '#fff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    this.bossHealthBar = this.add.graphics();
    this.bossHealthBar.setVisible = true;
    this.updateBossHealthBar();
  
    // Colisión con balas
    this.physics.add.overlap(this.bullets, this.boss, this.handleBulletBossCollision, null, this);
    // Colisión con jugador
    this.physics.add.overlap(this.player, this.boss, this.handlePlayerEnemyCollision, null, this);
  }

  // Maneja disparos del jefe
  bossShoot(boss) {
    if (!boss.active || this.isPlayerDead) return;
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
    this.updateBossHealthBar();

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
      this.contCoins += 20 + (5 * this.currentWave);
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
    if(this.boss.vida > this.boss.maxVida) {
      this.boss.vida = 100;
    }
    if(this.boss.vida < 0) {
      this.boss.vida = 0;
    }

    const percent = this.boss.vida / this.boss.maxVida;

    this.bossHealthBar.clear();

    // Barra de vida
    this.bossHealthBar.fillStyle(0xff0000);
    this.bossHealthBar.fillRect(x, y, barWidth * percent, barHeight);

    // Borde blanco
    this.bossHealthBar.lineStyle(2, 0xffffff);
    this.bossHealthBar.strokeRect(x, y, barWidth, barHeight);
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