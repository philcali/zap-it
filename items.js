var GoodDrop = me.CollectableEntity.extend({
  init: function(x, y, settings, target, power, everlasting) {

    this.parent(x, y, settings);

    this.presence = this.animationspeed * 20;
    this.urgency = this.presence / 5;

    this.setVelocity(0, 3);

    this.everlasting = everlasting;
    this.target = target;
    this.power = power;
  },

  onCollision: function(res, obj) {
    me.game.HUD.updateItemValue(this.target, this.power);
    me.game.remove(this);
  },

  update: function() {
    if (!this.everlasting) {
      this.presence --;
    }

    if (this.presence <= 0) {
      me.game.remove(this);
      return false;
    }

    if (this.presence <= this.urgency) {
      this.flicker(this.urgency);
    }

    this.updateMovement();
    this.parent(this);

    return true;
  }
});

var HealthDrop = GoodDrop.extend({
  init: function(x, y, settings, power, everlasting) {
    this.parent(x, y, settings, 'playerHealth', power, everlasting);
  }
});

var SmallEnergy = HealthDrop.extend({
  init: function(x, y, everlasting) {
    var settings = {
      image: 'small_health',
      spritewidth: 8
    };

    this.parent(x, y, settings, 2, everlasting);
  }
});

var LargeEnergy = HealthDrop.extend({
  init: function(x, y, everlasting) {
    var settings = {
      image: 'large_health',
      spritewidth: 16
    };

    this.parent(x, y, settings, 10, everlasting);
  }
});

