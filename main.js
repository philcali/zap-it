// game resources
var g_resources= [{
  name: "mm3_8boss_shadowman",
  type: "image",
  src: "data/images/mm3_8boss_shadowman.png"
}, {
  name: "test_area",
  type: "tmx",
  src: "data/test_area.tmx"
}, {
  name: "adam_animate",
  type: "image",
  src: "data/images/adam_animate.png"
}, {
  name: "bullet",
  type: "image",
  src: "data/images/bullet.png"
}, {
  name: "health_bar",
  type: "image",
  src: "data/images/health_bar.png"
}, {
  name: "one_health",
  type: "image",
  src: "data/images/one_health.png"
}, {
  name: "small_health",
  type: "image",
  src: "data/images/small_health.png"
}, {
  name: "large_health",
  type: "image",
  src: "data/images/large_health.png"
}, {
  name: "robo_car",
  type: "image",
  src: "data/images/robo_car.png"
}, {
  name: "enemy_die",
  type: "image",
  src: "data/images/enemy_die.png"
}];


var jsApp	= {	
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

    me.entityPool.add("mainPlayer", PlayerEntity);
    me.entityPool.add("RobotCar", RobotCar);
    me.entityPool.add("x-transition", Transition);

    // Movement inputs
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");

    // Action inputs
    me.input.bindKey(me.input.KEY.K, "jump", true);
    me.input.bindKey(me.input.KEY.J, "fire");

		me.state.change(me.state.PLAY);
	}

}; // jsApp

var PlayScreen = me.ScreenObject.extend({

  onResetEvent: function() {	
    // stuff to reset on state change
    me.levelDirector.loadLevel("test_area");

    me.game.addHUD(16, 16, 8, 56);
    me.game.HUD.addItem("playerHealth", new HealthBar(16, 16));
    me.game.sort();
  },

	onDestroyEvent: function() {
    me.game.disableHUD();
  }
});

window.onReady(function() {
	jsApp.onload();
});
