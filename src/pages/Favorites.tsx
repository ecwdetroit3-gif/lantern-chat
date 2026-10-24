import { Link } from 'react-router-dom';
import { GAMES } from '../data/games';
import { APPS } from '../data/apps';
import { usePrefs } from '../lib/prefs';
import GameCard from '../components/GameCard';
import AppCard from '../components/AppCard';

export default function Favorites() {
  const { prefs } = usePrefs();
  const favSet = new Set(prefs.favorites);

  const games = GAMES.filter((g) => favSet.has(g.id));
  const apps = [...APPS, ...prefs.customApps].filter((a) => favSet.has(a.id));

  const empty = games.length === 0 && apps.length === 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Favorites</div>
          <div className="page-sub">Everything you’ve starred, in one place.</div>
        </div>
      </div>

      {empty ? (
        <div className="empty">
          <div className="big">⭐</div>
          <p>No favorites yet. Tap the star on any game or app to pin it here.</p>
          <Link to="/games" className="btn primary transition" style={{ marginTop: 8 }}>
            Browse games
          </Link>
        </div>
      ) : (
        <>
          {games.length > 0 && (
            <>
              <div className="section-title">Games</div>
              <div className="grid">
                {games.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            </>
          )}
          {apps.length > 0 && (
            <>
              <div className="section-title">Apps</div>
              <div className="grid">
                {apps.map((a) => (
                  <AppCard key={a.id} app={a} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
