import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../data/games';
import type { GameCategory } from '../types';
import GameCard from '../components/GameCard';
import { GridSkeleton } from '../components/Skeletons';
import { useDelayedReady } from '../lib/useDelayedReady';
import { usePrefs } from '../lib/prefs';

type Sort = 'featured' | 'az' | 'za' | 'category';

const CATEGORIES = Array.from(new Set(GAMES.map((g) => g.category))).sort() as GameCategory[];

export default function Games() {
  const ready = useDelayedReady();
  const navigate = useNavigate();
  const { prefs } = usePrefs();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GameCategory | 'All'>('All');
  const [sort, setSort] = useState<Sort>('featured');
  const [localOnly, setLocalOnly] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = GAMES.filter((g) => {
      if (cat !== 'All' && g.category !== cat) return false;
      if (localOnly && g.launch !== 'local') return false;
      if (term && !g.title.toLowerCase().includes(term)) return false;
      return true;
    });
    if (sort === 'az') out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'za') out = [...out].sort((a, b) => b.title.localeCompare(a.title));
    else if (sort === 'category')
      out = [...out].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    return out;
  }, [q, cat, sort, localOnly]);

  const recents = prefs.recents
    .map((r) => GAMES.find((g) => g.id === r.id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
    .slice(0, 6);

  const playRandom = () => {
    const pool = list.length ? list : GAMES;
    const g = pool[Math.floor(Math.random() * pool.length)];
    if (g.launch === 'local') navigate(`/play/${g.id}`);
    else window.open(g.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Games</div>
          <div className="page-sub">
            {GAMES.length} games · {GAMES.filter((g) => g.launch === 'local').length} playable right here
          </div>
        </div>
        <button className="btn primary transition" onClick={playRandom}>
          🎲 Random
        </button>
      </div>

      <div className="toolbar">
        <div className="search" style={{ maxWidth: 320 }}>
          <span className="s-ico" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            placeholder="Filter games…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filter games"
          />
        </div>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort games">
          <option value="featured">Sort: Featured</option>
          <option value="az">Sort: A → Z</option>
          <option value="za">Sort: Z → A</option>
          <option value="category">Sort: Category</option>
        </select>
        <label className="toggle">
          <input type="checkbox" checked={localOnly} onChange={(e) => setLocalOnly(e.target.checked)} />
          Playable here only
        </label>
      </div>

      <div className="chips" style={{ marginBottom: 16 }}>
        <button className={`chip transition ${cat === 'All' ? 'active' : ''}`} onClick={() => setCat('All')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip transition ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {recents.length > 0 && q === '' && cat === 'All' && (
        <>
          <div className="section-title">Recently played</div>
          <div className="grid" style={{ marginBottom: 8 }}>
            {recents.map((g) => (
              <GameCard key={`recent-${g.id}`} game={g} />
            ))}
          </div>
          <div className="section-title">All games</div>
        </>
      )}

      {!ready ? (
        <GridSkeleton count={12} />
      ) : list.length === 0 ? (
        <div className="empty">
          <div className="big">🔍</div>
          No games match your filters.
        </div>
      ) : (
        <div className="grid">
          {list.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
