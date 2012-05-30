var Spring = me.ObjectEntity.extend({
  init: function(x, y, settings) {
    settings.image = "spring";
    settings.spritewidth = 13;
    settings.spriteheight = 17;

    this.parent(x, y, settings);

    this.updateColRect(0, 13, 13, 4);

    this.addAnimation('resting', [3]);
    this.addAnimation('spring', [0, 1, 2]);

    this.setCurrentAnimation('resting');

    this.springing = false;
    this.collidable = true;
  },

  onCollision: function(res, player) {
    if (player instanceof PlayerEntity) {
      this.doSpring(player);
    }
  },

  doSpring: function(player) {
    this.springing = true;
    player.doSpring();

    this.setCurrentAnimation('spring', function() {
      this.springing = false;
      this.setCurrentAnimation('resting');
    });
  },

  update: function() {
    if (!me.game.viewport.isVisible(this)) {
      return false;
    }

    this.parent(this);

    if (this.springing) {
      return true;
    }

    return false;
  }
});

var Platform = me.ObjectEntity.extend({
  init: function(x, y, settings) {
    settings.image = 'vanishing_platform';
    settings.spritewidth = 16;
    settings.spriteheight = 24;

    this.parent(x, y + 8, settings);

    this.tileX = Math.ceil(x) / 16;
    this.tileY = Math.ceil(y) / 16;

    this.seqName = settings.sequence;
    this.seqNumber = settings.number;

    this.updateColRect(0, 0, 16, 16);

    var layerX = Math.ceil(this.tileX * 16);
    var layerY = Math.ceil(this.tileY * 16);

    this.solidType = me.game.collisionMap.getTileId(layerX, layerY);

    me.game.collisionMap.clearTile(this.tileX, this.tileY);
    me.game.collisionMap.clearTile(this.tileX + 1, this.tileY);

    this.addAnimation('starting', [0]);
    this.addAnimation('resting', [5]);

    this.addAnimation('appearing', [1, 2, 3, 4]);
    this.vanished = true;

    this.vanishDelay = this.animationspeed * 20;
    this.vanishCounter = this.vanishDelay;

    this.currentNumber = 0;
    this.maxNumber = 0;

    this.vanishing = false;
    this.appearing = false;

    this.siblings = [];
  },

  doAppear: function() {
    this.vanished = false;
    this.appearing = true;
    this.setCurrentAnimation('starting', function() {
      this.appearing = false;

      me.game.collisionMap.setTile(this.tileX, this.tileY, this.solidType);
      me.game.collisionMap.setTile(this.tileX + 1, this.tileY, this.solidType);
      this.setCurrentAnimation('appearing', 'resting');
    });
  },

  doVanish: function() {
    this.vanishCounter = this.vanishDelay;
    var index = this.currentNumber;
    for (var i = 0; i < this.siblings.length; i ++) {
      this.siblings[i].onNumber(index);
    }

    this.vanishing = true;
    this.setCurrentAnimation('starting', function() {
      this.vanishing = false;
      this.vanished = true;
      me.game.collisionMap.clearTile(this.tileX, this.tileY);
      me.game.collisionMap.clearTile(this.tileX + 1, this.tileY);
    });
  },

  onNumber: function(index) {
    this.currentNumber = index == this.maxNumber ? 0 : index + 1;
  },

  draw: function(context) {
    if (this.vanished) {
      return;
    }

    this.parent(context);
  },

  update: function() {
    if (this.siblings.length == 0) {
      var platforms = me.game.getEntityByName('Platform');

      for (var i = 0; i < platforms.length; i ++) {
        if (platforms[i].seqName == this.seqName) {
          this.maxNumber = Math.max(this.maxNumber, platforms[i].seqNumber);
          this.siblings.push(platforms[i]);
        }
      }
    }

    if (!me.game.viewport.isVisible(this)) {
      return false;
    }

    if (this.vanishing || this.appearing) {
      this.parent(this);
    }

    if (this.currentNumber != this.seqNumber) {
      return true;
    }

    if (this.vanished) {
      this.doAppear();
    }

    this.vanishCounter --;
    if (this.vanishCounter <= 0 && !this.vanished) {
      this.doVanish();
    }

    return true;
  }
});

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

var BossHealth = HealthBar.extend({
  init: function(x, y) {
    this.parent(x, y);
    this.one = me.loader.getImage("one_goose_health");
  },

  draw: function(context, x, y) {
    this.parent(context, x + 16, y);
  }
});

var CharacterHit = me.ObjectEntity.extend({
  init: function(target) {
    var settings = {
      image: "hit",
      spritewidth: 24
    };

    this.parent(target.pos.x + 5, target.pos.y + 5, settings);
    this.presence = 10;
    this.target = target;
    this.setVelocity(0, 0);
    this.flicker(this.presence);
  },

  update: function() {
    this.pos.set(this.target.pos.x + 5, this.target.pos.y + 5);
    this.parent(this);

    this.presence --;
    if (this.presence <= 0) {
      me.game.remove(this);
    }

    return true;
  }
});

var CharacterExplosion = me.ObjectEntity.extend({
  init: function(x, y, vx, vy) {
    var settings = {
      image: "enemy_die",
      spritewidth: 16
    };

    this.parent(x, y, settings);
    this.setVelocity(2.0, 2.0);
    this.gravity = 0;

    this.vel.x += vy == 1 || vy == -1 ? vx * 0.75 : vx;
    this.vel.y += vx == 1 || vx == -1 ? vy * 0.75 : vy;
  },

  update: function() {
    if (!this.visible) {
      me.game.remove(this);
      return false;
    }

    this.computeVelocity(this.vel);
    this.pos.add(this.vel);

    this.parent(this);

    return true;
  }
});

var ExplosionFactory = Object.extend({
  init: function(obj) {
    var values = [0, -1, 1];
    for (var i = 0; i < values.length; i ++) {
      for (var j = 0; j < values.length; j ++) {
        if (!(i == 0 && j == 0)) {
          me.game.add(new CharacterExplosion(
            obj.pos.x, obj.pos.y, values[i], values[j]), obj.z
          );
        }
      }
    }
    me.game.add(new CharacterExplosion(obj.pos.x, obj.pos.y, 0.4, 0), obj.z);
    me.game.add(new CharacterExplosion(obj.pos.x, obj.pos.y, -0.4, 0), obj.z);
    me.game.add(new CharacterExplosion(obj.pos.x, obj.pos.y, 0, 0.4), obj.z);
    me.game.add(new CharacterExplosion(obj.pos.x, obj.pos.y, 0, -0.4), obj.z);

    me.game.sort();
  }
});

var Transition = me.LevelEntity.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);
  },

  onPlayerHit: function(player) {
    this.goTo();
  },

  onCollision: function(res, obj) {
    if (obj instanceof PlayerEntity) {
      this.onPlayerHit(obj);
    }
  }
});

var BossDoor = Transition.extend({
  onPlayerHit: function(player) {
    // Initially lock player controls
    me.input.unbindKey(me.input.KEY.A);
    me.input.unbindKey(me.input.KEY.D);
    me.input.unbindKey(me.input.KEY.J);
    me.input.unbindKey(me.input.KEY.K);

    this.parent(player);

    var userAgent = me.sys.ua;

    if (!(userAgent.match(/mac/) && userAgent.match(/chrome/))) {
      me.audio.playTrack('boss_music');
    }
  }
});

var Checkpoint = Transition.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);
    this.checkpoint = settings.checkpoint;
  },

  onPlayerHit: function(player) {
    var checkpoint = this.checkpoint || (this.nextlevel + "_checkpoint");
    me.gamestat.setValue('checkpoint', checkpoint);
    this.parent(player);
  }
});

var Bullet = me.ObjectEntity.extend({
  init: function(x, y, left) {
    var settings = {
      name: "bullet",
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

var DeflectedBullet = me.ObjectEntity.extend({
  init: function(x, y, left) {
    var settings = {
      name: "bullet",
      image: "other_bullet",
      spritewidth: 8
    }

    this.parent(x, y, settings);
    this.flyLeft = left;
    this.setVelocity(6, 7);
    this.vel.y = -10;

    this.gravity = null;

    this.type = me.game.ACTION_OBJECT;
  },

  update: function() {
    this.doWalk(this.flyLeft);

    this.computeVelocity(this.vel);
    this.pos.add(this.vel);

    if (!me.game.viewport.isVisible(this)) {
      me.game.remove(this);
      return false;
    }

    return true;
  }
});
