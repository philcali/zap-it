var EnemyExplosion = me.ObjectEntity.extend({
  init: function(x, y) {
    var settings = {
      image: "enemy_die",
      spritewidth: 16
    };

    this.parent(x, y, settings);

    this.animationspeed = me.sys.fps / 20;
    this.lasting = this.animationspeed * 3;

    this.type = me.game.ACTION_OBJECT;
  },

  update: function() {
    this.lasting --;

    if (this.lasting <= 0) {
      me.game.remove(this);
      return false;
    }

    this.parent(this);

    return true;
  }
});

var Baddy = me.ObjectEntity.extend({
  init: function(x, y, settings, power) {
    this.parent(x, y, settings);

    this.power = power;

    // Always collidable
    this.collidable = true;

    this.type = me.game.ENEMY_OBJECT;
  },

  setPower: function(power) {
    this.power = power;
  }
});

var MegaEnemy = Baddy.extend({
  init: function(x, y, settings, power, health) {
    this.parent(x, y, settings, power);

    this.health = health;
    this.aerial = false;
  },

  locatePlayer: function() {
    var players = me.game.getEntityByName('mainPlayer');
    return players.length >= 1 ? players[0] : null;
  },

  setHealth: function(health) {
    this.health = health;
  },

  checkDeflect: function(res, obj) {
    return false;
  },

  checkDrop: function() {
    var chances = Math.random();
    if (chances > 0.80) {
      return false;
    }

    if (chances >= 0 && chances < 0.15 && me.dropmanager.isHealthDropValid()) {
      return me.dropmanager.getHealthChild();
    } else if (chances >= 0.70 && chances <= 0.71 && me.dropmanager.isLifeDropValid()) {
      return 'life';
    }

    return false;
  },

  performDeflect: function(res, bullet) {
    bullet.alive = false;
    var left = res.x > 0;
    me.game.add(
      new DeflectedBullet(
        bullet.pos.x,
        bullet.pos.y - 4,
        left
      ), this.z
    );
    me.game.sort();
    me.audio.play('deflect');
  },

  performDrop: function(droptype) {
    var settings = { everlasting: false },
      drop = me.dropmanager.types[droptype];

    me.game.add(new drop(this.pos.x, this.pos.y, settings), this.z);
  },

  doDeath: function() {
    this.alive = false;

    var cur = this.pos;

    me.game.add(new EnemyExplosion(cur.x + 10, cur.y + 5), this.z);

    var droptype = this.checkDrop();

    if (me.dropmanager.isValid(droptype)) {
      this.performDrop(droptype);
    }

    me.game.sort();
    me.audio.play('enemy_explosion');

    me.game.remove(this);
  },

  onCollision: function(res, obj) {
    if (obj instanceof Bullet) {
      me.game.remove(obj);

      // Can this enemy deflect bullets?
      // Only deflect and take damage on live rounds
      if (obj.alive && this.checkDeflect(res, obj)) {
        this.performDeflect(res, obj);
      } else if (obj.alive) {
        this.health --;

        if (this.health <= 0) {
          this.doDeath();
        } else {
          me.audio.play('enemy_hit');
          this.flicker(3);
        }
      }
    }
  }
});

var EnemyBullet = Baddy.extend({
  init: function(x, y, left) {
    var settings = {
      name: "EnemyBullet",
      image: "other_bullet",
      spritewidth: 8
    };

    this.parent(x, y, settings, 3);

    this.flyLeft = left;
    this.setVelocity(3, 0);
  },

  onCollision: function(res, obj) {
    if (obj instanceof PlayerEntity) {
      this.alive = false;
      me.game.remove(this);
    }
  },

  update: function() {
    if (!this.alive) {
      return false;
    }

    this.doWalk(this.flyLeft);

    if (this.arching) {
      var res = this.updateMovement();

      if (res && res.y > 0) {
        this.vel.y == 0;
      }

    } else {
      this.computeVelocity(this.vel);
      this.pos.add(this.vel);
    }

    me.game.collide(this);

    if (!me.game.viewport.isVisible(this) || (this.arching && this.vel.y == 0)) {
      this.alive = false;
      me.game.remove(this);
      return false;
    }

    return true;
  }
});

var FBombExplosion = Baddy.extend({
  init: function(x, y) {
    var settings = {
      name: "fbomb-explosion",
      image: "fbomb-explosion",
      spritewidth: 48
    };

    this.parent(x, y, settings, 5);
    this.setVelocity(0, 0);

    this.animationspeed = me.sys.fps / 20;

    this.completeCycle = this.animationspeed * 13;
  },

  update: function() {
    this.completeCycle --;

    if (this.completeCycle <= 0) {
      me.game.remove(this);
      return false;
    }

    this.parent(this);
    return true;
  }
});

var FBomb = MegaEnemy.extend({
  init: function(x, y, left, arching) {
    var settings = {
      name: "f-bomb",
      image: "f-bomb",
      spritewidth: 23
    };

    this.parent(x, y, settings, 5, 1);

    this.addAnimation('left', [0]);
    this.addAnimation('right', [1]);
    this.addAnimation('spinning', [0, 1]);
    this.addAnimation('ready', [2]);

    this.flyLeft = left;
    this.arching = arching;

    this.gravity = 0.50;

    left ?
      this.setCurrentAnimation('left') :
      this.setCurrentAnimation('right');

    arching ?
      this.setVelocity(2, 10) :
      this.setVelocity(4, 0);
  },

  checkDeflect: function() {
    return true;
  },

  checkDrop: function() {
    return false;
  },

  doExplode: function() {
    this.setCurrentAnimation('ready', function() {
      this.alive = false;
      var explosion = new FBombExplosion(
        this.pos.x,
        this.pos.y + 13
      );

      me.game.add(explosion, this.z);
      me.game.sort();
      me.audio.play('fbomb');

      me.game.remove(this);
    });
  },

  onCollision: function(res, obj) {
    this.parent(res, obj);

    if (obj instanceof PlayerEntity) {
      this.doExplode();
    }
  },

  update: function() {
    if (!this.alive) {
      return false;
    }

    if (this.arching && !this.isCurrentAnimation('ready')) {
      this.doJump();
    }

    if (!this.isCurrentAnimation('ready')) {
      this.doWalk(this.flyLeft);
      if (!this.flyLeft) {
        this.flipX(true);
      }
    }

    if (this.jumping) {
      this.setCurrentAnimation('spinning');
    }

    var res = this.updateMovement();

    this.parent(this);

    if (res) {
      if (res.x != 0 || res.y != 0) {
        this.doExplode();
        return true;
      }
    }

    if (this.vel.y == 0 && this.vel.x == 0) {
      this.doExplode();
      return false;
    }

    return true;
  }
});

var FollowingEnemy = MegaEnemy.extend({
  init: function(x, y, settings, power, health) {
    this.parent(x, y, settings, power, health);

    this.gravity = 0;
    this.gatheredFocus = false;
    this.lineOfSight = 100;
    this.onladder = true;
    this.aerial = true;

    this.mainPlayer = null;
  },

  onFocus: function() {
    this.setVelocity(0.5, 0.5);
  },

  doMoveTowards: function(obj) {
    this.doWalk(obj.pos.x < this.pos.x);
    this.doClimb(obj.pos.y < this.pos.y);
  },

  update: function() {
    if (!this.visible || !this.alive) {
      return false;
    }

    if (!this.mainPlayer) {
      this.mainPlayer = this.locatePlayer();
    }

    if (!this.mainPlayer || !this.mainPlayer.alive) {
      this.parent(this);
      return false;
    }

    if (!this.gatheredFocus) {
      if (this.distanceTo(this.mainPlayer) <= this.lineOfSight) {
        this.gatheredFocus = true;
        this.onFocus();
      } else {
        return false;
      }
    }

    this.doMoveTowards(this.mainPlayer);

    this.computeVelocity(this.vel);
    this.pos.add(this.vel);

    this.parent(this);
    return true;
  }
});

var RobotBat = FollowingEnemy.extend({
  init: function(x, y, settings) {
    settings.image = "robot_bat";
    settings.spritewidth = 28;
    settings.spriteheight = 23;

    this.parent(x, y, settings);
    this.setPower(3);
    this.setHealth(1);

    this.isSleeping = true;
    this.setVelocity(0, 0);

    this.addAnimation('sleeping', [4]);
    this.addAnimation('waking', [3, 4, 3]);
    this.addAnimation('flying', [2, 1, 0, 1]);

    this.setCurrentAnimation('sleeping');
    this.updateColRect(5, 20, -1, 0);
  },

  onFocus: function() {
    this.setCurrentAnimation('waking', function() {
      this.isSleeping = false;
      this.setVelocity(0.4, 0.6);
      this.setCurrentAnimation('flying');
      this.updateColRect(0, 28, 0, 23);
    });
  },

  checkDeflect: function() {
    return this.isSleeping;
  }
});

var SpinningBot = FollowingEnemy.extend({
  init: function(x, y) {
    var settings = {
      name: "SpinningBot",
      image: "spinning_bot",
      spritewidth: 16
    };

    this.parent(x, y, settings);
    this.setPower(3);
    this.setHealth(1);
    this.lineOfSight = 150;
  }
});

var SpinningSpawnPoint = me.InvisibleEntity.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);

    this.liveEnemies = 3;
    this.fireInterval = 100;
    this.fireCounter = this.fireInterval;
  },

  doSpawn: function() {
    me.game.add(new SpinningBot(this.pos.x, this.pos.y), this.z);
    me.game.sort();
  },

  update: function() {
    if (!this.visible) {
      return false;
    }

    this.fireCounter --;
    if (this.fireCounter <= 0) {
      var spinners = me.game.getEntityByName('SpinningBot');

      if (spinners.length < this.liveEnemies) {
        this.doSpawn();
      }
      this.fireCounter = this.fireInterval;
    }

    return false;
  }
});

var WallTurret = MegaEnemy.extend({
  init: function(x, y, settings) {
    settings.image = 'wall_turret';
    settings.spritewidth = 32;
    settings.spriteheight = 36;

    this.parent(x, y, settings, 3, 2);

    this.faceLeft = settings.faceLeft;
    this.rapid = settings.rapid;

    this.addAnimation('down', [2]);
    this.addAnimation('down-shoot', [0, 1, 2]);

    this.addAnimation('up', [5]);
    this.addAnimation('up-shoot', [3, 4, 5]);

    this.addAnimation('straight', [8]);
    this.addAnimation('straight-shoot', [6, 7, 8]);

    this.fireDelay = this.animationspeed * 15;
    this.fireCounter = this.fireDelay;

    this.currentDirection = 'up';

    this.flipX(this.faceLeft);

    this.aerial = true;

    this.mainPlayer = null;
  },

  doFire: function() {
    this.firing = true;
    this.fireCounter = this.fireDelay;

    me.audio.play('enemy_shoot');

    if (this.currentDirection == 'up') {
      var adjustY = 0;
    } else if (this.currentDirection == 'down') {
      var adjustY = 32;
    } else {
      var adjustY = 16;
    }

    var adjustX = this.faceLeft ? 0 : 32;

    var bullet = new EnemyBullet(
      this.pos.x + adjustX,
      this.pos.y + adjustY,
      this.faceLeft
    );

    var distance = this.distanceTo(this.mainPlayer);
    var mult = this.mainPlayer.pos.y < this.pos.y ? -1 : 1;

    bullet.arching = true;

    if (this.currentDirection == 'up') {
      bullet.setVelocity(4, 8);
      bullet.gravity = 0.8;
      bullet.forceJump();
    } else if (this.currentDirection == 'straight') {
      bullet.setVelocity(4, 2);
    } else {
      bullet.setVelocity(4, 4);
    }

    me.game.add(bullet, this.z);
    me.game.sort();

    this.setCurrentAnimation(this.currentDirection + '-shoot', function() {
      this.firing = false;
      this.setCurrentAnimation(this.currentDirection);
    });
  },

  update: function() {
    if (!me.game.viewport.isVisible(this)) {
      return false;
    }

    if (!this.mainPlayer) {
      this.mainPlayer = this.locatePlayer();
    }

    this.parent(this);

    if (this.firing) {
      return true;
    }

    if (!this.mainPlayer.alive) {
      return false;
    }

    var distance = this.distanceTo(this.mainPlayer);
    var vertical = Math.abs(this.pos.y - this.mainPlayer.pos.y);
    var horizontal = Math.abs(this.pos.x - this.mainPlayer.pos.x);

    if (distance > vertical) {
      this.currentDirection = 'up';
    } else if (this.mainPlayer.pos.y >= this.pos.y && distance > 100) {
      this.currentDirection = 'straight';
    } else {
      this.currentDirection = 'down';
    }

    this.setCurrentAnimation(this.currentDirection);

    this.fireCounter --;
    if (this.fireCounter <= 0) {
      this.doFire();
    }

    return true;
  }
});

var SweepingEnemy = MegaEnemy.extend({
  init: function(x, y, settings, power, health) {
    this.parent(x, y, settings, power, health);

    this.startX = x;
    this.endX = x + settings.width - settings.spritewidth;

    this.pos.x = this.endX;

    this.rideLeft = true;
  },

  onTurn: function(fromLeft) {
    this.setCurrentAnimation('spin', 'move');
  },

  update: function() {
    if (!this.visible) {
      return false;
    }

    if (this.alive) {
      if (this.rideLeft && this.pos.x <= this.startX) {
        this.rideLeft = false;
        if (this.isCurrentAnimation('move')) {
          this.onTurn(!this.rideLeft);
        }
      } else if (!this.rideLeft && this.pos.x >= this.endX) {
        this.rideLeft = true;
        if (this.isCurrentAnimation('move')) {
          this.onTurn(!this.rideLeft);
        }
      }

      this.doWalk(this.rideLeft);
    } else {
      this.vel.x = 0;
    }

    this.updateMovement();

    if (this.vel.x != 0 || this.vel.y != 0) {
      this.parent(this);
      return true;
    }

    return false;
  }
});

var ShieldSweeper = SweepingEnemy.extend({
  init: function(x, y, settings) {
    settings.image = "sweeper";
    settings.spritewidth = 24;
    settings.spriteheight = 32;

    this.parent(x, y, settings);

    this.setHealth(3);
    this.setPower(3);

    this.addAnimation('move', [3, 4]);
    this.addAnimation('spin', [0, 1, 2]);

    this.setCurrentAnimation('move');

    this.setVelocity(2.5, 0);
    this.rightExposed = this.rideLeft;
  },

  onTurn: function(fromLeft) {
    this.setVelocity(0.2, 0);
    this.setCurrentAnimation('spin', function() {
      this.rightExposed = !fromLeft;
      this.setVelocity(2.5, 0);
      this.setCurrentAnimation('move');
    });
  },

  checkDeflect: function(res, bullet) {
    return (
      (this.rightExposed && res.x > 0) ||
      (!this.rightExposed && res.x < 0)
    );
  }
});

var RobotCar = SweepingEnemy.extend({
  init: function(x, y, settings) {
    settings.image = "robo_car";
    settings.spritewidth = 32;

    this.parent(x, y, settings, 3, 2);

    this.addAnimation('move', [0, 1]);
    this.addAnimation('spin', [3, 2]);

    this.setCurrentAnimation('move');

    this.setVelocity(1.5, 0);
  }
});

var ShieldBot = MegaEnemy.extend({
  init: function(x, y, settings) {
    settings.image = 'shield_bot';
    settings.spritewidth = 25;
    settings.spriteheight = 24;

    this.parent(x, y, settings, 3, 4);

    this.addAnimation('stand', [1]);
    this.addAnimation('fire', [0]);

    this.setCurrentAnimation('stand');

    this.faceLeft = true;

    this.firing = false;

    this.fireDowntime = this.animationspeed * 20;
    this.atRest = this.fireDowntime;

    this.fireInterval = this.animationspeed * 4.5;
    this.fireCounter = this.fireInterval / 2;
    this.fireMax = 3;

    this.shotsFired = 0;
  },

  fire: function() {
    var adjust = this.faceLeft ? 0 : 22;
    me.game.add(new EnemyBullet(this.pos.x + adjust, this.pos.y + 2, this.faceLeft), this.z);
    me.game.sort();
    me.audio.play('enemy_shoot');
  },

  checkDeflect: function(res, bullet) {
    return (
      !this.firing && (
        (this.faceLeft && res.x > 0) ||
        (!this.faceLeft && res.x < 0)
      )
    );
  },

  update: function() {
    if (!this.visible) {
      return false;
    }

    if (!this.firing) {
      this.atRest --;
    }

    this.flipX(this.faceLeft);
    this.updateMovement();

    if (this.atRest <= 0) {
      this.firing = true;
      this.setCurrentAnimation('fire');
      this.atRest = this.fireDowntime;
      var player = me.game.getEntityByName('mainPlayer');
      if (player.length >= 1) {
        this.faceLeft = player[0].pos.x < this.pos.x;
      }
    }

    if (this.firing) {
      if (this.shotsFired < this.fireMax) {
        this.fireCounter --;
        if (this.fireCounter <= 0) {
          this.fire();
          this.shotsFired ++;
          this.fireCounter = this.fireInterval;
        }
      } else {
        this.firing = false;
        this.shotsFired = 0;
        this.fireCounter = this.fireInterval / 2;
        this.setCurrentAnimation('stand');
      }
    }

    this.parent(this);
    return true;
  }
});

var MechBot = MegaEnemy.extend({
  init: function(x, y, settings) {
    settings.image = "mech_bot";
    settings.spritewidth = 46;
    settings.spriteheight = 62;

    this.parent(x, y, settings);
    this.setPower(6);
    this.setHealth(7);

    this.faceLeft = true;

    this.addAnimation('resting', [0]);
    this.addAnimation('jumping', [2]);
    this.addAnimation('preparing', [1]);

    this.setCurrentAnimation('resting');

    this.setVelocity(2.5, 9);
    this.gravity = 0.5;

    this.jumpInterval = this.animationspeed * 13;
    this.jumpCounter = this.jumpInterval;
  },

  fire: function(player) {
    var adjust = this.faceLeft ? 0 : 30;
    var bullet = new EnemyBullet(
      this.pos.x + adjust,
      this.pos.y + 5,
      this.faceLeft
    );

    var distance = player.pos.distance(bullet.pos);

    if (player.pos.y != bullet.pos.y) {
      bullet.setVelocity(4, player.pos.y / distance);
    }

    me.game.add(bullet, this.z);
    me.game.sort();
    me.audio.play('enemy_shoot');
  },

  // Mech bot never drops an item
  checkDrop: function() {
    return false;
  },

  doDeath: function() {
    this.parent();

    var player = me.game.getEntityByName('mainPlayer')[0];
    var minion = new ShieldBot(this.pos.x, this.pos.y, {});

    minion.faceLeft = player.pos.x < minion.pos.x;

    me.game.add(minion, this.z);
    me.game.sort();
  },

  update: function() {
    if (!this.visible) {
      return false;
    }

    this.updateMovement();
    this.parent(this);


    if (this.jumping || this.falling) {
      this.setCurrentAnimation('jumping');
      this.doWalk(this.faceLeft);

      var offset = this.faceLeft ? 0 : 16;
      this.updateColRect(offset, 30, 0, 62);
    } else {
      this.vel.x = 0;
      this.setCurrentAnimation('resting');

      var offset = this.faceLeft ? 0 : 8;
      this.updateColRect(offset, 36, 12, 50);
    }

    if (this.vel.x == 0 && this.vel.y == 0) {
      this.jumpCounter --;

      if (this.jumpCounter <= 0) {
        this.setCurrentAnimation('preparing', function() {
          var player = me.game.getEntityByName('mainPlayer');

          if (player.length >= 1) {
            this.faceLeft = player[0].pos.x < this.pos.x;
            this.fire(player[0]);
          }

          this.jumpCounter = this.jumpInterval;
          this.doJump();
        });
      }
    }

    return true;
  }
});

var MegaBoss = MegaEnemy.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings, 5, 28);

    this.setVelocity(0, 10);
    this.gravity = 0.50;

    this.faceLeft = true;

    this.healthBar = new BossHealth(24, 16);
    this.healthBar.value = 0;
    me.game.HUD.addItem('gooseHealth', this.healthBar);
    me.game.sort();

    this.readyLanded = false;
    this.ready = false;

    this.fillingBar = false;
    this.filledBar = false;

    this.fillDelay = 3;

    this.urgent = false;
    this.urgentHealth = this.health * 0.25;
  },

  doReadyLanded: function(ready, onComplete) {
    this.readyLanded = true;
    this.setCurrentAnimation('ready-landed', function() {
      this.setCurrentAnimation('get-ready', function() {
        this.fillingBar = ready;
        this.setCurrentAnimation('ready', onComplete);
      });
    });
  },

  doReady: function() {
    me.input.bindKey(me.input.KEY.A, 'left');
    me.input.bindKey(me.input.KEY.D, 'right');
    me.input.bindKey(me.input.KEY.J, 'fire', true);
    me.input.bindKey(me.input.KEY.K, 'jump', true);

    this.ready = true;
  },

  doFillBar: function() {
    this.fillDelay --;
    if (this.fillDelay <= 0) {
      me.game.HUD.updateItemValue('gooseHealth', 1);
      this.fillDelay = 3;
      me.audio.play('one_health');
    }

    if (me.game.HUD.getItemValue('gooseHealth') == this.health) {
      this.filledBar = true;
      this.fillingBar = false;
    }
  },

  doDeath: function() {
    me.audio.stopTrack();
    me.game.remove(this);

    new ExplosionFactory(this);

    // Stop
    me.input.unbindKey(me.input.KEY.A);
    me.input.unbindKey(me.input.KEY.D);
    me.input.unbindKey(me.input.KEY.J);
    me.input.unbindKey(me.input.KEY.K);

    var afterDeath = function() {
      me.audio.play('beat_boss', false, this.onDeath.bind(this));
    };

    me.audio.play('death', false, afterDeath.bind(this));
  },

  onCollision: function(res, obj) {
    var prev = this.health;

    this.parent(res, obj);

    if (prev != this.health) {
      me.game.add(new CharacterHit(this), this.z + 1);
      me.game.sort();

      me.game.HUD.setItemValue('gooseHealth', this.health);

      this.urgent = this.health <= this.urgentHealth;
    }
  },

  doSpecialAction: function(res) {
    return true;
  },

  onDeath: function() {
    var player = this.locatePlayer();
    player.doLeave();
  },

  doPreReady: function() {
  },

  update: function() {
    this.flipX(this.faceLeft);

    var res = this.updateMovement();

    this.parent(this);

    if (!this.ready) {
      // Landed
      if (!this.readyLanded && this.vel.y == 0) {
        this.doReadyLanded(true);
      } else if (this.fillingBar) {
        this.doFillBar();
      } else if (this.filledBar) {
        this.doReady();
      } else {
        this.doPreReady();
      }
      return true;
    }

    return this.doSpecialAction(res);
  }
});

var CazStory = Dialogs.extend({
  init: function() {
    this.parent(
    [
      [
        "CAZBOT:",
        "LOGIN REQUIRED",
        "USERNAME:",
        "PASSWORD:"
      ],
      [
        "ADAMZAP:",
        "THE CAZBOT...",
        "USERNAME: AZAPLE1",
        "PASSWORD: *******"
      ],
      [
        "CAZBOT:",
        "YOUR USERNAME",
        "HAS BEEN REMOVED.",
        "PREPARE FOR..."
      ],
      [
        " ",
        "EXTERMINATION.",
        " ",
        " "
      ],
      [
        "ADAMZAP:",
        "HAHAHA! AT LEAST",
        "LSU IS QUICK",
        "WITH ONE THING!"
      ]
    ]);
  }
});

var GooseStory = Dialogs.extend({
  init: function() {
    this.parent([
      [
        "GOOSEMAN:",
        "SO YOU HAVE",
        "RETURNED, AZAPLE1!?",
        " "
      ],
      [
        " ",
        "THIS IS GREAT...",
        "A MOODLE REQUEST",
        "JUST CAME IN..."
      ],
      [
        "ADAMZAP",
        "STOP RIGHT THERE,",
        "GOOSEMAN!",
        " "
      ],
      [
        " ",
        "I ONLY RETURNED",
        "TO FREE PCALI1!",
        "RELEASE HIM NOW!"
      ],
      [
        "GOOSEMAN:",
        "I SEE I MUST RESORT",
        "TO VIOLENCE TO GET",
        "MY WAY."
      ],
      [
        "ADAMZAP:",
        "LET'S END THIS NOW!",
        " ",
        " "
      ]
    ]);
  }
});

var Cazbot = MegaBoss.extend({
  init: function(x, y, settings) {
    settings.image = 'cazbot';
    settings.spriteheight = 35;
    settings.spritewidth = 34;

    this.parent(x, y, settings);

    this.setVelocity(2, 10);

    this.addAnimation('stand', [8]);
    this.addAnimation('ready-landed', [8, 7, 6, 6, 6, 7, 8]);
    this.addAnimation('get-ready', [2, 1]);
    this.addAnimation('ready', [1]);
    this.addAnimation('jump', [2]);
    this.addAnimation('shoot', [0]);
    this.addAnimation('run', [3, 4, 5, 4]);

    this.addAnimation('pump', [2, 1, 2, 1]);

    this.setCurrentAnimation('jump');

    this.jumpInterval = this.animationspeed * 20;
    this.jumpCounter = this.jumpInterval;

    this.shootInterval = this.jumpInterval * 3;
    this.shootCounter = this.shootInterval;

    this.shooting = false;
    this.startingJump = false;
    this.shootCoolDown = false;

    this.shootMax = 3;
    this.shotsFired = 0;

    this.urgentInterval = 3;
    this.urgentRounds = 0;
  },

  doReadyLanded: function(ready) {
    this.storyTelling = me.gamestat.getItemValue('cazbot_event');
    if (this.storyTelling) {
      this.dialog = new CazStory(this);
      me.game.add(this.dialog, this.z);
      me.game.sort();
    } else {
      me.audio.playTrack('boss_music');
    }

    this.parent(!this.storyTelling);
  },

  doPreReady: function() {
    if (this.storyTelling) {
      if (this.dialog.completed) {
        me.gamestat.setValue('cazbot_event', false);
        this.readyLanded = false;
      }
    }
  },

  checkDeflect: function(res, bullet) {
    return !this.isCurrentAnimation('shoot') && (
      this.faceLeft && res.x > 0 ||
      !this.faceLeft && res.x < 0
    );
  },

  doDeath: function() {
    var enemyBullets = me.game.getEntityByName('EnemyBullet');

    for (var i = 0; i < enemyBullets.length; i ++) {
      if (enemyBullets[i].alive) {
        me.game.remove(enemyBullets[i]);
      }
    }

    this.parent();
  },

  doFire: function() {

    this.setCurrentAnimation('shoot', function() {
      if (this.shotsFired == this.shootMax) {
        this.shooting = false;
        this.shotsFired = 0;

        this.shootCoolDown = true;
        this.setCurrentAnimation('get-ready', function() {
          this.shootCoolDown = false;
          if (this.urgent) {
            this.urgentRounds ++;
            if (this.urgentRounds == this.urgentInterval) {
              this.urgentRounds = 0;
            } else {
              this.shooting = true;
              this.faceLeft = this.mainPlayer && this.mainPlayer.pos.x < this.pos.x;
              this.doFire();
            }
          }
        });
      } else {
        var adjust = this.faceLeft ? 0 : 32;
        var bullet = new EnemyBullet(this.pos.x + adjust, this.pos.y + 3, this.faceLeft);
        me.game.add(bullet, this.z);
        me.game.sort();

        me.audio.play('enemy_shoot');
        this.shotsFired ++;
      }
    });
  },

  doJump: function() {
    var otherJump = this.parent.bind(this);

    this.startingJump = true;
    this.setCurrentAnimation('get-ready', function() {
      this.startingJump = false;
      this.setCurrentAnimation('jump');
      otherJump();
    });
  },

  onDeath: function() {
    this.doReady();

    me.game.HUD.removeItem('gooseHealth');

    me.game.collisionMap.clearTile(15, 10);
    me.game.collisionMap.clearTile(15, 11);
    me.game.collisionMap.clearTile(15, 12);

    var foreground = me.game.currentLevel.getLayerByName('foreground');
    foreground.clearTile(15, 10);
    foreground.clearTile(15, 11);
    foreground.clearTile(15, 12);

    me.audio.play('one_health');
  },

  doSpecialAction: function(res) {

    if (res.x < 0 && this.faceLeft) {
      this.faceLeft = false;
    } else if (res.x > 0 && !this.faceLeft) {
      this.faceLeft = true;
    }

    if (this.startingJump) {
      this.vel.x = 0;
      return true;
    }

    if (this.shootCoolDown) {
      this.vel.x = 0;

      return true;
    }

    if (!this.shooting) {
      this.doWalk(this.faceLeft);
      if (this.vel.y == 0 &&
        !(this.jumping || this.falling) &&
        !this.isCurrentAnimation('run')) {
        this.setCurrentAnimation('run');
        this.updateColRect(0, 30, 2, 33);
      }
    } else {
      this.vel.x = 0;

      if (!(this.jumping || this.falling) && this.vel.y == 0 && this.shotsFired == 0) {
        this.doFire();
      }

      return false;
    }

    this.jumpCounter --;
    if (this.jumpCounter <= 0) {
      this.jumpCounter = this.jumpInterval;
      this.doJump();
    }

    this.shootCounter --;
    if (this.shootCounter <= 0) {
      this.shootCounter = this.shootInterval;
      this.mainPlayer = this.locatePlayer();

      if (this.mainPlayer) {
        this.faceLeft = this.mainPlayer.pos.x < this.pos.x;
        this.shooting = true;
      }
    }

    return true;
  }
});

var Gooseman = MegaBoss.extend({
  init: function(x, y, settings) {
    settings.image = 'gooseman';
    settings.spriteheight = 32;
    settings.spritewidth = 36;

    this.parent(x, y, settings);

    this.addAnimation('stand', [0]);
    this.addAnimation('squat', [1]);
    this.addAnimation('jump', [2]);
    this.addAnimation('ready-landed', [3, 4, 3, 4]);

    this.addAnimation('get-ready', [6]);
    this.addAnimation('ready', [5]);

    this.addAnimation('rage', [3, 4, 5]);

    this.setCurrentAnimation('jump');

    this.performing = false;
    this.performingState = 'homing';
    this.storyTelling = false;
    this.dialog = null;

    this.currentBomb = null;
  },

  doReadyLanded: function(ready) {
    this.storyTelling = me.gamestat.getItemValue('goose_event');
    if (this.storyTelling) {
      this.dialog = new GooseStory(this);
      me.game.add(this.dialog, this.z);
      me.game.sort();
    } else {
      me.audio.playTrack('boss_music');
    }

    this.parent(!this.storyTelling);
  },

  doPreReady: function() {
    if (this.storyTelling) {
      if (this.dialog.completed) {
        me.gamestat.setValue('goose_event', false);
        this.readyLanded = false;
      }
    }
  },

  checkPerformingState: function() {
    if (this.performingState == 'homing') {
      return (
        this.isCurrentAnimation('ready') ||
        (this.jumping || this.falling)
      );
    } else if (this.performingState == 'fbomb') {
      return this.currentBomb.alive;
    }
  },

  doHomingJump: function(player) {
    this.performing = true;
    this.performingState = 'homing';

    var distance = player.pos.distance(this.pos);

    this.setCurrentAnimation('ready', function() {
      if (player.pos.x != this.pos.x) {
        var mult = this.faceLeft ? -1 : 1;
        this.setVelocity((distance / (me.sys.fps * 0.75)) + (player.vel.x * mult), 10);
      } else {
        this.setVelocity(0, 10);
      }

      if (this.urgent) {
        var bomb = new FBomb(this.pos.x, this.pos.y, this.faceLeft, true);
        bomb.setVelocity(this.vel.x * -1, 10);
        bomb.vel.y -= 10;

        me.game.add(bomb, this.z);
        me.game.sort();
      }

      this.doJump();
    });
  },

  doFBomb: function(player) {
    this.performing = true;
    this.performingState = 'fbomb';

    var adjust = this.faceLeft ? 0 : 32;

    this.currentBomb = new FBomb(
      this.pos.x + adjust,
      this.pos.y + 5,
      this.faceLeft,
      false
    );

    this.addedBomb = false;

    this.setCurrentAnimation('rage', function() {
      this.setCurrentAnimation('get-ready', function() {
        if (this.addedBomb) {
          return;
        }

        if (this.urgent) {
          var bomb = new FBomb(this.pos.x, this.pos.y, !this.faceLeft, true);
          bomb.vel.y -= 5;
          me.game.add(bomb, this.z);
        }
        me.game.add(this.currentBomb, this.z);
        me.game.sort();
        this.addedBomb = true;
      });
    });
  },

  doSpecialAction: function(res) {
    if (this.performing) {
      this.performing = this.checkPerformingState();
    }

    if (this.falling || this.jumping) {
      this.setCurrentAnimation('jump');
      this.updateColRect(3, 30, 5, 27);
      this.doWalk(this.faceLeft);
    } else if (!this.performing) {
      this.vel.x = 0;
      this.setCurrentAnimation('stand');
      this.updateColRect(3, 30, 1, 31);
    }

    if (!this.performing) {
      if (!this.mainPlayer) {
        this.mainPlayer = this.locatePlayer();
      }

      if (this.mainPlayer.alive) {
        this.faceLeft = this.mainPlayer.pos.x < this.pos.x;

        if (this.performingState == 'homing') {
          this.doFBomb(this.mainPlayer);
        } else {
          this.doHomingJump(this.mainPlayer);
        }
      }
    }

    return true;
  }
});
