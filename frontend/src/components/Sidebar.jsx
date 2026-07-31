import { LogOut, UserCircle } from 'lucide-react';

export default function Sidebar({ sections, active, activeSub, onChange, onChangeSub, onLogout }) {
    return (
        <nav className="sidebar">
            <div className="sidebar-nav">
                {sections.map((s) => {
                    const isActiveParent = active === s.key;
                    return (
                        <div key={s.key} className="sidebar-group">
                            <button
                                className={`sidebar-section ${isActiveParent ? 'active' : ''}`}
                                onClick={() => onChange(s.key)}
                            >
                                <s.icon />
                                {s.label}
                            </button>
                            {isActiveParent && s.subsections && (
                                <div className="sidebar-subnav">
                                    {s.subsections.map((sub) => (
                                        <button
                                            key={sub.key}
                                            className={`sidebar-subsection ${activeSub === sub.key ? 'active' : ''}`}
                                            onClick={() => onChangeSub(sub.key)}
                                        >
                                            <sub.icon size={14} />
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="sidebar-footer">
                <button className="sidebar-section" onClick={() => onChange('profile')}>
                    <UserCircle />
                    Profile
                </button>
                <button className="sidebar-logout" onClick={onLogout}>
                    <LogOut size={14} /> Sign out
                </button>
            </div>
        </nav>
    );
}