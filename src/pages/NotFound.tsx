import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <div className="empty">
        <div className="big">🛰️</div>
        <p>Lost in orbit — this page doesn’t exist.</p>
        <Link to="/" className="btn primary transition">
          Back home
        </Link>
      </div>
    </div>
  );
}
