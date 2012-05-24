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
