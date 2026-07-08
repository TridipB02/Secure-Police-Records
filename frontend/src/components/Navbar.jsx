import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-crest">SP</span>
        <span className="topbar-title">
          {title || 'Secure Police Record System'}
          {subtitle && <small>{subtitle}</small>}
        </span>
      </div>
      {user && (
        <div className="topbar-user">
          <span>{user.fullName}</span>
          <span className="topbar-role">{user.role}</span>
          <button className="btn-ghost-invert" onClick={handleLogout}>Sign out</button>
        </div>
      )}
    </header>
  );
}
