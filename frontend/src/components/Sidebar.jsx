export default function Sidebar({ sections, active, onChange }) {
  return (
    <nav className="sidebar">
      {sections.map((s) => (
        <button
          key={s.key}
          className={`sidebar-section ${active === s.key ? 'active' : ''}`}
          onClick={() => onChange(s.key)}
        >
          <s.icon />
          {s.label}
        </button>
      ))}
    </nav>
  );
}