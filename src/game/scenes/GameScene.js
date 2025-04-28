import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.playerHealth = 100;
    this.maxHealth = 100;
    this.puntuacion = 0;
    this.powerUps = null;
    this.hasMultiShot = false;
    this.enemyBullets = null;
    this.hearts = null
    this.boss = null;
    this.bossActive = false;
    this.fires = null;
    this.contFires = 0;
    this.clocks = null;
    this.slowTime = false;
    this.coins = null;
    this.contCoins = 0;
    this.isPlayerDead = false;
  }
  
  // Nueva variable para el sistema de oleadas
  currentWave = 0;
  waveText;

  preload() {
    this.load.image('player', '/assets/player.png');
    this.load.image('bullet', '/assets/bullet.png');
    this.load.image('enemy', '/assets/enemy.png');
    this.load.image('boss', '/assets/boss.png');
    this.load.image('item_multishot', '/assets/item_multishot.png');
    this.load.image('item_specialshot', '/assets/item_specialshot.png');
    this.load.image('item_stoptime', '/assets/item_stoptime.png'); 
    this.load.image('item_health', 'https://labs.phaser.io/assets/sprites/heart.png');
    this.load.image('coin', '/assets/coin.png');

    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 64, // ajusta según tu spritesheet
      frameHeight: 64
    }); 
  }


  create() {
    this.player = this.physics.add.sprite(250, 500, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.05);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })

    this.shift = this.input.keyboard.addKey("SHIFT");
    this.input.keyboard.on('keydown-SPACE', this.shootBullet, this);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shootCooldown = 0;
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

   // Iniciar la primera oleada
   this.startWave();


    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // 🎯 Crear barra de vida
    this.healthBar = this.add.graphics();
    this.updateHealthBar();
    this.specialBar = this.add.graphics();
    this.updateSpecialBar();

    this.powerUps = this.physics.add.group();

    this.hearts = this.physics.add.group();

    this.fires = this.physics.add.group();

    this.clocks = this.physics.add.group();

    this.coins = this.physics.add.group();

    this.physics.add.overlap(this.player, this.hearts, this.collectHeart, null, this);

    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);

    this.physics.add.overlap(this.player, this.fires, this.collectFire, null, this);

    this.physics.add.overlap(this.player, this.clocks, this.collectClock, null, this);

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    this.enemyBullets = this.physics.add.group();

// Colisión entre balas enemigas y el jugador
this.physics.add.overlap(this.player, this.enemyBullets, this.handleEnemyBulletHit, null, this);

this.anims.create({
  key: 'explode',
  frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }), // ajusta los frames
  frameRate: 20,
  hideOnComplete: true // oculta el sprite al terminar
});

  }

  update(time) {
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

    if (this.spaceKey.isDown) {
      if (time > this.shootCooldown) {
          this.shootBullet();
          this.shootCooldown = time + 300; // Puede disparar de nuevo en 200 ms
      }
  }

    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      this.specialShot();
    }
    

    this.enemies.getChildren().forEach(enemy => {
      const targetSpeed = this.slowTime ? 30 : 50 + this.currentWave * 10;
      if (enemy.body.velocity.y !== targetSpeed) {
        enemy.setVelocityY(targetSpeed);
      }

      // Verificar si el enemigo está fuera de la pantalla en la parte inferior
      if (enemy.y > this.game.config.height) {
        enemy.setPosition(Phaser.Math.Between(50, 450), 0);
      }
    });

    if (this.boss && !this.boss.hasStartedMovingSideways && this.boss.y >= this.boss.stopY) {
      this.boss.setVelocityY(0);
      this.boss.setVelocityX(this.slowTime ? 30 : 50);
      // comienza a moverse lateralmente
      this.boss.hasStartedMovingSideways = true;
    }
    
    
    if (this.boss && this.boss.hasStartedMovingSideways) {
      const speed = this.slowTime ? 30 : 50;
    
      if (this.boss.x <= 50 && this.boss.body.velocity.x < 0) {
        this.boss.setVelocityX(speed); // va a la derecha
      } else if (this.boss.x >= this.game.config.width - 50 && this.boss.body.velocity.x > 0) {
        this.boss.setVelocityX(-speed); // va a la izquierda
      }
    }

    if(this.slowTime) {
      console.log('fondo blanco y negro');
    }
    
  }

  shootBullet() {
    if (this.hasMultiShot) {
        // Crear múltiples balas con las propiedades correctas
        const offsets = [-10, -5, 0, 5, 10]; // Posiciones relativas para las balas
        offsets.forEach(offset => {
            const bullet = this.bullets.create(this.player.x + offset, this.player.y - 20, 'bullet');
            bullet.setVelocityY(-300);
            bullet.setVelocityX(offset * 2); // Ajustar la dirección horizontal
        });
    } else {
        // Crear una sola bala
        const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
        bullet.setVelocityY(-300);
    }
  }

  specialShot() {
    if(this.contFires >= 3) {
      
      // Restablecer el contador
      this.contFires = 0;
  
      // Destruir enemigos normales
      this.enemies.getChildren().slice().forEach(enemy => {
        if (enemy.shootTimer) enemy.shootTimer.remove();
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
        explosion.play('explode');
        enemy.destroy();
        this.puntuacion += 100;
        this.enemiesDefeated++;
      });
  
      // También puedes hacer que dañe (o destruya) al jefe si está activo
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
            this.boss.alpha = 1;
          }
        });
        if (this.boss.vida <= 0) {
          this.handleBulletBossCollision(this.boss, null);
        }
      }
  
      this.checkWaveComplete();
    }

    this.updateSpecialBar();
  }  
  

  spawnEnemy() {
    if (this.currentWaveEnemies >= this.waveEnemyCount) return;
  
    this.currentWaveEnemies++;
  
    const x = Phaser.Math.Between(50, 450);
    const enemy = this.enemies.create(x, 0, 'enemy');
    const velocityY = 50 + this.currentWave * 10;
    enemy.setVelocityY(velocityY);    
    enemy.vida = 3;
    enemy.setScale(2);
    const shootDelay = this.slowTime ? Phaser.Math.Between(1200, 2000) : Phaser.Math.Between(600, 1200);
    enemy.shootTimer = this.time.addEvent({
      delay: shootDelay,
      callback: () => this.enemyShoot(enemy),
      loop: true
    });
  }
  


  handleBulletEnemyCollision(bullet, enemy) {
    enemy.vida -= 1;
    bullet.destroy();

    if (enemy.vida > 0) {
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
    }

    
    if(enemy.vida <= 0) {
      if (enemy.shootTimer) enemy.shootTimer.remove();
      this.enemiesDefeated++;
      const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
      explosion.play('explode');

      enemy.destroy();

      this.puntuacion += 100;
  
      // 30% de probabilidad de soltar power-up
      if (Phaser.Math.FloatBetween(0, 1) < 0.1) {
        const powerUp = this.powerUps.create(enemy.x, enemy.y, 'item_multishot');
        powerUp.setScale(1.2);
        powerUp.setVelocityY(100);
      }

      if (Phaser.Math.FloatBetween(0, 1) < 0.07) {
        const heart = this.hearts.create(enemy.x, enemy.y, 'item_health').setScale(0.25);
        heart.setVelocityY(100);
      }
      
      if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
        const fire = this.fires.create(enemy.x, enemy.y, 'item_specialshot').setScale(0.5);
        fire.setVelocityY(100);
      }

      if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
        const clock = this.clocks.create(enemy.x, enemy.y, 'item_stoptime').setScale(0.45);
        clock.setVelocityY(100);
      }

      if (Phaser.Math.FloatBetween(0, 1) < 0.3) {
        const coin = this.coins.create(enemy.x, enemy.y, 'coin').setScale(0.1);
        coin.setVelocityY(100);
      }
    }

    this.checkWaveComplete();
    

  }


  handlePlayerEnemyCollision(player, enemy) {
    if (this.isPlayerDead) return;
    this.playerHealth -= 0.1;
    this.updateHealthBar();
    

    if (this.playerHealth <= 0 && !this.isPlayerDead) {
      this.isPlayerDead = true;
      this.playerHealth = 0;
      this.player.visible = false;
      const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
      explosion.play('explode');
    
      explosion.on('animationcomplete', () => {
        this.gameOver();
      });
    }    
  }

  gameOver() {
    this.scene.pause();
    this.add.text(150, 150, `Oleada: ${this.currentWave + 1}`, { fontSize: '32px', fill: '#fff' });
    this.add.text(150, 200, `Puntuación: ${this.puntuacion}`, { fontSize: '32px', fill: '#fff' });
    this.add.text(150, 250, `Monedas: ${this.contCoins}`, { fontSize: '32px', fill: '#fff' });
    this.add.text(150, 350, 'GAME OVER', { fontSize: '32px', fill: '#fff' });
  }

  updateHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;

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

    // Barra de vida
    this.specialBar.fillStyle(0xffff00);
    this.specialBar.fillRect(x, y, barWidth * percent, barHeight);

    // Borde blanco
    this.specialBar.lineStyle(2, 0xffffff);
    this.specialBar.strokeRect(x, y, barWidth, barHeight);
  }

  collectPowerUp(player, powerUp) {
    powerUp.destroy();
    this.puntuacion += 10;
    this.hasMultiShot = true;
  
    // Puedes agregar duración limitada si quieres
    this.time.delayedCall(10000, () => {
       this.hasMultiShot = false;
    });
  }

  collectHeart(player, heart) {
    heart.destroy();
    this.puntuacion += 5;
    if(this.playerHealth < 90) {
      this.playerHealth += 10;
    } else {
      this.playerHealth = this.maxHealth;
    }
    this.updateHealthBar();
  }

  collectFire(player, fire) {
    fire.destroy();
    this.puntuacion += 100;
    this.contFires++;
    this.updateSpecialBar();
  }

  collectClock(player, clock) {
    clock.destroy();
    this.puntuacion += 75;
    this.slowTime = true;
    this.time.delayedCall(10000, () => {
      this.slowTime = false;
    });
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.puntuacion += 7;
    this.contCoins += 1 + this.currentWave;
  }


  handleEnemyBulletHit(player, bullet) {
    bullet.destroy();
    if (this.isPlayerDead) return;
    this.playerHealth -= 1;
    this.updateHealthBar();
    
  
    if (this.playerHealth <= 0 && !this.isPlayerDead) {
      this.isPlayerDead = true;
      this.playerHealth = 0;
      this.player.visible = false;
      const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
      explosion.play('explode');
    
      explosion.on('animationcomplete', () => {
        this.gameOver();
      });
    }    
  }
  
  enemyShoot(enemy) {
    if (!enemy.active) return;
    const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, 'bullet');
    const speedY = this.slowTime ? 60 : 200 + (this.currentWave * 10);
    bullet.setVelocityY(speedY);
    bullet.setVelocityX(Phaser.Math.Between(this.slowTime ? -20 : -50, this.slowTime ? 20 : 50));
  }

  // Sistema de oleadas
  startWave() {
    this.currentWaveEnemies = 0;
    this.enemiesDefeated = 0;
  
    // Calcular valores dinámicos
    let baseEnemyCount = 10;
    let extraEnemies = Math.max(0, (this.currentWave - 2) * 2); // desde oleada 4
    let enemyCount = baseEnemyCount + extraEnemies;
    this.waveEnemyCount = enemyCount;
  
    let spawnRate = Math.max(200, this.slowTime ? 2000 : 1000); // más rápido pero no menos de 200ms
  
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
  

  checkWaveComplete() {
    if (this.enemiesDefeated >= this.waveEnemyCount && !this.bossActive) {
      this.spawnBoss(); // En vez de endWave
    }
  }
  
  spawnBoss() {
    this.bossActive = true;
    
    this.boss = this.physics.add.sprite(200, 0, 'boss');
    this.boss.setAngle(180);
    const bossVelocityY = this.slowTime ? 25 : 50;
    this.boss.setVelocityY(bossVelocityY);

    const delay = this.slowTime ? Phaser.Math.Between(1200, 2000) : Phaser.Math.Between(400, 600);

    this.boss.stopY = 150; // posición en Y donde se detiene

    this.boss.setScale(0.6);
    this.boss.vida = 20 + (this.currentWave * 5);
    this.bossShootTimer = this.time.addEvent({
      delay: delay,
      callback: () => this.bossShoot(this.boss),
      loop: true
    });
  
    // Agregar colisión con balas
    this.physics.add.overlap(this.bullets, this.boss, this.handleBulletBossCollision, null, this);
  
    // Colisión con jugador
    this.physics.add.overlap(this.player, this.boss, this.handlePlayerEnemyCollision, null, this);
  }

  bossShoot(boss) {
    if (!boss.active) return;

    const numBullets = 24; // Number of bullets in the circle
    const speed = this.slowTime ? 60 : 200 + (this.currentWave * 2); // Bullet speed
    const radius = 20; // Radius of the circle

    for (let i = 0; i < numBullets; i++) {
      // Calculate angle for each bullet
      const angle = (i / numBullets) * Math.PI * 2; // Evenly spaced angles

      // Calculate X and Y positions for the bullet
      const x = boss.x + radius * Math.cos(angle);
      const y = boss.y + radius * Math.sin(angle);

      // Calculate X and Y velocities
      const velocityX = speed * Math.cos(angle);
      const velocityY = speed * Math.sin(angle);

      // Create and fire the bullet
      const bullet = this.enemyBullets.create(x, y, 'bullet');
      bullet.setScale(1.5);
      bullet.setVelocityX(velocityX);
      bullet.setVelocityY(velocityY);
    }
  }


  
  handleBulletBossCollision(boss, bullet) {
    boss.vida -= 1;
    bullet.destroy();

    if (boss.vida > 0) {
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
    }

    
    if(boss.vida <= 0) {
      if (this.bossShootTimer) this.bossShootTimer.remove();
      this.enemiesDefeated++;
      const explosion = this.add.sprite(boss.x, boss.y, 'explosion');
      explosion.setScale(4);
      explosion.play('explode');

      boss.destroy();

      this.puntuacion += 1000;
  
      this.endWave(); // Ahora sí pasamos a la siguiente oleada
    }
  }
  
  

  endWave() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
  
    this.enemies.clear(true, true);
    this.bossActive = false; // ✅ Permitir que el jefe vuelva a aparecer
    this.boss = null;        // ✅ Limpiar la referencia también (opcional pero recomendable)
  
    this.currentWave++;
    this.startWave();
  }
  
  
}
