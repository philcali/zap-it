var jsApp = {
  onload: function() {
    if (!me.video.init('jsapp', 320, 240, true, 2.0)) {
      alert("Sorry, but your browser does not support html 5 canvas.");
         return;
    }

    // initialize the "audio"
    me.audio.init("mp3,ogg");

    // set all resources to be loaded
    me.loader.onload = this.loaded.bind(this);

    // set all resources to be loaded
    me.loader.preload(g_resources);

    // load everything & display a loading screen
    me.state.change(me.state.LOADING);
  },

  loaded: function () {
    me.state.set(me.state.PLAY, new PlayScreen());

    me.state.set(me.state.MENU, new MenuScreen());

    me.entityPool.add("mainPlayer", PlayerEntity);
    me.entityPool.add("RobotCar", RobotCar);
    me.entityPool.add("ShieldBot", ShieldBot);
    //me.entityPool.add("x-transition", Transition);

    // Movement inputs
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");

    // Action inputs
    me.input.bindKey(me.input.KEY.K, "jump", true);
    me.input.bindKey(me.input.KEY.J, "fire");

    // TODO: menu?
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);

    me.state.change(me.state.PLAY);
  }

}; // jsApp

var PlayScreen = me.ScreenObject.extend({
  init: function() {
    this.currentHealth = new HealthBar(16, 16);
    this.currentLevel = "test_area";
  },

  onResetEvent: function(data) {
    // stuff to reset on state change
    me.levelDirector.loadLevel(this.currentLevel);

    me.game.addHUD(16, 16, 8, 56);
    me.game.HUD.addItem("playerHealth", this.currentHealth);
    me.game.sort();

    if (data) {
      var player = me.game.getEntityByName("mainPlayer")[0];
      player.pos.set(data.pos.x, data.pos.y);
    }
  },

  onDestroyEvent: function() {
    me.game.disableHUD();
  }
});

var MenuScreen = me.ScreenObject.extend({
  init: function() {
    this.parent(true);
  },

  onResetEvent: function(position) {
    this.position = position;
  },

  draw: function(context) {
    context.strokeText("PAUSED", 80, 120);
  },

  update: function() {
    if (me.input.isKeyPressed('pause')) {
      me.state.change(me.state.PLAY, { pos: this.position });
    }
    return true;
  }
});

window.onReady(function() {
  jsApp.onload();
});
