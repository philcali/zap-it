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
  },

  setHealth: function(health) {
    this.health = health;
  },

  checkDeflect: function(res, obj) {
    return false;
  },

  checkDrop: function() {
    var chances = Math.random();
    if (chances > 0.75) {
      return false;
    }

    if (chances >= 0 && chances < 0.40) {
      return me.game.HUD.getItemValue('playerHealth') < 28;
    }
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
  },

  performDrop: function() {
    var chances = Math.random(),
      x = this.pos.x,
      y = this.pos.y,
      drop = chances < 0.60 ?
        new SmallEnergy(x, y, false) :
        new LargeEnergy(x, y, false);

    me.game.add(drop, this.z);
  },

  doDeath: function() {
    this.alive = false;

    var cur = this.pos;

    me.game.add(new EnemyExplosion(cur.x + 10, cur.y + 5), this.z);

    if (this.checkDrop()) {
      this.performDrop();
    }
    me.game.sort();

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
          this.flicker(3);
        }
      }
    }
  }
});

var EnemyBullet = Baddy.extend({
  init: function(x, y, left) {
    var settings = {
      image: "other_bullet",
      spritewidth: 8
    };

    this.parent(x, y, settings, 3);

    this.flyLeft = left;
    this.setVelocity(3, 0);
  },

  onCollision: function(res, obj) {
    if (obj instanceof PlayerEntity) {
      me.game.remove(this);
    }
  },

  update: function() {
    this.doWalk(this.flyLeft);

    this.computeVelocity(this.vel);
    this.pos.add(this.vel);

    me.game.collide(this);

    if (!me.game.viewport.isVisible(this)) {
      me.game.remove(this);
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

    var player = me.game.getEntityByName('mainPlayer');

    if (player.length == 0) {
      this.parent(this);
      return false;
    }

    if (!this.gatheredFocus) {
      if (this.distanceTo(player[0]) <= this.lineOfSight) {
        this.gatheredFocus = true;
        this.onFocus();
      } else {
        return false;
      }
    }

    this.doMoveTowards(player[0]);

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

var SpawnPoint = me.InvisibleEntity.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);

    this.liveEnemies = 3;
    this.fireInterval = this.animationspeed * 10;
    this.fireCounter = this.fireInterval;
  },

  spawn: function() {
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

      if (spinners < this.liveEnemies) {
        this.spawn();
      }
      this.fireCounter = this.fireInterval;
    }
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

    me.game.collide(this);

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
