import { Link, useNavigate } from 'react-router-dom';
import { GAMES } from '../data/games';
import { APPS } from '../data/apps';
import { usePrefs } from '../lib/prefs';
import GameCard from '../components/GameCard';

export default function Home() {
  const navigate = useNavigate();
  const { prefs } = usePrefs();

  const localGames = GAMES.filter((g) => g.launch === 'local');
  const recents = prefs.recents
    .map((r) => GAMES.find((g) => g.id === r.id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
    .slice(0, 6);

  const playRandom = () => {
    const g = GAMES[Math.floor(Math.random() * GAMES.length)];
    if (g.launch === 'local') navigate(`/play/${g.id}`);
    else window.open(g.url, '_blank', 'noopener,noreferrer');
  };

  const featured = localGames.slice(0, 6);

  return (
    <div className="page">
      <section className="hero">
        <div className="orb" aria-hidden />
        <h1>Welcome to ORBIT</h1>
        <p>
          A fast portal for browser games and web apps, with a built-in browser and a one-tap cloak.
          Everything here runs in your browser — favorites and settings stay on this device.
        </p>
        <div className="hero-actions">
          <Link to="/games" className="btn primary transition">
            🎮 Browse games
          </Link>
          <button className="btn transition" onClick={playRandom}>
            🎲 Random game
          </button>
          <Link to="/browser" className="btn transition">
            🌐 Open browser
          </Link>
        </div>
        <div className="stat-row">
          <div className="stat">
            <b>{GAMES.length}</b>
            <span>games</span>
          </div>
          <div className="stat">
            <b>{localGames.length}</b>
            <span>playable here</span>
          </div>
          <div className="stat">
            <b>{APPS.length}</b>
            <span>apps</span>
          </div>
          <div className="stat">
            <b>{prefs.favorites.length}</b>
            <span>favorites</span>
          </div>
        </div>
      </section>

      {recents.length > 0 && (
        <>
          <div className="section-title">Recently played</div>
          <div className="grid">
            {recents.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </>
      )}

      <div className="section-title">Featured games</div>
      <div className="grid">
        {featured.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
