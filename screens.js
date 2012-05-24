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
