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

var RobotCar = me.ObjectEntity.extend({
  init: function(x, y, settings) {
    settings.image = "robo_car";
    settings.spritewidth = 32;

    this.parent(x, y, settings);

    this.addAnimation('move', [0, 1]);
    this.addAnimation('spin', [3, 2]);

    this.setCurrentAnimation('move');

    this.startX = x;
    this.endX = x + settings.width - settings.spritewidth;

    this.pos.x = this.endX;

    this.setVelocity(1.5, 0);
    this.rideLeft = true;
    this.collidable = true;

    this.health = 2;

    this.power = 3;

    this.type = me.game.ENEMY_OBJECT;
  },

  onCollision: function(res, obj) {
    if (obj instanceof Bullet) {
      this.health --;
      me.game.remove(obj);

      if (this.health <= 0) {
        var cur = this.pos;

        me.game.add(new EnemyExplosion(cur.x + 10, cur.y + 5), this.z);
        me.game.sort();

        me.game.remove(this);
      } else {
        this.flicker(3);
      }
    } 
  },

  update: function() {
    if (!this.visible) {
      return false;
    }

    if (this.alive) {
      if (this.rideLeft && this.pos.x <= this.startX) {
        this.rideLeft = false;
        if (this.isCurrentAnimation('move')) {
          this.setCurrentAnimation('spin', 'move');
        }
      } else if (!this.rideLeft && this.pos.x >= this.endX) {
        this.rideLeft = true;
        if (this.isCurrentAnimation('move')) {
          this.setCurrentAnimation('spin', 'move');
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
