
var HealthBar = me.HUD_Item.extend({
  init: function(x, y) {
    this.parent(x, y);

    this.value = 28;

    this.meter = me.loader.getImage("health_bar");
    this.one = me.loader.getImage("one_health");
  },

  draw: function(context, x, y) {
    context.drawImage(this.meter, x, y);
    for (var i = this.value; i > 0; i --) {
      context.drawImage(this.one, x + 1, y + 56 - (i * 2));
    }
  }
});

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

var Transition = me.InvisibleEntity.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);
  },

  onCollision: function(res, obj) {
    if (obj instanceof PlayerEntity) {
      var cur = me.game.viewport.pos;
      me.game.viewport.move(cur.x + me.game.viewport.getWidth() + 16, cur.y);
      obj.pos.set(obj.pos.x + 44, obj.pos.y);
      
      me.game.remove(this);
    }
  }
});

var Bullet = me.ObjectEntity.extend({
  init: function(x, y, left) {
    var settings = {
      image: "bullet",
      spritewidth: 8,
      spriteheight: 6
    };

    this.parent(x, y, settings);

    this.flyLeft = left;
    this.setVelocity(5, 0);
    this.collidable = true;

    this.type = me.game.ACTION_OBJECT;
  },

  update: function() {
    this.doWalk(this.flyLeft);

    this.updateMovement();

    me.game.collide(this);

    if (this.vel.x == 0 || !me.game.viewport.isVisible(this)) {
      me.game.remove(this);
      return false;
    }

    return true;
  }
});

var PlayerEntity = me.ObjectEntity.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);

    this.addAnimation('walk', [3, 4, 5, 6]);

    // slightest inching
    this.addAnimation('inch', [2]);

    // includes blink
    this.addAnimation('stand', [0, 0, 0, 0, 1, 0, 0, 0, 0]);
    this.addAnimation('jump', [7]);

    // firing animations
    this.addAnimation('jump-shot', [8]);
    this.addAnimation('stand-shot', [9]);
    this.addAnimation('walk-shot', [10, 11, 12, 13]);

    this.addAnimation('slide', [14]);

    this.addAnimation('damaged', [15, 16, 15]);

    // Adjust gravity and velocity for jump height and speed
    this.setVelocity(1.6, 7);
    this.animationspeed = me.sys.fps / 9;
    this.gravity = 0.45;

    this.internalWalkFrame = 5;

    // Ensure ready to fire when game loads
    // TODO: make this better
    this.fireDelay = Math.round(this.animationspeed * 2);
    this.fireCounter = 0;

    this.faceLeft = false;

    this.damageDelay = this.fireDelay;
    this.damageCounter = 0;
    this.damaged = false;

    this.health = 28;

    // TODO: use this on big transitions
    //me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
  },

  doDamage: function(value) {
    this.damaged = true;
    this.vel.x = this.vel.x * -0.75;

    this.health -= value;
    me.game.HUD.updateItemValue("playerHealth", value * -1);

    if (this.health <= 0) {
      this.doDeath();
    }

    // Knock him down! 
    if (this.vel.y > 0 && !this.falling) {
      this.vel.y = this.vel.y * -1;
    }

    this.flicker(40);
    this.setCurrentAnimation('damaged');
    this.damageCounter = this.damageDelay;
  },

  fire: function() {
    var adjust = this.faceLeft ? 0 : 22;
    me.game.add(
      new Bullet(this.pos.x + adjust, this.pos.y + 4, this.faceLeft),
      this.z
    );
    me.game.sort();
    this.fireCounter = this.fireDelay;
  },

  stride: function(left) {
    this.faceLeft = left;
    this.doWalk(this.faceLeft);
    if (this.isCurrentAnimation('stand')) {
      this.setCurrentAnimation('walk');
    }
  },

  doDeath: function() {
    me.game.removeAll();
    // TODO: really do a game over screen
    jsApp.loaded();
  },

  update: function() {
    if (this.damaged) {
      this.updateMovement();
      this.parent(this);
      this.damageCounter --;

      if (this.damageCounter <= 0) {
        this.damaged = false;
      }
      return true;
    }

    var firing = me.input.isKeyPressed('fire');

    if (firing && this.fireCounter == 0) this.fire();

    if (me.input.isKeyPressed('left')) {
      this.stride(true);
    } else if (me.input.isKeyPressed('right')) {
      this.stride(false);
    } else {
      this.vel.x = 0;
      firing ?
        this.setCurrentAnimation('stand-shot') :
        this.setCurrentAnimation('stand');
    }

    if (firing && this.vel.x != 0) {
      this.setCurrentAnimation('walk-shot');
    } else if (firing) {
      this.setCurrentAnimation('stand-shot');
    } else if (!firing && this.vel.x != 0 && (
      this.isCurrentAnimation('walk-shot') ||
      this.isCurrentAnimation('stand-shot'))) {

      this.setCurrentAnimation('walk');
      this.setAnimationFrame(this.internalWalkFrame);
    }

    if (me.input.isKeyPressed('jump')) {
      this.doJump();
    }

    if (this.falling || this.jumping) {
      this.updateColRect(2, 22, 0, 30);
      firing ?
        this.setCurrentAnimation('jump-shot') :
        this.setCurrentAnimation('jump');
    } else {
      this.updateColRect(2, 22, 6, 24);
    }

    this.updateMovement();

    this.parent(this);

    var res = me.game.collide(this);

    if (res) {
      if (!this.isFlickering() && res.obj.type == me.game.ENEMY_OBJECT) {
        this.doDamage(res.obj.power);
      }
    }

    if (this.vel.y == 0 && (
        this.isCurrentAnimation('jump') ||
        this.isCurrentAnimation('jump-shot')
       )) {
      this.setCurrentAnimation('stand');
    }

    if (this.fireCounter > 0) {
      this.fireCounter -= 1;
    }

    // Fall death
    if (!me.game.viewport.isVisible(this)) {
      this.doDeath();
    }

    return true;
  }
});
