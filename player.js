var ReadyDialog = me.ObjectEntity.extend({
  init: function(delay) {
    this.parent(32, 100, {
      image: "dialog_box",
      spritewidth: 184,
      spriteheight: 57
    });

    this.font = new me.BitmapFont('fontx8', 8);
    this.delay = delay;
    this.delayCounter = this.delay;

    this.isBlinking = false;
    this.blinkInterval = 10;
    this.blinkCounter = this.blinkInterval;
  },

  draw: function(context) {
    //this.parent(context);

    if (!this.isBlinking) {
      this.font.draw(context, "READY", 150, 85);
    }
  },

  update: function() {
    this.delayCounter --;
    this.blinkCounter --;

    if (this.blinkCounter <= 0) {
      this.isBlinking = !this.isBlinking;
      this.blinkCounter = this.blinkInterval;
    }

    if (this.delayCounter <= 0) {
      this.font = null;
      me.game.remove(this);
      return false;
    }

    return true;
  }
});

var SpawningPoint = me.InvisibleEntity.extend({
  init: function(x, y, settings) {
    this.parent(x, y, settings);

    this.delay = 50;
    this.delayCounter = this.delay;

    this.dialog = new ReadyDialog(this.delay);

    me.game.add(this.dialog, this.z);
  },

  update: function() {
    this.delayCounter --;

    if (this.delayCounter <= 0) {
      var player = new PlayerEntity(this.pos.x, 10, { name: 'mainPlayer' });

      player.doSpawn(this.pos);

      me.game.add(player, this.z);
      me.game.remove(this);
      me.game.sort();
    }

    return false;
  }
});

var PlayerEntity = me.ObjectEntity.extend({
  init: function(x, y, settings) {
    settings.image = "adam_animate";
    settings.spritewidth = 31;
    settings.spriteheight = 30;

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

    this.addAnimation('spawning', [17]);
    this.addAnimation('spawn-landed', [18, 19]);

    this.addAnimation('leaving', [19, 18]);

    // Adjust gravity and velocity for jump height and speed
    this.setVelocity(1.4, 7.5);
    this.animationspeed = me.sys.fps / 9;
    this.gravity = 0.45;
    this.faceLeft = false;

    // TODO: manage adambot's walk state
    this.internalWalkFrame = 5;

    // Slide behavior
    this.slideDuration = this.animationspeed * 3;
    this.slideCounter = 0;
    this.sliding = false;

    // Firing behavior
    this.fireDelay = Math.round(this.animationspeed * 2);
    this.fireCounter = 0;
    this.maxLiveRounds = 3;
    this.firing = false;

    // Hit behavior
    this.damageDelay = this.fireDelay;
    this.damageCounter = 0;
    this.damaged = false;

    this.spawning = false;
    this.spawnLanded = false;
    this.spawnDest = this.pos;

    this.leaving = false;
    this.leavingStarted = false;

    me.game.viewport.follow(this.pos, me.game.viewport.AXIS.HORIZONTAL);
    // Conditionally set this for right only
    // me.game.viewport.setDeadzone(-50, 0);
  },

  doSpawn: function(toPos) {
    this.spawning = true;
    this.spawnDest = toPos;
    this.setCurrentAnimation('spawning');
  },

  doLeave: function() {
    this.leaving = true;
    this.setCurrentAnimation('leaving', function() {
      this.leavingStarted = true;
      this.setCurrentAnimation('spawning');
    });
    me.audio.play('teleport');
  },

  doWalk: function(left) {
    if (this.sliding && this.faceLeft && !left) {
      this.breakSlide();
    }
    this.parent(left);
  },

  doDamage: function(value) {
    this.breakSlide();

    this.damaged = true;
    this.vel.x = this.vel.x * -0.75;

    me.game.HUD.updateItemValue("playerHealth", value * -1);

    if (me.game.HUD.getItemValue('playerHealth') <= 0) {
      this.doDeath();
    }

    // Knock him down!
    if (this.vel.y > 0 && !this.falling) {
      this.vel.y = this.vel.y * -1;
    }

    this.flicker(50);
    this.setCurrentAnimation('damaged');
    this.damageCounter = this.damageDelay;
    me.audio.play('hit');
  },

  doFire: function() {
    var currentBullets = me.game.getEntityByName('bullet');

    if (currentBullets.length >= this.maxLiveRounds) {
      return;
    }

    this.breakSlide();
    this.firing = true;
    this.fireCounter = this.fireDelay;

    var adjust = this.faceLeft ? 0 : 22;
    me.game.add(
      new Bullet(this.pos.x + adjust, this.pos.y + 4, this.faceLeft),
      this.z
    );
    me.game.sort();
    me.audio.play('shoot');
  },

  doStride: function(left) {
    this.faceLeft = left;
    this.doWalk(this.faceLeft);
    if (this.isCurrentAnimation('walk')) {
      return;
    }

    if (this.isCurrentAnimation('stand')) {
      return this.setCurrentAnimation('walk');
    } else if (!this.damaged && this.isCurrentAnimation('damaged')) {
      return this.setCurrentAnimation('walk');
    }
  },

  doSlide: function() {
    this.sliding = true;
    this.slideCounter = this.slideDuration;
    this.setCurrentAnimation('slide');
    this.setVelocity(2.6, 7);
  },

  breakSlide: function() {
    this.sliding = false;
    this.setVelocity(1.6, 7);
  },

  doDeath: function() {
    me.gamestat.updateValue('lives', -1);
    me.game.remove(this);

    me.audio.stopTrack();
    me.audio.play('death');

    new ExplosionFactory(this);

    me.game.HUD.setItemValue("playerHealth", 0);

    me.game.viewport.fadeIn("#dddddd", 1700, function() {
      var lives = me.gamestat.getItemValue('lives');

      me.state.set(me.state.PLAY, new PlayScreen());

      if (lives >= 0) {
        me.state.change(me.state.PLAY);
      } else {
        me.state.change(me.state.GAMEOVER);
      }
    });
  },

  update: function() {

    if (this.leaving) {
      if (this.leavingStarted) {
        this.vel.y -= 1;
        this.computeVelocity(this.vel);
        this.pos.add(this.vel);

        if (this.pos.y < me.game.viewport.pos.y) {
          me.game.remove(this);
          me.game.viewport.fadeIn("#eeeeee", 500, function() {
            me.state.change(me.state.GAME_END);
          });
        }
      }

      this.parent(this);
      return true;
    }

    if (this.spawning) {

      if (!this.spawnLanded) {
        this.vel.y +=1;
        this.computeVelocity(this.vel);
        this.pos.add(this.vel);

        if (this.pos.y >= (this.spawnDest.y - 16)) {
          this.spawnLanded = true;
          this.flicker(10);
          this.setCurrentAnimation('spawn-landed', function() {
            this.spawning = false;
            this.setCurrentAnimation('stand');
          });
        }
      }

      this.parent(this);
      return true;
    }

    if (this.damaged) {
      this.updateMovement();
      this.parent(this);
      this.damageCounter --;

      if (this.damageCounter <= 0) {
        this.damaged = false;
      }
      return true;
    }

    if (me.input.isKeyPressed('fire')) {
      this.doFire();
    }

    if (me.input.isKeyPressed('left')) {
      this.doStride(true);
    } else if (me.input.isKeyPressed('right')) {
      this.doStride(false);
    } else if (this.sliding) {
      this.doWalk(this.faceLeft);
    } else {
      this.vel.x = 0;
      this.firing ?
        this.setCurrentAnimation('stand-shot') :
        this.setCurrentAnimation('stand');
    }

    if (this.firing && this.vel.x != 0) {
      this.setCurrentAnimation('walk-shot');
    } else if (this.firing) {
      this.setCurrentAnimation('stand-shot');
    } else if (!this.firing && this.vel.x != 0 && (
      this.isCurrentAnimation('walk-shot') ||
      this.isCurrentAnimation('stand-shot'))) {

      this.setCurrentAnimation('walk');
      this.setAnimationFrame(this.internalWalkFrame);
    }

    if (me.input.isKeyPressed('jump')) {
      me.input.isKeyPressed('down') ?
        this.doSlide() : this.doJump();
    }

    if (this.falling || this.jumping) {
      if (this.sliding) this.breakSlide();

      this.updateColRect(2, 22, 0, 30);
      this.firing ?
        this.setCurrentAnimation('jump-shot') :
        this.setCurrentAnimation('jump');
    } else if (this.sliding) {
      this.updateColRect(2, 28, 14, 16);
    } else {
      this.updateColRect(2, 22, 6, 24);
    }

    var general = this.updateMovement();
    var res = me.game.collide(this);

    this.parent(this);

    if (res) {
      if (!this.isFlickering() && res.obj.type == me.game.ENEMY_OBJECT) {
        this.doDamage(res.obj.power);
      }
    }

    if (general.y > 0 && (
        this.isCurrentAnimation('jump') ||
        this.isCurrentAnimation('jump-shot')
       )) {
      this.setCurrentAnimation('stand');
      me.audio.play('landing');
    }

    if (this.firing) {
      this.fireCounter --;

      if (this.fireCounter <= 0) {
        this.firing = false;
      }
    }

    if (this.sliding) {
      this.slideCounter --;
      if (this.slideCounter <= 0) {
        this.breakSlide();
        this.setCurrentAnimation('stand');
      }
    }

    // Fall death
    if (this.pos.y > (me.game.viewport.pos.y + me.game.viewport.height)) {
      this.doDeath();
    }

    return true;
  }
});
