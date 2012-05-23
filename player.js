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

    me.game.viewport.follow(this.pos, me.game.viewport.AXIS.HORIZONTAL);
    // Conditionally set this for right only
    // me.game.viewport.setDeadzone(-50, 0);
  },

  doDamage: function(value) {
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
    me.state.set(me.state.PLAY, new PlayScreen());
    me.state.change(me.state.PLAY);
  },

  update: function() {

    if (me.input.isKeyPressed('pause')) {
      // Perhaps pass more in there...?
      me.state.change(me.state.MENU, this.pos);
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
