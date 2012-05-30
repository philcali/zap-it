var PlayScreen = me.ScreenObject.extend({
  onResetEvent: function(data) {
    var currentLevel = me.gamestat.getItemValue('checkpoint');
    var currentHealth = new HealthBar(16, 16);

    me.levelDirector.loadLevel(currentLevel);

    me.game.addHUD(16, 16, 32, 56);
    me.game.HUD.addItem("playerHealth", currentHealth);
    me.game.sort();

    me.game.viewport.fadeOut("#000000", 250);
  },

  onDestroyEvent: function() {
    me.game.disableHUD();
  }
});

var GameEnd = me.ScreenObject.extend({
  onResetEvent: function() {
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);
    this.font = new me.BitmapFont("fontx8", 8);
    this.screen = me.loader.getImage('game_over');

    me.game.viewport.fadeOut("#000000", 250);
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

    this.font.draw(context, "CONGRATULATIONS!", 180, 50);
  }
});

var GameOver = me.ScreenObject.extend({
  onResetEvent: function() {
    me.input.bindKey(me.input.KEY.ENTER, "pause", true);
    this.font = new me.BitmapFont("fontx8", 8);
    this.screen = me.loader.getImage('game_over');

    me.game.viewport.fadeOut("#000000", 250);
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

    this.font = new me.BitmapFont("fontx8", 8);
    this.storyBoard = me.loader.getImage('story_screen');
    this.dialogBox = me.loader.getImage('dialog_box');

    this.letterCounter = this.letterDelay;
    this.currentLetter = 0;
    this.currentStage = 0;
    this.currentSentence = 0;
    this.lastSentence = 2;
    this.lastStage = 3;

    this.changingStage = false;
    this.stageCounter = this.stageDelay;
    this.completed = false;

    // Movement inputs
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
    me.input.bindKey(me.input.KEY.S, "down");

    // Action inputs
    me.input.bindKey(me.input.KEY.K, "jump", true);
    me.input.bindKey(me.input.KEY.J, "fire", true);

    // TODO: change this
    me.gamestat.add('checkpoint', 'outside_01');
  },

  init: function() {
    this.parent(true);

    this.font = null;
    this.storyBoard = null;
    this.dialogBox = null;

    this.letterDelay = 5;
    this.stageDelay = 25;

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
    if (this.changingStage) {
      this.stageCounter --;
      if (this.stageCounter <= 0) {
        this.stageCounter = this.stageDelay;
        this.currentStage ++;
        this.currentSentence = 0;
        this.currentLetter = 0;
        if (this.currentStage > this.lastStage) {
          // Done
          this.currentStage = this.lastStage;
          this.completed = true;
        }
        this.changingStage = false;
      } else {
        return false;
      }
    }

    this.letterCounter --;
    if (this.letterCounter <= 0) {
      this.letterCounter = this.letterDelay;
      this.currentLetter++;
      var l = this.dialogs[this.currentStage][this.currentSentence].length;

      if (this.currentLetter == l) {
        this.currentSentence ++;
        this.currentLetter = 0;
      }

      if (this.currentSentence > this.lastSentence) {
        this.currentSentence = this.lastSentence;
        this.currentLetter = l - 1;
        this.changingStage = true;
      }

      return true;
    }

    if (me.input.isKeyPressed('pause') || this.completed) {
      me.state.change(me.state.MENU);
      return true;
    }
    return false;
  },

  onDestroyEvent: function() {
    this.font = null;
  },

  draw: function(context) {
    me.video.clearSurface(context, "black");

    context.drawImage(this.storyBoard, 0, 0);
    context.drawImage(this.dialogBox, 32, 150);

    var text = this.dialogs[this.currentStage];

    for (var i = 0; i <= this.currentSentence; i ++) {
      var cap = i == this.currentSentence ?
        this.currentLetter : text[i].length - 1;
      for (var j = 0; j <= cap ; j ++) {
        this.font.draw(context, text[i][j], 48 + (9 * j), 160 + (12 * i));
      }
    }
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
