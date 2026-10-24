import { useNavigate } from 'react-router-dom';
import type { GameEntry } from '../types';
import { usePrefs } from '../lib/prefs';
import { gameGlyph, gradientFor } from '../lib/thumb';

export default function GameCard({ game }: { game: GameEntry }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, prefs } = usePrefs();
  const fav = isFavorite(game.id);
  const isLocal = game.launch === 'local';

  const play = () => {
    if (isLocal) navigate(`/play/${game.id}`);
    else window.open(game.url, '_blank', 'noopener,noreferrer');
  };

  const openInBrowser = () => navigate(`/browser?url=${encodeURIComponent(game.url)}`);

  return (
    <article className="card transition">
      <button
        className={`fav transition ${fav ? 'on' : ''}`}
        onClick={() => toggleFavorite(game.id)}
        aria-pressed={fav}
        aria-label={fav ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
        title={fav ? 'Remove from favorites' : 'Add to favorites'}
      >
        {fav ? '★' : '☆'}
      </button>

      <button
        className="thumb"
        style={{ background: gradientFor(game.id) }}
        onClick={play}
        aria-label={isLocal ? `Play ${game.title}` : `Open ${game.title} official site`}
      >
        <span aria-hidden>{gameGlyph(game.category)}</span>
        <span className="play-overlay">
          <span className="pill">{isLocal ? '▶ Play' : '↗ Open site'}</span>
        </span>
      </button>

      <div className="card-body">
        <div className="card-title">{game.title}</div>
        <div className="card-meta">
          <span className="tag">{game.category}</span>
          <span className={`tag ${isLocal ? '' : 'ext'}`}>{isLocal ? 'Play here' : 'Official site'}</span>
        </div>
        <p className="card-desc">{game.description}</p>
        <div className="card-actions">
          <button className="btn primary transition" onClick={play}>
            {isLocal ? '▶ Play' : '↗ Open official'}
          </button>
          {!isLocal && prefs.backend.url && (
            <button className="btn transition" onClick={openInBrowser} title="Open inside the ORBIT Browser (proxy)">
              🌐
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
