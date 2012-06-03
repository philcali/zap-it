var PlayScreen = me.ScreenObject.extend({
  onResetEvent: function(data) {
    var currentLevel = me.gamestat.getItemValue('checkpoint');
    var currentHealth = new HealthBar(16, 16);
    var currentMusic = currentLevel.split('_')[0] + '_music';

    me.levelDirector.loadLevel(currentLevel);

    me.game.addHUD(16, 16, 32, 56);
    me.game.HUD.addItem("playerHealth", currentHealth);
    me.game.sort();

    me.game.viewport.fadeOut("#000000", 250);
    me.audio.playTrack(currentMusic);
  },

  onDestroyEvent: function() {
    me.game.disableHUD();
  }
});

var Credits = me.ScreenObject.extend({
  onResetEvent: function() {
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);

    this.dialog = new Dialogs([
      [
        "      CREDITS",
        "ART - MUSIC: CAPCOM",
        "ENGINE: MELONJS",
        "CODE: PHILCALI"
      ],
      [
        " ",
        "        FIN.",
        " ",
        " "
      ]
    ]);
  },

  init: function() {
    this.parent(true);

    this.dialog = null;
  },

  update: function() {
    if (this.dialog.completed) {
      this.dialog.onDestroyEvent();
      me.game.viewport.fadeIn("#000000", 250, function() {
        me.state.change(me.state.READY);
      });
      return true;
    }
    return this.dialog.update();
  },

  draw: function(context) {
    me.video.clearSurface(context, "black");

    this.dialog.draw(context);
  }
});

var GameEnd = me.ScreenObject.extend({
  onResetEvent: function() {
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);
    this.font = new me.BitmapFont("fontx8", 8);
    this.screen = me.loader.getImage('game_over');
    this.philip = me.loader.getImage('pcali1');
    this.adam = me.loader.getImage('adamzap');

    me.game.viewport.fadeOut("#000000", 250);
    me.audio.playTrack('game_over');
  },

  init: function() {
    this.parent(true);

    this.font = null;
    this.screen = null;
    this.philip = null;
    this.adam = null;
  },

  update: function() {
    if (me.input.isKeyPressed('pause')) {
      me.game.viewport.fadeIn("#000000", 250, function() {
        me.state.change(me.state.CREDITS);
      });
      return true;
    }
    return false;
  },

  onDestroyEvent: function() {
    this.font = null;
  },

  draw: function(context) {
    me.video.clearSurface(context, "black");

    context.drawImage(this.screen, 0, 0);

    this.font.draw(context, "CONGRATULATIONS,", 185, 50);
    this.font.draw(context, "YOU FREED PCALI1!", 190, 60);
    this.font.draw(context, "THANKS FOR PLAYING!", 200, 170);
    context.drawImage(this.philip, 90, 75);
    context.drawImage(this.adam, 130, 72);
  }
});

var GameOver = me.ScreenObject.extend({
  onResetEvent: function() {
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);
    this.font = new me.BitmapFont("fontx8", 8);
    this.screen = me.loader.getImage('game_over');

    me.game.viewport.fadeOut("#000000", 250);
    me.audio.playTrack('game_over');
  },

  init: function() {
    this.parent(true);

    this.font = null;
    this.screen = null;
  },

  update: function() {
    if (me.input.isKeyPressed('pause')) {
      me.game.viewport.fadeIn("#000000", 250, function() {
        me.state.change(me.state.READY);
      });
     return true;
    }
    return false;
  },

  onDestroyEvent: function() {
    this.font = null;
  },

  draw: function(context) {
    me.video.clearSurface(context, "black");

    context.drawImage(this.screen, 0, 0);

    this.font.draw(context, "GAME OVER :(", 175, 50);
    this.font.draw(context, "TRY AGAIN!", 165, 70);
  }
});

var StoryScreen = me.ScreenObject.extend({
  onResetEvent: function() {
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);
    me.audio.playTrack('title_music');

    this.dialog = new Dialogs(this.dialogs, {
      x: 32,
      y: 150,
      letterDelay: 5,
      stageDelay: 25,
      lastSentence: 2,
      lastStage: 3
    });

    this.storyBoard = me.loader.getImage('story_screen');

    // Movement inputs
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
    me.input.bindKey(me.input.KEY.S, "down");

    // Action inputs
    me.input.bindKey(me.input.KEY.K, "jump", true);
    me.input.bindKey(me.input.KEY.J, "fire", true);

    me.gamestat.add('checkpoint', 'outside_01');
    me.gamestat.add('cazbot_event', true);
    me.gamestat.add('goose_event', true);
  },

  init: function() {
    this.parent(true);

    this.dialog = null;
    this.storyBoard = null;

    this.dialogs = [
      [
      "IN THE YEAR 2012,",
      "ADAMZAP RESIGNED",
      "FROM LSU."
      ],
      [
      "THIS ACTION MADE",
      "THE GOOSEMAN ANGRY",
      "FAR BEYOND CONTROL."
      ],
      [
      "HE CAPTURED PCALI1,",
      "IN ATTEMPT TO BRING",
      "ADAMZAP BACK."
      ],
      [
      "ADAMZAP RETURNED",
      "FOR HIS LAST",
      "MISSION AS AZAPLE1.",
      ]
    ];
  },

  update: function() {

    if (this.dialog.completed) {
      this.dialog.onDestroyEvent();
      me.state.change(me.state.MENU);
      return false;
    }

    return this.dialog.update();
  },

  onDestroyEvent: function() {
    this.dialog = null;
  },

  draw: function(context) {
    me.video.clearSurface(context, "black");

    context.drawImage(this.storyBoard, 0, 0);
    this.dialog.draw(context);
  }
});

var TitleScreen = me.ScreenObject.extend({
  init: function() {
    this.parent(true);

    this.font = null;
    this.title = null;
    this.blinkInterval = 15;
  },

  onResetEvent: function() {
    this.font = new me.BitmapFont("fontx8", 8);
    this.title = me.loader.getImage("zap-it-title");

    this.blinkCounter = this.blinkInterval;
    this.isBlinking = false;

    me.input.bindKey(me.input.KEY.ENTER, 'pause', true);
    me.gamestat.add('lives', 2);
  },

  update: function() {
    this.blinkCounter --;

    if (this.blinkCounter <= 0) {
      this.isBlinking = !this.isBlinking;
      this.blinkCounter = this.blinkInterval;
      return true;
    }

    if (me.input.isKeyPressed("pause")) {
      me.audio.play('teleport');

      me.game.viewport.fadeIn("#000000", 500, function() {
        me.state.change(me.state.PLAY);
      });
      return true;
    }
    return false;
  },

  onDestroyEvent: function() {
    this.font = null;
    me.input.unbindKey(me.input.KEY.ENTER);
    me.audio.stopTrack();
  },

  draw: function(context) {
    me.video.clearSurface(context, "black");

    context.drawImage(this.title, 0, 0);

    if (!this.isBlinking) {
      this.font.draw(context, "PRESS ENTER", 130, 130);
    }
  }
});
