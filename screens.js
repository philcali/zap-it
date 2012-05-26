var PlayScreen = me.ScreenObject.extend({
  init: function() {
    this.currentHealth = new HealthBar(16, 16);
    this.currentLevel = "test_area";
  },

  onResetEvent: function(data) {
    me.levelDirector.loadLevel(this.currentLevel);

    me.game.addHUD(16, 16, 8, 56);
    me.game.HUD.addItem("playerHealth", this.currentHealth);
    me.game.sort();

    me.game.viewport.fadeOut("#000000", 250);
  },

  onDestroyEvent: function() {
    me.game.disableHUD();
  }
});

var TitleScreen = me.ScreenObject.extend({
  init: function() {
    this.parent(true);

    this.font = new me.BitmapFont("fontx8", 8);
    this.title = me.loader.getImage("zap-it-title");

    this.blinkInterval = 15;
    this.blinkCounter = this.blinkInterval;
    this.isBlinking = false;

    me.input.bindKey(me.input.KEY.ENTER, "pause", true);
  },

  update: function() {
    this.blinkCounter --;

    if (this.blinkCounter <= 0) {
      this.isBlinking = !this.isBlinking;
      this.blinkCounter = this.blinkInterval;
      return true;
    }

    if (me.input.isKeyPressed("pause")) {
      me.state.change(me.state.PLAY);
      return true;
    }
    return false;
  },

  onDestroyEvent: function() {
    this.font = null;
    me.input.unbindKey(me.input.KEY.ENTER);
  },

  draw: function(context) {
    me.video.clearSurface(context, "black");

    context.drawImage(this.title, 0, 0);

    if (!this.isBlinking) {
      this.font.draw(context, "PRESS ENTER", 130, 130);
    }
  }
});
