import { useRef, useState } from 'react';
import { usePrefs } from '../lib/prefs';
import type { Accent } from '../types';
import { shortcutLabel } from '../lib/cloak';

const EMOJI_PRESETS = ['📄', '📝', '📅', '📁', '🔍', '📊', '📧', '🗓️', '🧮'];

export default function Settings() {
  const {
    prefs,
    setAccent,
    setReducedMotion,
    setCloak,
    setBackend,
    clearRecents,
    exportPrefs,
    importPrefs,
    clearAll,
  } = usePrefs();

  const [toast, setToast] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [testState, setTestState] = useState<'' | 'checking' | 'ok' | 'fail'>('');
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  // Capture the next keypress as the cloak shortcut.
  const onCaptureKey = (e: React.KeyboardEvent) => {
    if (!capturing) return;
    e.preventDefault();
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
    setCloak({ shortcut: { key: e.key, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey } });
    setCapturing(false);
  };

  const doExport = () => {
    try {
      const blob = new Blob([exportPrefs()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orbit-preferences.json';
      a.click();
      URL.revokeObjectURL(url);
      flash('Preferences exported.');
    } catch {
      flash('Export failed.');
    }
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importPrefs(String(reader.result ?? ''));
      flash(ok ? 'Preferences imported.' : 'That file could not be imported.');
    };
    reader.readAsText(file);
  };

  const testBackend = () => {
    const base = prefs.backend.url.replace(/\/+$/, '');
    if (!base) {
      setTestState('fail');
      return;
    }
    setTestState('checking');
    const ctrl = new AbortController();
    window.setTimeout(() => ctrl.abort(), 6000);
    fetch(`${base}/healthz`, { signal: ctrl.signal })
      .then((r) => setTestState(r.ok ? 'ok' : 'fail'))
      .catch(() => setTestState('fail'));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Everything here is stored only on this device.</div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Appearance */}
        <section className="panel">
          <h3>Appearance</h3>
          <p className="hint">Dark theme with a switchable accent.</p>
          <div className="field">
            <label>Accent colour</label>
            <div className="swatches">
              {(['purple', 'blue', 'green'] as Accent[]).map((a) => (
                <button
                  key={a}
                  className={`swatch ${a} ${prefs.accent === a ? 'active' : ''}`}
                  onClick={() => setAccent(a)}
                  aria-label={`${a} accent`}
                  aria-pressed={prefs.accent === a}
                />
              ))}
            </div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={prefs.reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            Reduce motion (minimise animations)
          </label>
        </section>

        {/* Cloak */}
        <section className="panel">
          <h3>Cloak</h3>
          <p className="hint">
            Cloak hides the visible ORBIT view behind a plain notepad. It does not erase your browser history or
            network activity.
          </p>
          <div className="field">
            <label htmlFor="cloak-title">Tab title while cloaked</label>
            <input
              id="cloak-title"
              value={prefs.cloak.title}
              onChange={(e) => setCloak({ title: e.target.value })}
              placeholder="New Tab"
            />
          </div>
          <div className="field">
            <label>Favicon emoji</label>
            <div className="row">
              <input
                style={{ width: 70, textAlign: 'center' }}
                value={prefs.cloak.faviconEmoji}
                onChange={(e) => setCloak({ faviconEmoji: e.target.value })}
                maxLength={4}
                aria-label="Favicon emoji"
              />
              {EMOJI_PRESETS.map((em) => (
                <button key={em} className="btn small ghost" onClick={() => setCloak({ faviconEmoji: em })}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Keyboard shortcut</label>
            <div className="row">
              <button
                className={`btn small ${capturing ? 'primary' : ''}`}
                onClick={() => setCapturing(true)}
                onKeyDown={onCaptureKey}
              >
                {capturing ? 'Press any key…' : shortcutLabel(prefs.cloak.shortcut)}
              </button>
              <span className="hint" style={{ margin: 0 }}>
                A plain key still types in text fields; it cloaks everywhere else.
              </span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="cloak-redirect">Quick redirect URL (optional)</label>
            <input
              id="cloak-redirect"
              value={prefs.cloak.redirectUrl}
              onChange={(e) => setCloak({ redirectUrl: e.target.value })}
              placeholder="https://classroom.google.com"
            />
            <span className="hint" style={{ margin: 0 }}>
              When set, a ↪ button appears in the top bar to jump straight to this site.
            </span>
          </div>
          <p className="hint">
            Note: a keyboard shortcut may not fire while a game or proxied page has keyboard focus or is in full
            screen — use the on-screen Cloak button then.
          </p>
        </section>

        {/* Browser backend */}
        <section className="panel">
          <h3>Browser backend</h3>
          <p className="hint">
            The ORBIT Browser fetches pages through a proxy you host yourself. Leave blank to disable it — games and
            apps work without it.
          </p>
          <div className="field">
            <label htmlFor="be-url">Backend URL</label>
            <input
              id="be-url"
              value={prefs.backend.url}
              onChange={(e) => {
                setBackend({ url: e.target.value });
                setTestState('');
              }}
              placeholder="https://my-proxy.example.com"
              spellCheck={false}
            />
          </div>
          <div className="field">
            <label htmlFor="be-token">Access token</label>
            <input
              id="be-token"
              type="password"
              value={prefs.backend.token}
              onChange={(e) => setBackend({ token: e.target.value })}
              placeholder="the ACCESS_TOKEN you set on the backend"
              spellCheck={false}
            />
            <span className="hint" style={{ margin: 0 }}>
              Treat this as a shared password. It is sent with proxy requests, so anyone who has it can use your
              backend.
            </span>
          </div>
          <div className="row">
            <button className="btn small primary" onClick={testBackend}>
              Test connection
            </button>
            {testState === 'checking' && <span className="conn"><span className="status-dot wait" /> Checking…</span>}
            {testState === 'ok' && <span className="conn"><span className="status-dot ok" /> Reached backend</span>}
            {testState === 'fail' && <span className="conn"><span className="status-dot bad" /> No response</span>}
          </div>
        </section>

        {/* Data */}
        <section className="panel">
          <h3>Your data</h3>
          <p className="hint">Favorites, recents, theme and cloak settings live in this browser’s local storage.</p>
          <div className="row" style={{ marginBottom: 12 }}>
            <button className="btn small" onClick={doExport}>
              ⬇ Export
            </button>
            <button className="btn small" onClick={() => fileRef.current?.click()}>
              ⬆ Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = '';
              }}
            />
            <button className="btn small" onClick={() => { clearRecents(); flash('Recent games cleared.'); }}>
              Clear recents
            </button>
          </div>
          {!confirmClear ? (
            <button className="btn small danger" onClick={() => setConfirmClear(true)}>
              Clear all data
            </button>
          ) : (
            <div className="row">
              <span className="hint" style={{ margin: 0 }}>
                This erases favorites, recents and settings. Are you sure?
              </span>
              <button
                className="btn small danger"
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                  flash('All data cleared.');
                }}
              >
                Yes, clear
              </button>
              <button className="btn small ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
