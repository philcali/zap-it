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

    //me.debug.renderHitBox = true;
  },

  loaded: function () {
    me.state.set(me.state.PLAY, new PlayScreen());
    me.state.set(me.state.READY, new StoryScreen());
    me.state.set(me.state.MENU, new TitleScreen());
    me.state.set(me.state.GAMEOVER, new GameOver());
    me.state.set(me.state.GAME_END, new GameEnd());
    me.state.set(me.state.CREDITS, new Credits());

    // We do our own transitions
    me.state.setTransition(me.state.PLAY, false);

    me.entityPool.add("mainPlayer", PlayerEntity);
    me.entityPool.add('WallTurret', WallTurret);
    me.entityPool.add("SpawningPoint", SpawningPoint);
    me.entityPool.add("Transition", Transition);
    me.entityPool.add("Checkpoint", Checkpoint);
    me.entityPool.add("RobotCar", RobotCar);
    me.entityPool.add("ShieldBot", ShieldBot);
    me.entityPool.add("ShieldSweeper", ShieldSweeper);
    me.entityPool.add("RobotBat", RobotBat);
    me.entityPool.add("MechBot", MechBot);
    me.entityPool.add("Cazbot", Cazbot);
    me.entityPool.add("SpinningSpawnPoint", SpinningSpawnPoint);

    me.entityPool.add("LifeDrop", LifeDrop);
    me.entityPool.add("SmallEnergy", SmallEnergy);
    me.entityPool.add("LargeEnergy", LargeEnergy);

    me.entityPool.add("Spring", Spring);
    me.entityPool.add("BossDoor", BossDoor);
    me.entityPool.add("Platform", Platform);
    me.entityPool.add("WaterLine", WaterLine);

    me.entityPool.add('Gooseman', Gooseman);

    me.state.change(me.state.READY);
  }
}; // jsApp

window.onReady(function() {
  jsApp.onload();
});
