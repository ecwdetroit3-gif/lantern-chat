import { useNavigate } from 'react-router-dom';
import type { AppEntry } from '../types';
import { usePrefs } from '../lib/prefs';
import { appGlyph, gradientFor } from '../lib/thumb';

export default function AppCard({ app }: { app: AppEntry }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, removeCustomApp, prefs } = usePrefs();
  const fav = isFavorite(app.id);

  const open = () => window.open(app.url, '_blank', 'noopener,noreferrer');
  const openInBrowser = () => navigate(`/browser?url=${encodeURIComponent(app.url)}`);

  return (
    <article className="card transition">
      <button
        className={`fav transition ${fav ? 'on' : ''}`}
        onClick={() => toggleFavorite(app.id)}
        aria-pressed={fav}
        aria-label={fav ? `Remove ${app.title} from favorites` : `Add ${app.title} to favorites`}
      >
        {fav ? '★' : '☆'}
      </button>

      <button
        className="thumb"
        style={{ background: gradientFor(app.id) }}
        onClick={open}
        aria-label={`Open ${app.title} official site`}
      >
        <span aria-hidden>{appGlyph(app.category)}</span>
        <span className="play-overlay">
          <span className="pill">↗ Open</span>
        </span>
      </button>

      <div className="card-body">
        <div className="card-title">
          {app.title} {app.custom && <span className="tag">custom</span>}
        </div>
        <div className="card-meta">
          <span className="tag">{app.category}</span>
          <span className="tag ext">Official site</span>
        </div>
        <p className="card-desc">{app.description}</p>
        <div className="card-actions">
          <button className="btn primary transition" onClick={open}>
            ↗ Open official
          </button>
          {prefs.backend.url && (
            <button className="btn transition" onClick={openInBrowser} title="Open inside the ORBIT Browser (proxy)">
              🌐
            </button>
          )}
          {app.custom && (
            <button
              className="btn danger transition"
              onClick={() => removeCustomApp(app.id)}
              title="Remove this custom shortcut"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
