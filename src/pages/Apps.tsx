import { useMemo, useState } from 'react';
import { APPS } from '../data/apps';
import type { AppCategory, AppEntry } from '../types';
import AppCard from '../components/AppCard';
import Modal from '../components/Modal';
import { GridSkeleton } from '../components/Skeletons';
import { useDelayedReady } from '../lib/useDelayedReady';
import { usePrefs } from '../lib/prefs';

const CATEGORIES = Array.from(new Set(APPS.map((a) => a.category))).sort() as AppCategory[];

export default function Apps() {
  const ready = useDelayedReady();
  const { prefs, addCustomApp } = usePrefs();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<AppCategory | 'All' | 'Custom'>('All');
  const [showAdd, setShowAdd] = useState(false);

  // Form state for a new custom shortcut.
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('https://');
  const [category, setCategory] = useState<AppCategory>('Other');
  const [err, setErr] = useState('');

  const all: AppEntry[] = useMemo(() => [...APPS, ...prefs.customApps], [prefs.customApps]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((a) => {
      if (cat === 'Custom' && !a.custom) return false;
      if (cat !== 'All' && cat !== 'Custom' && a.category !== cat) return false;
      if (term && !a.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [all, q, cat]);

  const submit = () => {
    setErr('');
    const t = title.trim();
    let u = url.trim();
    if (!t) {
      setErr('Please enter a name.');
      return;
    }
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    try {
      // Validate the URL.
      // eslint-disable-next-line no-new
      new URL(u);
    } catch {
      setErr('That does not look like a valid URL.');
      return;
    }
    addCustomApp({ title: t, url: u, category, description: 'Your custom shortcut.' });
    setTitle('');
    setUrl('https://');
    setCategory('Other');
    setShowAdd(false);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Apps</div>
          <div className="page-sub">Official web apps open in a new tab. Sign-in happens on each service’s own site.</div>
        </div>
        <button className="btn primary transition" onClick={() => setShowAdd(true)}>
          ＋ Add shortcut
        </button>
      </div>

      <div className="toolbar">
        <div className="search" style={{ maxWidth: 320 }}>
          <span className="s-ico" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            placeholder="Filter apps…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filter apps"
          />
        </div>
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
        {prefs.customApps.length > 0 && (
          <button className={`chip transition ${cat === 'Custom' ? 'active' : ''}`} onClick={() => setCat('Custom')}>
            Custom
          </button>
        )}
      </div>

      {!ready ? (
        <GridSkeleton count={10} />
      ) : list.length === 0 ? (
        <div className="empty">
          <div className="big">🧩</div>
          No apps match your filters.
        </div>
      ) : (
        <div className="grid">
          {list.map((a) => (
            <AppCard key={a.id} app={a} />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add a custom shortcut" onClose={() => setShowAdd(false)}>
          <div className="field">
            <label htmlFor="app-name">Name</label>
            <input id="app-name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My App" />
          </div>
          <div className="field">
            <label htmlFor="app-url">URL</label>
            <input id="app-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="field">
            <label htmlFor="app-cat">Category</label>
            <select id="app-cat" value={category} onChange={(e) => setCategory(e.target.value as AppCategory)}>
              {(['Media', 'Social', 'Productivity', 'Creative', 'Reference', 'Developer', 'Other'] as AppCategory[]).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </div>
          {err && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</p>}
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={submit}>
              Add
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
