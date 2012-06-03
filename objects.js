var Dialogs = me.ObjectEntity.extend({
  init: function(text, settings) {

    if (!settings) {
      settings = {
        x: 32,
        y: 120,
        letterDelay: 5,
        stageDelay: 35,
        lastSentence: text[0].length - 1,
        lastStage: text.length - 1
      };
    }

    this.parent(settings.x, settings.y, {
      image: "dialog_box",
      spritewidth: 184,
      spriteheight: 57
    });

    this.font = new me.BitmapFont('fontx8', 8);

    this.letterDelay = settings.letterDelay;
    this.stageDelay = settings.stageDelay;

    this.letterCounter = this.letterDelay;
    this.currentLetter = 0;
    this.currentStage = 0;
    this.currentSentence = 0;
    this.lastSentence = settings.lastSentence;
    this.lastStage = settings.lastStage;

    this.changingStage = false;
    this.stageCounter = this.stageDelay;
    this.completed = false;

    this.dialogs = text;

    me.input.bindKey(me.input.KEY.ENTER, 'pause', true);
  },

  onDestroyEvent: function() {
    this.font = null;
    me.input.unbindKey(me.input.KEY.ENTER);
  },

  draw: function(context) {
    this.parent(context);

    var text = this.dialogs[this.currentStage];

    for (var i = 0; i <= this.currentSentence; i ++) {
      var cap = i == this.currentSentence ?
        this.currentLetter : text[i].length - 1;
      for (var j = 0; j <= cap ; j ++) {
        this.font.draw(context, text[i][j],
          this.pos.x + 16 + (9 * j), this.pos.y + 8 + (11 * i));
      }
    }
  },

  update: function() {
    if (this.changingStage) {
      this.stageCounter --;
      if (this.stageCounter <= 0) {
        this.stageCounter = this.stageDelay;
        this.currentStage ++;
        this.currentSentence = 0;
        this.currentLetter = 0;
        if (this.currentStage > this.lastStage) {
          // Done
          this.currentStage = this.lastStage;
          this.completed = true;
        }
        this.changingStage = false;
      } else {
        return false;
      }
    }

    this.letterCounter --;
    if (this.letterCounter <= 0) {
      this.letterCounter = this.letterDelay;
      this.currentLetter++;
      var l = this.dialogs[this.currentStage][this.currentSentence].length;

      if (this.currentLetter == l) {
        this.currentSentence ++;
        this.currentLetter = 0;
      }

      if (this.currentSentence > this.lastSentence) {
        this.currentSentence = this.lastSentence;
        this.currentLetter = l - 1;
        this.changingStage = true;
      }

      return true;
    }

    if (me.input.isKeyPressed('pause')) {
      this.completed = true;
    }

    if (this.completed) {
      me.game.remove(this);
    }

    return false;
  }
});

var Splash = me.ObjectEntity.extend({
  init: function(x, y) {
    var settings = {
      image: 'splash',
      spritewidth: 32,
      spriteheight: 24
    };

    this.parent(x, y, settings);

    this.addAnimation('perform', [0, 1, 2]);
    this.setCurrentAnimation('perform', this.doSplash.bind(this));
    me.audio.play('splash');
  },

  doSplash: function() {
    me.game.remove(this);
  },

  update: function() {
    this.parent(this);
    return true;
  }
});

var WaterLine = me.InvisibleEntity.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);
    this.collidable = true;
  },

  onCollision: function(res, player) {
    if (player instanceof PlayerEntity) {
      var subValue = player.submerged;

      if (res.y > 0 && player.vel.y > 0 && !player.submerged) {
        player.doSubmerge();
      } else if (res.y < 0 && player.vel.y < 0 && player.submerged) {
        player.doEmerge();
      }

      if (subValue != player.submerged) {
        player.doSplash();
      }
    }
  }
});

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
      me.audio.play('spring');
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

    this.seqName = settings.sequence;
    this.seqNumber = settings.number;
    this.seqBumping = !settings.notBumping && true;

    this.updateColRect(0, 16, 0, 16);

    this.tile1 = me.game.collisionMap.getTile(this.pos.x, this.pos.y);
    this.tile2 = me.game.collisionMap.getTile(this.pos.x + 16, this.pos.y);

    me.game.collisionMap.clearTile(this.tile1.row, this.tile1.col);
    me.game.collisionMap.clearTile(this.tile2.row, this.tile2.col);

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

  onDestroyEvent: function() {
    me.game.collisionMap.layerData[this.tile1.row][this.tile1.col] = this.tile1;
    me.game.collisionMap.layerData[this.tile2.row][this.tile2.col] = this.tile2;
  },

  doAppear: function() {
    if (me.game.viewport.isVisible(this)) {
      me.audio.play('platform');
    }

    this.vanished = false;
    this.appearing = true;
    this.setCurrentAnimation('starting', function() {
      this.appearing = false;

      me.game.collisionMap.layerData[this.tile1.row][this.tile1.col] = this.tile1;
      me.game.collisionMap.layerData[this.tile2.row][this.tile2.col] = this.tile2;

      this.setCurrentAnimation('appearing', 'resting');
    });
  },

  doVanish: function() {
    this.vanishCounter = this.vanishDelay;

    if (this.seqBumping) {
      var index = this.currentNumber;
      for (var i = 0; i < this.siblings.length; i ++) {
        this.siblings[i].onNumber(index);
      }
    }

    this.vanishing = true;
    this.setCurrentAnimation('starting', function() {
      this.vanishing = false;
      this.vanished = true;

      me.game.collisionMap.clearTile(this.tile1.row, this.tile1.col);
      me.game.collisionMap.clearTile(this.tile2.row, this.tile2.col);
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

    if (this.vanishing || this.appearing) {
      this.parent(this);
    }

    if (this.currentNumber != this.seqNumber) {
      if (!this.seqBumping && !this.vanished) {
        this.doVanish();
      }
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
    this.music = settings.music;
  },

  onPlayerHit: function(player) {
    player.canFallDeath = false;

    if (this.music) {
      me.audio.stopTrack();
    }

    this.goTo();

    if (this.music) {
      me.audio.playTrack(this.music);
    }
  },

  onCollision: function(res, obj) {
    if (obj instanceof PlayerEntity) {
      this.onPlayerHit(obj);
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

var BossDoor = Transition.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);
    this.eventDoor = settings.eventDoor;
  },

  onPlayerHit: function(player) {
    // Initially lock player controls
    me.input.unbindKey(me.input.KEY.A);
    me.input.unbindKey(me.input.KEY.D);
    me.input.unbindKey(me.input.KEY.J);
    me.input.unbindKey(me.input.KEY.K);

    me.audio.stopTrack();

    this.parent(player);

    if (!this.eventDoor) {
      me.audio.playTrack('boss_music');
    }
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
