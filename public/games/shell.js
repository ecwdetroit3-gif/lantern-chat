/* Shared mini-framework for ORBIT's bundled games.
   - Pauses games and mutes sound when the portal cloaks (postMessage from the
     parent window), and resumes on restore.
   - Provides a pause-aware animation loop and a simple WebAudio beep. */
(function () {
  var paused = false;
  var pauseCbs = [];
  var resumeCbs = [];
  var ctx = null;

  window.addEventListener('message', function (e) {
    var t = e && e.data && e.data.type;
    if (t === 'orbit-pause') {
      if (!paused) {
        paused = true;
        try { if (ctx && ctx.suspend) ctx.suspend(); } catch (err) {}
        pauseCbs.forEach(function (f) { try { f(); } catch (err) {} });
      }
    } else if (t === 'orbit-resume') {
      if (paused) {
        paused = false;
        try { if (ctx && ctx.resume) ctx.resume(); } catch (err) {}
        resumeCbs.forEach(function (f) { try { f(); } catch (err) {} });
      }
    }
  });

  window.Orbit = {
    get paused() { return paused; },
    onPause: function (f) { pauseCbs.push(f); },
    onResume: function (f) { resumeCbs.push(f); },
    // rAF loop; step(dtMs, now) runs only while not paused.
    loop: function (step) {
      var last = performance.now();
      function frame(now) {
        var dt = Math.min(100, now - last);
        last = now;
        if (!paused) { try { step(dt, now); } catch (e) {} }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    },
    beep: function (freq, dur, type, vol) {
      if (paused) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = type || 'square';
        o.frequency.value = freq || 440;
        g.gain.value = vol == null ? 0.12 : vol;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.08));
        o.stop(ctx.currentTime + (dur || 0.08));
      } catch (e) {}
    }
  };
})();
