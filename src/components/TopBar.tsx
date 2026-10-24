import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../data/games';
import { APPS } from '../data/apps';
import { usePrefs } from '../lib/prefs';
import { useCloak } from '../lib/cloak-context';
import { gameGlyph, appGlyph, gradientFor } from '../lib/thumb';

interface Hit {
  id: string;
  title: string;
  sub: string;
  glyph: string;
  grad: string;
  go: () => void;
}

export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { prefs } = usePrefs();
  const cloak = useCloak();
  const blurTimer = useRef<number | undefined>(undefined);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const games: Hit[] = GAMES.filter((g) => g.title.toLowerCase().includes(term)).map((g) => ({
      id: g.id,
      title: g.title,
      sub: g.category,
      glyph: gameGlyph(g.category),
      grad: gradientFor(g.id),
      go: () => {
        if (g.launch === 'local') navigate(`/play/${g.id}`);
        else window.open(g.url, '_blank', 'noopener,noreferrer');
      },
    }));
    const apps: Hit[] = [...APPS, ...prefs.customApps]
      .filter((a) => a.title.toLowerCase().includes(term))
      .map((a) => ({
        id: a.id,
        title: a.title,
        sub: 'App',
        glyph: appGlyph(a.category),
        grad: gradientFor(a.id),
        go: () => window.open(a.url, '_blank', 'noopener,noreferrer'),
      }));
    return [...games, ...apps].slice(0, 10);
  }, [q, navigate, prefs.customApps]);

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Toggle navigation">
        ☰
      </button>

      <div className="search">
        <span className="s-ico" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          placeholder="Search games and apps…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 150);
          }}
          aria-label="Search games and apps"
        />
        {open && hits.length > 0 && (
          <div
            className="search-results"
            onMouseDown={() => window.clearTimeout(blurTimer.current)}
          >
            {hits.map((h) => (
              <button
                key={h.id}
                className="search-row"
                style={{ width: '100%', background: 'transparent', border: 0, textAlign: 'left' }}
                onClick={() => {
                  h.go();
                  setOpen(false);
                  setQ('');
                }}
              >
                <span className="r-glyph" style={{ background: h.grad }}>
                  {h.glyph}
                </span>
                <span>{h.title}</span>
                <span className="r-sub">{h.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-spacer" />

      {cloak.hasRedirect && (
        <button
          className="btn icon ghost transition"
          onClick={cloak.redirect}
          title="Quick redirect to your chosen site"
          aria-label="Quick redirect"
        >
          ↪
        </button>
      )}
      <button
        className="btn cloak-btn transition"
        onClick={cloak.activate}
        title="Cloak: hide ORBIT behind a notepad"
      >
        🥷 Cloak
      </button>
    </header>
  );
}
