
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
    this.type = me.game.ACTION_OBJECT;
  },

  update: function() {
    this.doWalk(this.flyLeft);

    this.updateMovement();

    this.parent(this);

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

    // Adjust gravity and velocity for jump height and speed
    this.setVelocity(1.6, 7);
    this.animationspeed = me.sys.fps / 9;
    this.gravity = 0.45;

    this.internalWalkFrame = 5;

    // Ensure ready to fire when game loads
    this.fireDelay = Math.round(this.animationspeed * 2);
    this.fireCounter = 0;

    this.faceLeft = false;

    //me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
  },

  update: function() {
    var firing = me.input.isKeyPressed('fire');

    if (firing && this.fireCounter == 0) {
      var adjust = this.faceLeft ? 0 : 22;
      me.game.add(
        new Bullet(this.pos.x + adjust, this.pos.y + 4, this.faceLeft),
        this.z
      );
      me.game.sort();
      this.fireCounter = this.fireDelay;
    }

    if (me.input.isKeyPressed('left')) {
      this.faceLeft = true;
      this.doWalk(this.faceLeft);
      if (this.isCurrentAnimation('stand')) {
        this.setCurrentAnimation('walk');
      }
    } else if (me.input.isKeyPressed('right')) {
      this.faceLeft = false;
      this.doWalk(this.faceLeft);
      if (this.isCurrentAnimation('stand')) {
        this.setCurrentAnimation('walk');
      }
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
      this.updateColRect(2, 24, 0, 30);
      firing ?
        this.setCurrentAnimation('jump-shot') :
        this.setCurrentAnimation('jump');
    } else {
      this.updateColRect(2, 24, 6, 24);
    }

    this.updateMovement();

    this.parent(this);

    me.game.collide(this);

    if (this.vel.y == 0 && (
        this.isCurrentAnimation('jump') ||
        this.isCurrentAnimation('jump-shot')
       )) {
      this.setCurrentAnimation('stand');
    }

    if (this.fireCounter > 0) {
      this.fireCounter -= 1;
    }

    return true;
  }
});
