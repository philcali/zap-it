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

    //me.debug.renderHitBox = true;
  },

  loaded: function () {
    // TODO: READY, SETTINGS, MENU

    me.state.set(me.state.PLAY, new PlayScreen());

    // We do our own transitions
    me.state.setTransition(me.state.PLAY, false);

    me.entityPool.add("mainPlayer", PlayerEntity);
    me.entityPool.add("RobotCar", RobotCar);
    me.entityPool.add("ShieldBot", ShieldBot);
    me.entityPool.add("ShieldSweeper", ShieldSweeper);
    me.entityPool.add("RobotBat", RobotBat);
    me.entityPool.add("MechBot", MechBot);
    //me.entityPool.add("x-transition", Transition);

    // Movement inputs
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
    me.input.bindKey(me.input.KEY.S, "down");

    // Action inputs
    me.input.bindKey(me.input.KEY.K, "jump", true);
    me.input.bindKey(me.input.KEY.J, "fire", true);

    // TODO: menu?
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);

    me.state.change(me.state.PLAY);
  }

}; // jsApp

window.onReady(function() {
  jsApp.onload();
});
