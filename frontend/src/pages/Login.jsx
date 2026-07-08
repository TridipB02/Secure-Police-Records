import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useAuth, ROLE_HOME } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const data = unwrap(res);
      login(data);
      navigate(ROLE_HOME[data.role] || '/login');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1.5px solid var(--ink)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontFamily: 'var(--font-mono)', fontSize: 14,
          }}>SP</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>
            Secure Police Record System
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: 0, fontFamily: 'var(--font-mono)' }}>
            Authorized personnel and registered citizens only
          </p>
        </div>

        <div className="panel">
          <div className="panel-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading && <span className="spinner" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 16 }}>
          Access is logged and audited. Session tokens expire after 24 hours.
        </p>
      </div>
    </div>
  );
}
