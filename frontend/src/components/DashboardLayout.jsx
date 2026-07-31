import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ subtitle, sections, active, activeSub, onChange, onChangeSub, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Navbar subtitle={subtitle} hideUser />
      <div className="dashboard-shell">
        <Sidebar
          sections={sections}
          active={active}
          activeSub={activeSub}
          onChange={onChange}
          onChangeSub={onChangeSub}
          user={user}
          onLogout={handleLogout}
        />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </>
  );
}