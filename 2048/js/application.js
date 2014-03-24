// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var gm = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalScoreManager);
  var cnt = 2;
  var int = setInterval(function () {
    var arr = [];
    var amt = 0;
    gm.grid.eachCell(function (x, y, tile) {
      if (tile) {
        arr[y * 4 + x] = tile.value;
        amt++;
      } else {
        arr[y * 4 + x] = 0;
      }
    });
    var r = 7// + parseInt((cnt++) / 64);
    var grid = new ai_grid(arr);
    var dir = grid.bruteforce(r)[1];

    if (dir == -1) {
      clearInterval(int);
      return;
    }
    gm.inputManager.emit("move", dir);

    if (gm.over)
      clearInterval(int);
    if (gm.won && !gm.keepPlaying)
      gm.inputManager.emit("keepPlaying");
  }, 10);
});
