import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import LedgerTag from '../components/LedgerTag';

const ID_PROOF_TYPES = ['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'];

export default function Register() {
  const initial = {
    username: '', password: '', fullName: '', dateOfBirth: '',
    address: '', phone: '', email: '', idProofType: ID_PROOF_TYPES[0], idProofNumber: '',
  };
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register-citizen', form);
      const data = unwrap(res);
      login(data);
      setRegistered(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const continueToDashboard = () => {
    navigate(ROLE_HOME[registered.role] || '/login');
  };

  return (
    <div style={{
      minHeight: '100%', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: '32px 20px',
    }}>
      <div style={{ width: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1.5px solid var(--ink)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontFamily: 'var(--font-mono)', fontSize: 14,
          }}>SP</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>
            Citizen registration
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: 0, fontFamily: 'var(--font-mono)' }}>
            Create your account to access KYC, firearm licensing, and certificates
          </p>
        </div>

        {registered ? (
          <div className="panel">
            <div className="panel-body">
              <div className="alert" style={{ background: 'var(--status-green-bg)', border: '1px solid #bfe2c9', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--status-green)', marginBottom: 4 }}>
                  Registration successful
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  Save your citizen reference number — you'll need it for KYC, firearm applications, and certificates.
                </div>
              </div>
              <div className="detail-item" style={{ marginBottom: 16 }}>
                <label>Citizen reference number</label>
                <div><LedgerTag>{registered.citizenReferenceNumber}</LedgerTag></div>
              </div>
              <button className="btn" onClick={continueToDashboard} style={{ width: '100%', justifyContent: 'center' }}>
                Continue to dashboard
              </button>
            </div>
          </div>
        ) : (
        <div className="panel">
          <div className="panel-body">
            {error && <div className="alert alert-error">{error}</div>}
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
                <label>Date of birth</label>
                <input required type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              </div>
              <div className="field">
                <label>Address</label>
                <input required value={form.address} onChange={set('address')} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input required value={form.phone} onChange={set('phone')} />
              </div>
              <div className="field">
                <label>Email</label>
                <input required type="email" value={form.email} onChange={set('email')} />
              </div>
              <div className="field">
                <label>ID proof type</label>
                <select value={form.idProofType} onChange={set('idProofType')}>
                  {ID_PROOF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>ID proof number</label>
                <input required value={form.idProofNumber} onChange={set('idProofNumber')} />
              </div>
              <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading && <span className="spinner" />}
                {loading ? 'Creating account…' : 'Register'}
              </button>
            </form>
          </div>
        </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 16 }}>
          <Link to="/login" style={{ color: 'var(--ink-soft)' }}>Already have an account? Sign in</Link>
        </p>
      </div>
    </div>
  );
}