import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ subtitle, sections, active, onChange, children }) {
  return (
    <>
      <Navbar subtitle={subtitle} />
      <div className="dashboard-shell">
        <Sidebar sections={sections} active={active} onChange={onChange} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </>
  );
}