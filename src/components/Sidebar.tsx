import { NavLink } from 'react-router-dom';

const LINKS: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/games', label: 'Games', icon: '🎮' },
  { to: '/apps', label: 'Apps', icon: '🧩' },
  { to: '/browser', label: 'Browser', icon: '🌐' },
  { to: '/favorites', label: 'Favorites', icon: '⭐' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ open }: { open: boolean }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
        <div className="brand-name">
          ORBIT
          <small>games · apps · browser</small>
        </div>
      </div>
      <nav className="nav">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-link transition ${isActive ? 'active' : ''}`}
          >
            <span className="nav-ico" aria-hidden>
              {l.icon}
            </span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="nav-spacer" />
      <div className="sidebar-foot">
        Cloak hides the view only — it does not erase history or network activity.
      </div>
    </aside>
  );
}
