// Helpers every game page shares: saved scores, theme colors, canvas fitting, overlays and input.
(function () {
  const PREFIX = 'lantern.games.';

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  }
  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage blocked: scores just won't persist */ }
  }

  // Theme colors, re-read when the system switches between light and dark.
  const colors = {};
  const themeListeners = [];
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    for (const name of ['bg', 'surface', 'sunk', 'ink', 'muted', 'line', 'accent', 'accent-soft', 'accent-ink', 'danger', 'good']) {
      colors[name] = cs.getPropertyValue('--' + name).trim();
    }
  }
  readColors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    readColors();
    themeListeners.forEach((fn) => fn());
  });

  // Scales a canvas to fill its stage at a fixed W:H, sharp on high-DPI screens. Games draw in W×H units.
  function fit(canvas, W, H, onResize) {
    const ctx = canvas.getContext('2d');
    const stage = canvas.parentElement;
    function resize(notify) {
      const cs = getComputedStyle(stage);
      const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const scale = Math.max(0.1, Math.min(aw / W, ah / H));
      const cw = Math.floor(W * scale);
      const ch = Math.floor(H * scale);
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      if (notify !== false && onResize) onResize();
    }
    new ResizeObserver(() => resize()).observe(stage);
    themeListeners.push(() => { if (onResize) onResize(); });
    // Size now, but leave the first draw to the game: its state isn't set up yet.
    resize(false);
    return ctx;
  }

  // Converts a pointer event to the canvas's W×H units.
  function point(canvas, e, W, H) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  // One overlay per stage: a title, a line of text and buttons.
  function overlay(title, text, actions) {
    const stage = document.querySelector('.stage');
    let el = stage.querySelector('.overlay');
    if (!el) {
      el = document.createElement('div');
      el.className = 'overlay';
      el.innerHTML = '<div class="overlay-card" role="dialog" aria-live="polite"><h2></h2><p></p><div class="row"></div></div>';
      stage.appendChild(el);
    }
    el.querySelector('h2').textContent = title;
    el.querySelector('p').textContent = text;
    el.querySelector('p').hidden = !text;
    const row = el.querySelector('.row');
    row.textContent = '';
    for (const a of actions || []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn' + (a.primary ? ' primary' : '');
      b.textContent = a.label;
      b.addEventListener('click', () => { b.blur(); a.onClick(); });
      row.appendChild(b);
    }
    el.hidden = false;
    const first = row.querySelector('.primary') || row.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }
  function hideOverlay() {
    const el = document.querySelector('.stage .overlay');
    if (el) el.hidden = true;
  }
  function overlayOpen() {
    const el = document.querySelector('.stage .overlay');
    return !!el && !el.hidden;
  }

  // Calls fn('up' | 'down' | 'left' | 'right') on a swipe across el.
  function swipe(el, fn) {
    let start = null;
    el.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) fn(dx > 0 ? 'right' : 'left');
      else fn(dy > 0 ? 'down' : 'up');
    });
    el.addEventListener('pointercancel', () => { start = null; });
  }

  const KEY_DIRS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
  };

  // Buttons in the top bar should not keep focus, or Space would press them again mid-game.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.game-top button');
    if (b) b.blur();
  });

  const fsBtn = document.getElementById('fullscreen');
  if (fsBtn) {
    if (!document.fullscreenEnabled) fsBtn.hidden = true;
    fsBtn.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    });
  }

  function onHidden(fn) {
    document.addEventListener('visibilitychange', () => { if (document.hidden) fn(); });
    window.addEventListener('blur', fn);
  }

  // Records a high score (or a low one, for times) and the line shown on the home page card.
  function best(id, value, opts) {
    const lower = opts && opts.lower;
    const key = id + '.best' + (opts && opts.variant ? '.' + opts.variant : '');
    const prev = get(key, null);
    const isNew = value != null && (prev == null || (lower ? value < prev : value > prev));
    if (isNew) set(key, value);
    return { best: isNew ? value : prev, isNew };
  }

  // Blends two #rrggbb colors; pct is how much of the first one to keep. Canvas can't rely on color-mix().
  function mix(a, b, pct) {
    const rgb = (h) => {
      h = h.replace('#', '');
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    };
    const pa = rgb(a), pb = rgb(b), t = pct / 100;
    return 'rgb(' + pa.map((v, i) => Math.round(v * t + pb[i] * (1 - t))).join(',') + ')';
  }

  window.Shell = {
    get, set, colors, fit, point, overlay, hideOverlay, overlayOpen, swipe, KEY_DIRS, onHidden, best, mix,
    card(id, text) { set(id + '.card', text); },
    onTheme(fn) { themeListeners.push(fn); },
    fmt(n) { return Number(n).toLocaleString(); },
  };
})();
