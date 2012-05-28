var jsApp = {
  onload: function() {
    if (!me.video.init('jsapp', 256, 224, true, 3.0)) {
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

    // me.debug.renderHitBox = true;
  },

  loaded: function () {
    // TODO: READY, SETTINGS, MENU
    me.state.set(me.state.PLAY, new PlayScreen());
    me.state.set(me.state.MENU, new TitleScreen());

    // We do our own transitions
    me.state.setTransition(me.state.PLAY, false);

    me.entityPool.add("mainPlayer", PlayerEntity);
    me.entityPool.add("SpawningPoint", SpawningPoint);
    me.entityPool.add("RobotCar", RobotCar);
    me.entityPool.add("ShieldBot", ShieldBot);
    me.entityPool.add("ShieldSweeper", ShieldSweeper);
    me.entityPool.add("RobotBat", RobotBat);
    me.entityPool.add("MechBot", MechBot);
    me.entityPool.add("SpinningSpawnPoint", SpinningSpawnPoint);

    me.entityPool.add('Gooseman', Gooseman);

    // Movement inputs
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
    me.input.bindKey(me.input.KEY.S, "down");

    // Action inputs
    me.input.bindKey(me.input.KEY.K, "jump", true);
    me.input.bindKey(me.input.KEY.J, "fire", true);

    // TODO: menu?
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);

    me.state.change(me.state.MENU);
  }

}; // jsApp

window.onReady(function() {
  jsApp.onload();
});
