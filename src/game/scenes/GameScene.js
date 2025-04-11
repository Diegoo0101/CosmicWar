import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.playerHealth = 5;
    this.maxHealth = 5;
    this.puntuacion = 0;
    this.powerUps = null;
    this.hasDoubleShot = false;
    this.enemyBullets = null;
    this.hearts = null
  }

  preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/player.png');
    this.load.image('bullet', '/assets/bullet.png');
    this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/player.png');
    this.load.image('powerup', '/assets/coin.png');
    this.load.image('heart', 'https://labs.phaser.io/assets/sprites/heart.png');
    this.load.image('enemyBullet', '/assets/bullet.png');

  }


  create() {
    this.player = this.physics.add.sprite(250, 500, 'player');
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })

    this.shift = this.input.keyboard.addKey("SHIFT");
    this.input.keyboard.on('keydown-SPACE', this.shootBullet, this);
    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.time.addEvent({
      delay: 1000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletEnemyCollision, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // 🎯 Crear barra de vida
    this.healthBar = this.add.graphics();
    this.updateHealthBar();

    this.powerUps = this.physics.add.group();

    this.hearts = this.physics.add.group();

    this.physics.add.overlap(this.player, this.hearts, this.collectHeart, null, this);

    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);

    this.enemyBullets = this.physics.add.group();

// Colisión entre balas enemigas y el jugador
this.physics.add.overlap(this.player, this.enemyBullets, this.handleEnemyBulletHit, null, this);

  }

  update() {
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
  }

  shootBullet() {
    if (this.hasDoubleShot) {
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
  

spawnEnemy() {
  const x = Phaser.Math.Between(50, 750);
  const enemy = this.enemies.create(x, 0, 'enemy');
  enemy.setVelocityY(50);
  enemy.setAngle(180);
  enemy.setScale(2);
  enemy.vida = 3;

  // Asignar temporizador individual de disparo
  enemy.shootTimer = this.time.addEvent({
    delay: Phaser.Math.Between(500, 1000),
    callback: () => this.enemyShoot(enemy),
    loop: true
  });
}


  handleBulletEnemyCollision(bullet, enemy) {
    enemy.vida -= 1;
    bullet.destroy();
    if(enemy.vida <= 0) {
    if (enemy.shootTimer) enemy.shootTimer.remove();
enemy.destroy();

    this.puntuacion += 100;
  
    // 30% de probabilidad de soltar power-up
    if (Phaser.Math.FloatBetween(0, 1) < 0.1) {
      const powerUp = this.powerUps.create(enemy.x, enemy.y, 'powerup');
      powerUp.setVelocityY(100);
    }

    if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
      const heart = this.hearts.create(enemy.x, enemy.y, 'heart').setScale(0.25);
      heart.setVelocityY(100);
    }
    }
    

  }
  

  handlePlayerEnemyCollision(player, enemy) {
    if (enemy.shootTimer) enemy.shootTimer.remove();
enemy.destroy();

    this.playerHealth -= 1;
    console.log(`Vida: ${this.playerHealth}`);
    this.updateHealthBar();

    if (this.playerHealth <= 0) {
      this.scene.pause();
      this.add.text(300, 250, 'GAME OVER', { fontSize: '32px', fill: '#fff' });
      this.add.text(300, 50, `Puntuación: ${this.puntuacion}`, { fontSize: '32px', fill: '#fff' });
    }
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

    // Barra roja de vida
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(x, y, barWidth * percent, barHeight);

    // Borde blanco
    this.healthBar.lineStyle(2, 0xffffff);
    this.healthBar.strokeRect(x, y, barWidth, barHeight);
  }

  collectPowerUp(player, powerUp) {
    powerUp.destroy();
    this.hasDoubleShot = true;
  
    // Puedes agregar duración limitada si quieres
    this.time.delayedCall(10000, () => {
       this.hasDoubleShot = false;
    });
  }

  collectHeart(player, heart) {
    heart.destroy();
    if(this.playerHealth < 5) {
      this.playerHealth += 1;
    }
    this.updateHealthBar();
  }

  handleEnemyBulletHit(player, bullet) {
    bullet.destroy();
    this.playerHealth -= 1;
    this.updateHealthBar();
  
    if (this.playerHealth <= 0) {
      this.scene.pause();
      this.add.text(100, 300, 'GAME OVER', { fontSize: '32px', fill: '#fff' });
      this.add.text(100, 150, `Puntuación: ${this.puntuacion}`, { fontSize: '32px', fill: '#fff' });
    }
  }
  
  enemyShoot(enemy) {
    if (!enemy.active) return;
  
    const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, 'enemyBullet');
    bullet.setVelocityY(200).setVelocityX(Phaser.Math.Between(-50, 50));
  }
  
}
