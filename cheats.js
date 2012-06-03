$(document).ready(function() {
  var currentScale = 3.0;

  $('.cheat').on('click', function() {
    var key = $(this).attr('data-statkey'),
      value = $(this).attr('data-statvalue');

    if (key == 'lives') {
      value = parseInt(value);
    }

    me.gamestat.setValue('cheated', true);
    me.gamestat.setValue(key, value);

    me.audio.play('life');
    me.game.viewport.fadeOut('#eeeeee', 250);
    return false;
  });

  $('#jsapp').on('click', function() {
    currentScale = currentScale == 3.0 ? 2.0 : 3.0;

    me.video.updateDisplaySize(currentScale);
    $(this).css('width', 256 * currentScale);
  });
});
