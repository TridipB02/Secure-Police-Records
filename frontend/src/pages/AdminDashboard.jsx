import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const TABS = ['Overview', 'Register user', 'All citizens', 'All users'];
const ROLES = ['CITIZEN', 'POLICE_OFFICER', 'ANTECEDENT_OFFICER', 'LICENSING_AUTHORITY', 'AUDIT_OFFICER', 'ADMIN'];

const CONSOLES = [
  { label: 'Officer console', path: '/officer', desc: 'KYC verification, citizen registration, records' },
  { label: 'Antecedent console', path: '/antecedent', desc: 'Criminal background reports' },
  { label: 'Licensing console', path: '/licensing', desc: 'Firearm applications & certificates' },
  { label: 'Audit console', path: '/audit', desc: 'Tamper detection & audit trail' },
  { label: 'Citizen portal', path: '/citizen', desc: 'KYC, firearm applications, certificates' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <>
      <Navbar subtitle="Administrator Console" />
      <main className="main">
        <div className="page-header">
          <h1>Administrator console</h1>
          <p>System-wide oversight: manage users, citizens, and access every role console.</p>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        {tab === 'Overview' && <OverviewPanel />}
        {tab === 'Register user' && <RegisterUserPanel />}
        {tab === 'All citizens' && <AllCitizensPanel />}
        {tab === 'All users' && <AllUsersPanel />}
      </main>
    </>
  );
}

function OverviewPanel() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [citizens, kycPending, firearms, audits] = await Promise.allSettled([
          api.get('/api/citizens/all'),
          api.get('/api/kyc/pending'),
          api.get('/api/firearm/all'),
          api.get('/api/audit/all'),
        ]);
        setStats({
          citizens: citizens.status === 'fulfilled' ? (unwrap(citizens.value) || []).length : '—',
          kycPending: kycPending.status === 'fulfilled' ? (unwrap(kycPending.value) || []).length : '—',
          firearms: firearms.status === 'fulfilled' ? (unwrap(firearms.value) || []).length : '—',
          audits: audits.status === 'fulfilled' ? (unwrap(audits.value) || []).length : '—',
        });
      } catch (err) {
        toast.error('Could not load system overview', apiErrorMessage(err));
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats ? stats.citizens : <span className="skeleton-line" style={{ width: 40 }} />}</div>
          <div className="stat-label">Registered citizens</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats ? stats.kycPending : <span className="skeleton-line" style={{ width: 40 }} />}</div>
          <div className="stat-label">Pending KYC requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats ? stats.firearms : <span className="skeleton-line" style={{ width: 40 }} />}</div>
          <div className="stat-label">Firearm applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats ? stats.audits : <span className="skeleton-line" style={{ width: 40 }} />}</div>
          <div className="stat-label">Audit log entries</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Quick access</h2></div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {CONSOLES.map((c) => (
            <button
              key={c.path}
              onClick={() => navigate(c.path)}
              style={{
                textAlign: 'left', padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                background: 'var(--surface-raised)', cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterUserPanel() {
  const initial = { username: '', password: '', fullName: '', email: '', role: 'POLICE_OFFICER', badgeNumber: '', stationCode: '' };
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.badgeNumber) delete payload.badgeNumber;
      if (!payload.stationCode) delete payload.stationCode;
      const res = await api.post('/api/auth/register', payload);
      const data = unwrap(res);
      toast.success('User registered', `${data.username} · ${data.role}`);
      setForm(initial);
    } catch (err) {
      toast.error('Registration failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <div className="panel-header"><h2>Register a new user</h2></div>
      <div className="panel-body">
        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input required value={form.username} onChange={set('username')} />
          </div>
          <div className="field">
            <label>Password</label>
            <input required type="password" value={form.password} onChange={set('password')} />
          </div>
          <div className="field">
            <label>Full name</label>
            <input required value={form.fullName} onChange={set('fullName')} />
          </div>
          <div className="field">
            <label>Email</label>
            <input required type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={set('role')}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Badge number (optional)</label>
            <input value={form.badgeNumber} onChange={set('badgeNumber')} />
          </div>
          <div className="field">
            <label>Station code (optional)</label>
            <input value={form.stationCode} onChange={set('stationCode')} />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Registering…' : 'Register user'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AllCitizensPanel() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/citizens/all');
      setCitizens(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load citizens', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const displayedCitizens = citizens
    .filter((c) => {
      if (!searchText.trim()) return true;
      const q = searchText.trim().toLowerCase();
      return (
        (c.fullName || '').toLowerCase().includes(q) ||
        (c.referenceNumber || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>All registered citizens</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Search name, ref, phone, email…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ padding: '6px 9px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 200 }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
          >
            Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 18 }}><span className="spinner dark" /></div>
        ) : displayedCitizens.length === 0 ? (
          <div className="empty-row">No citizens found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr><th>Reference</th><th>Full name</th><th>Phone</th><th>Email</th><th>ID proof</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {displayedCitizens.map((c) => (
                  <tr key={c.referenceNumber || c.id}>
                    <td><LedgerTag>{c.referenceNumber}</LedgerTag></td>
                    <td>{c.fullName}</td>
                    <td>{c.phone}</td>
                    <td>{c.email}</td>
                    <td>{c.idProofType}</td>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AllUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingUsername, setDeletingUsername] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/users');
      const nonCitizens = (unwrap(res) || []).filter((u) => u.role !== 'CITIZEN');
      setUsers(nonCitizens);
    } catch (err) {
      toast.error('Could not load users', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const displayedUsers = users
    .filter((u) => {
      if (!searchText.trim()) return true;
      const q = searchText.trim().toLowerCase();
      return (
        (u.username || '').toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleDelete = async (username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone. Their citizen record and history, if any, will be preserved.`)) {
      return;
    }
    setDeletingUsername(username);
    try {
      await api.delete(`/api/auth/users/${username}`);
      toast.success('User deactivated', username);
      load();
    } catch (err) {
      toast.error('Delete failed', apiErrorMessage(err));
    } finally {
      setDeletingUsername(null);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>All users</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Search username, name, email, role…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ padding: '6px 9px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 220 }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
          >
            Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 18 }}><span className="spinner dark" /></div>
        ) : displayedUsers.length === 0 ? (
          <div className="empty-row">No users found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Username</th><th>Full name</th><th>Email</th><th>Role</th>
                  <th>Badge</th><th>Station</th><th>Created</th><th></th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((u) => (
                  <tr key={u.username}>
                    <td>{u.username}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.badgeNumber || '—'}</td>
                    <td>{u.stationCode || '—'}</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      {u.username === currentUser?.username ? (
                        <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>You</span>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deletingUsername === u.username}
                          onClick={() => handleDelete(u.username)}
                        >
                          {deletingUsername === u.username ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}