import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GAMES } from '../data/games';
import { usePrefs } from '../lib/prefs';
import Modal from '../components/Modal';

type Load = 'loading' | 'ready' | 'error';

export default function Play() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pushRecent } = usePrefs();
  const game = GAMES.find((g) => g.id === id);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [load, setLoad] = useState<Load>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [fs, setFs] = useState(false);

  const isLocal = game?.launch === 'local';

  useEffect(() => {
    if (game && isLocal) pushRecent(game.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id]);

  // Loading watchdog: if the frame never loads, surface an error with retry.
  useEffect(() => {
    if (!isLocal) return;
    setLoad('loading');
    timerRef.current = window.setTimeout(() => {
      setLoad((cur) => (cur === 'loading' ? 'error' : cur));
    }, 15000);
    return () => window.clearTimeout(timerRef.current);
  }, [reloadKey, isLocal]);

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  if (!game) {
    return (
      <div className="page">
        <div className="empty">
          <div className="big">🕹️</div>
          <p>That game could not be found.</p>
          <button className="btn primary" onClick={() => navigate('/games')}>
            Back to library
          </button>
        </div>
      </div>
    );
  }

  if (!isLocal) {
    // External games open on their official site; offer the link here too.
    return (
      <div className="page">
        <div className="empty">
          <div className="big">↗</div>
          <p>
            <strong>{game.title}</strong> opens on its official website.
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <a className="btn primary" href={game.url} target="_blank" rel="noopener noreferrer">
              Open official site
            </a>
            <button className="btn" onClick={() => navigate('/games')}>
              Back to library
            </button>
          </div>
        </div>
      </div>
    );
  }

  const restart = () => {
    setLoad('loading');
    setReloadKey((k) => k + 1);
  };

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  const src = `${import.meta.env.BASE_URL}${game.url}`;

  return (
    <div className="player">
      <div className="player-bar">
        <button className="btn small transition" onClick={() => navigate('/games')}>
          ← Library
        </button>
        <span className="title">{game.title}</span>
        <button className="btn small transition" onClick={() => setShowControls(true)}>
          ⌨ Controls
        </button>
        <button className="btn small transition" onClick={restart}>
          ⟳ Restart
        </button>
        <button className="btn small transition" onClick={toggleFullscreen}>
          {fs ? '⤡ Exit full screen' : '⛶ Full screen'}
        </button>
      </div>

      <div className="player-stage" ref={stageRef}>
        <iframe
          key={reloadKey}
          src={src}
          title={game.title}
          allow="fullscreen; autoplay; gamepad"
          onLoad={() => {
            window.clearTimeout(timerRef.current);
            setLoad('ready');
          }}
          onError={() => setLoad('error')}
        />
        {load === 'loading' && (
          <div className="player-overlay">
            <div>
              <div className="spinner" style={{ margin: '0 auto 14px' }} />
              Loading {game.title}…
            </div>
          </div>
        )}
        {load === 'error' && (
          <div className="player-overlay">
            <div>
              <div className="big" style={{ fontSize: 40 }}>
                ⚠️
              </div>
              <p>This game failed to load.</p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <button className="btn primary" onClick={restart}>
                  Retry
                </button>
                <button className="btn" onClick={() => navigate('/games')}>
                  Back to library
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showControls && (
        <Modal title={`${game.title} — how to play`} onClose={() => setShowControls(false)}>
          <p style={{ color: 'var(--text-dim)' }}>{game.description}</p>
          <p>
            <strong>Controls:</strong> {game.controls}
          </p>
          <div className="modal-actions">
            <button className="btn primary" onClick={() => setShowControls(false)}>
              Got it
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
