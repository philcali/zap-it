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
  },

	onDestroyEvent: function() {	}
});

window.onReady(function() {
	jsApp.onload();
});
