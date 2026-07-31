import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, subtitle }) {
  const { user } = useAuth();

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
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user.fullName}</span>
                <span className="topbar-role">{user.role}</span>
              </div>
            </div>
        )}
      </header>
  );
}