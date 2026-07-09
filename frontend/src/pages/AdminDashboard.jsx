import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';

const TABS = ['Overview', 'Register user', 'All citizens'];
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
    // eslint-disable-next-line
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

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>All registered citizens</h2>
        <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 18 }}><span className="spinner dark" /></div>
        ) : citizens.length === 0 ? (
          <div className="empty-row">No citizens registered yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr><th>Reference</th><th>Full name</th><th>Phone</th><th>Email</th><th>ID proof</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {citizens.map((c) => (
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
