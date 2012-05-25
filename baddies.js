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

  performDeflect: function(res, bullet) {
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

  onCollision: function(res, obj) {
    if (obj instanceof Bullet) {
      me.game.remove(obj);

      // Can this enemy deflect bullets?
      if (this.checkDeflect(res, obj)) {
        this.performDeflect(res, obj);
      } else {
        this.health --;

        if (this.health <= 0) {
          var cur = this.pos;

          me.game.add(new EnemyExplosion(cur.x + 10, cur.y + 5), this.z);
          me.game.sort();

          me.game.remove(this);
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
  },

  onTurn: function(fromLeft) {
    this.setVelocity(0.2, 0);
    this.setCurrentAnimation('spin', function() {
      this.setVelocity(2.5, 0);
      this.setCurrentAnimation('move');
    });
  },

  checkDeflect: function(res, bullet) {
    return (
      (this.rideLeft && res.x > 0) ||
      (!this.rideLeft && res.x < 0)
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
    this.flipX(this.faceLeft);

    this.firing = false;

    this.fireDowntime = this.animationspeed * 20;
    this.atRest = this.fireDowntime;

    this.fireInterval = this.animationspeed * 4;
    this.fireCounter = this.fireInterval;
    this.fireMax = 3;

    this.shotsFired = 0;
  },

  fire: function() {
    var adjust = this.faceLeft ? 0 : 22;
    me.game.add(new EnemyBullet(this.pos.x - adjust, this.pos.y + 2, this.faceLeft), this.z);
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

    this.updateMovement();

    me.game.collide(this);

    if (this.atRest <= 0) {
      this.firing = true;
      this.setCurrentAnimation('fire');
      this.atRest = this.fireDowntime;
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
        this.setCurrentAnimation('stand');
      }
    }

    this.parent(this);
    return true;
  }
});
