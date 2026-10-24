import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePrefs } from '../lib/prefs';
import { useCloak } from '../lib/cloak-context';

type Conn = 'unconfigured' | 'checking' | 'online' | 'offline';

function normalizeInput(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  // A scheme, or something that looks like a domain → treat as URL.
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(s) && !s.includes(' ')) return `https://${s}`;
  // Otherwise search the web.
  return `https://duckduckgo.com/?q=${encodeURIComponent(s)}`;
}

export default function Browser() {
  const { prefs } = usePrefs();
  const cloak = useCloak();
  const [params] = useSearchParams();
  const base = prefs.backend.url.replace(/\/+$/, '');
  const token = prefs.backend.token;

  const [conn, setConn] = useState<Conn>(base ? 'checking' : 'unconfigured');
  const [addr, setAddr] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [idx, setIdx] = useState(-1);
  const [reloadKey, setReloadKey] = useState(0);
  const [frameError, setFrameError] = useState(false);
  const startedFromParam = useRef(false);

  const proxied = useCallback(
    (target: string) => {
      const u = new URL(`${base}/proxy`);
      u.searchParams.set('url', target);
      if (token) u.searchParams.set('token', token);
      return u.toString();
    },
    [base, token],
  );

  // Health check.
  const check = useCallback(() => {
    if (!base) {
      setConn('unconfigured');
      return;
    }
    setConn('checking');
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 6000);
    fetch(`${base}/healthz`, { signal: ctrl.signal })
      .then((r) => setConn(r.ok ? 'online' : 'offline'))
      .catch(() => setConn('offline'))
      .finally(() => window.clearTimeout(t));
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [base]);

  useEffect(() => {
    check();
  }, [check]);

  // Navigate to a new target, trimming any forward history first.
  const go = useCallback(
    (raw: string) => {
      const target = normalizeInput(raw);
      if (!target) return;
      setFrameError(false);
      setHistory((h) => {
        const trimmed = h.slice(0, idx + 1);
        const next = [...trimmed, target];
        setIdx(next.length - 1);
        return next;
      });
      setAddr(target);
    },
    [idx],
  );

  const back = () => {
    if (idx > 0) {
      const ni = idx - 1;
      setIdx(ni);
      setAddr(history[ni]);
      setFrameError(false);
    }
  };
  const forward = () => {
    if (idx < history.length - 1) {
      const ni = idx + 1;
      setIdx(ni);
      setAddr(history[ni]);
      setFrameError(false);
    }
  };
  const reload = () => {
    setFrameError(false);
    setReloadKey((k) => k + 1);
  };
  const home = () => {
    setHistory([]);
    setIdx(-1);
    setAddr('');
    setFrameError(false);
  };

  // Open a url passed via ?url= (from a game/app card) once the backend is up.
  useEffect(() => {
    const u = params.get('url');
    if (u && !startedFromParam.current && conn === 'online') {
      startedFromParam.current = true;
      go(u);
    }
  }, [params, conn, go]);

  const current = idx >= 0 ? history[idx] : '';
  // While cloaked, blank the frame so any audio stops (the page reloads on restore).
  const frameSrc = !current ? '' : cloak.active ? 'about:blank' : proxied(current);

  return (
    <div className="browser">
      <div className="browser-bar">
        <button className="btn icon small transition" onClick={back} disabled={idx <= 0} aria-label="Back">
          ←
        </button>
        <button
          className="btn icon small transition"
          onClick={forward}
          disabled={idx >= history.length - 1}
          aria-label="Forward"
        >
          →
        </button>
        <button className="btn icon small transition" onClick={reload} disabled={!current} aria-label="Reload">
          ⟳
        </button>
        <button className="btn icon small transition" onClick={home} aria-label="Home">
          ⌂
        </button>
        <form
          style={{ flex: 1, display: 'flex' }}
          onSubmit={(e) => {
            e.preventDefault();
            go(addr);
          }}
        >
          <input
            className="addr"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="Search the web or enter an address"
            spellCheck={false}
            aria-label="Address bar"
          />
        </form>
        <span className="conn">
          <span
            className={`status-dot ${
              conn === 'online' ? 'ok' : conn === 'checking' ? 'wait' : conn === 'offline' ? 'bad' : 'off'
            }`}
          />
          {conn === 'online'
            ? 'Connected'
            : conn === 'checking'
              ? 'Checking…'
              : conn === 'offline'
                ? 'Offline'
                : 'No backend'}
        </span>
      </div>

      <div className="browser-stage">
        {conn === 'unconfigured' ? (
          <div className="notice">
            <div style={{ fontSize: 40 }}>🌐</div>
            <h3>No proxy backend configured</h3>
            <p>
              The ORBIT Browser needs a proxy backend to fetch pages. Add its address in{' '}
              <Link to="/settings" style={{ color: 'var(--accent)' }}>
                Settings → Browser backend
              </Link>
              . Until then, all games and apps still work normally.
            </p>
          </div>
        ) : conn === 'offline' ? (
          <div className="notice">
            <div style={{ fontSize: 40 }}>🔌</div>
            <h3>Can’t reach the backend</h3>
            <p>
              <code>{base}</code> didn’t respond. Check that it’s running and reachable, and that your access
              token is correct.
            </p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn primary" onClick={check}>
                Retry
              </button>
              <Link to="/settings" className="btn">
                Settings
              </Link>
            </div>
          </div>
        ) : !current ? (
          <div className="notice">
            <div style={{ fontSize: 40 }}>🚀</div>
            <h3>Ready to browse</h3>
            <p>Type an address or a search above. Pages are fetched through your proxy backend and kept isolated from ORBIT.</p>
          </div>
        ) : frameError ? (
          <div className="notice">
            <div style={{ fontSize: 40 }}>⚠️</div>
            <h3>This page couldn’t be shown</h3>
            <p>Some sites block proxying or need features this proxy doesn’t support (logins, heavy apps, WebSockets).</p>
            <button className="btn primary" onClick={reload}>
              Retry
            </button>
          </div>
        ) : (
          <iframe
            key={reloadKey}
            src={frameSrc}
            title="ORBIT Browser"
            // Isolate proxied content: its own origin (the backend) keeps it out
            // of ORBIT's storage; the sandbox limits what it can do here.
            sandbox="allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            referrerPolicy="no-referrer"
            onError={() => setFrameError(true)}
          />
        )}
      </div>
    </div>
  );
}
