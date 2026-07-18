import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';

const TABS = ['KYC', 'Firearm license', 'Certificates'];

export default function CitizenDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await api.get('/api/citizens/me');
        setProfile(unwrap(res));
      } catch (err) {
        toast.error('Could not load your profile', apiErrorMessage(err));
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line
  }, []);

  return (
      <>
        <Navbar subtitle="Citizen Portal" />
        <main className="main">
          <div className="page-header">
            <h1>Citizen portal</h1>
            <p>Submit KYC, apply for a firearm license, and track your certificates.</p>
          </div>

          <div className="panel" style={{ marginBottom: 18 }}>
            <div className="panel-body" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              {profileLoading ? (
                  <span className="spinner dark" />
              ) : profile ? (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                        Your citizen reference number
                      </div>
                      <LedgerTag>{profile.referenceNumber}</LedgerTag>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                        Full name
                      </div>
                      <div style={{ fontWeight: 500 }}>{profile.fullName}</div>
                    </div>
                  </>
              ) : (
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Profile unavailable.</div>
              )}
            </div>
          </div>

          <div className="tabs">
            {TABS.map((t) => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          {tab === 'KYC' && <KycPanel profile={profile} />}
          {tab === 'Firearm license' && <FirearmPanel profile={profile} />}
          {tab === 'Certificates' && <CertificatesPanel profile={profile} />}
        </main>
      </>
  );
}

function KycPanel({ profile }) {
  const [submitLoading, setSubmitLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const toast = useToast();

  const loadRequests = async () => {
    if (!profile) return;
    setListLoading(true);
    try {
      const res = await api.get(`/api/kyc/citizen/${profile.referenceNumber}`);
      setRequests(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load your KYC requests', apiErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { loadRequests(); /* eslint-disable-next-line */ }, [profile]);

  const submit = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitLoading(true);
    try {
      const res = await api.post('/api/kyc/submit', { citizenReferenceNumber: profile.referenceNumber });
      const data = unwrap(res);
      toast.success('KYC submitted', data.requestNumber);
      loadRequests();
    } catch (err) {
      toast.error('Submission failed', apiErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
      <div>
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-header"><h2>Submit KYC</h2></div>
          <div className="panel-body">
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>
              This will submit a new KYC verification request under your citizen reference number.
            </p>
            <button className="btn" onClick={submit} disabled={submitLoading || !profile}>
              {submitLoading && <span className="spinner" />}
              {submitLoading ? 'Submitting…' : 'Submit new KYC request'}
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Your KYC requests</h2>
            <button className="btn btn-secondary btn-sm" onClick={loadRequests}>Refresh</button>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {listLoading ? (
                <div style={{ padding: 18 }}><span className="spinner dark" /></div>
            ) : requests.length === 0 ? (
                <div className="empty-row">No KYC requests yet.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data">
                    <thead>
                      <tr><th>Request</th><th>Status</th><th>Assigned officer</th><th>Submitted</th><th>Verified</th></tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                          <tr key={r.requestNumber}>
                            <td><LedgerTag>{r.requestNumber}</LedgerTag></td>
                            <td><StatusBadge status={r.status} /></td>
                            <td>{r.assignedOfficer}</td>
                            <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
                            <td>{r.verifiedAt ? new Date(r.verifiedAt).toLocaleString() : 'Not yet'}</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

function FirearmPanel({ profile }) {
  const [form, setForm] = useState({ weaponType: 'PISTOL', purpose: '' });
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [biometricStatus, setBiometricStatus] = useState('idle');
  const toast = useToast();

  const runBiometricScan = () => {
    setBiometricStatus('scanning');
    setTimeout(() => setBiometricStatus('verified'), 1500);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadApps = async () => {
    if (!profile) return;
    setListLoading(true);
    try {
      const res = await api.get(`/api/firearm/citizen/${profile.referenceNumber}`);
      setApps(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load your applications', apiErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { loadApps(); /* eslint-disable-next-line */ }, [profile]);

  const apply = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const res = await api.post('/api/firearm/apply', { citizenReferenceNumber: profile.referenceNumber, ...form });
      const data = unwrap(res);
      toast.success('Application submitted', data.applicationNumber);
      setForm({ weaponType: 'PISTOL', purpose: '' });
      loadApps();
    } catch (err) {
      toast.error('Application failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div>
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-header"><h2>Apply for firearm license</h2></div>
          <div className="panel-body">
            <form onSubmit={apply}>
              <div className="field">
                <label>Weapon type</label>
                <select value={form.weaponType} onChange={set('weaponType')}>
                  <option value="PISTOL">Pistol</option>
                  <option value="REVOLVER">Revolver</option>
                  <option value="RIFLE">Rifle</option>
                  <option value="SHOTGUN">Shotgun</option>
                </select>
              </div>
              <div className="field">
                <label>Purpose</label>
                <textarea required rows={3} value={form.purpose} onChange={set('purpose')} placeholder="Self defense due to security threat" />
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 14, background: 'var(--surface-raised)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Biometric Verification (Simulated)</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 10 }}>
                  Simulates Aadhaar-based fingerprint authentication. Not a real biometric capture — see project documentation.
                </div>
                {biometricStatus === 'idle' && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={runBiometricScan}>
                      Simulate Fingerprint Scan
                    </button>
                )}
                {biometricStatus === 'scanning' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span className="spinner dark" /> Scanning fingerprint…
                    </div>
                )}
                {biometricStatus === 'verified' && (
                    <div style={{ fontSize: 12.5, color: 'var(--status-green)', fontWeight: 600 }}>
                      ✓ Biometric match confirmed
                    </div>
                )}
              </div>
              <button className="btn" type="submit" disabled={loading || !profile || biometricStatus !== 'verified'}>
                {loading && <span className="spinner" />}
                {loading ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Your applications</h2>
            <button className="btn btn-secondary btn-sm" onClick={loadApps}>Refresh</button>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {listLoading ? (
                <div style={{ padding: 18 }}><span className="spinner dark" /></div>
            ) : apps.length === 0 ? (
                <div className="empty-row">No firearm applications yet.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data">
                    <thead>
                      <tr><th>Application</th><th>Weapon</th><th>Status</th><th>License</th><th>Expiry</th></tr>
                    </thead>
                    <tbody>
                      {apps.map((a) => (
                          <tr key={a.applicationNumber}>
                            <td><LedgerTag>{a.applicationNumber}</LedgerTag></td>
                            <td>{a.weaponType}</td>
                            <td><StatusBadge status={a.status} /></td>
                            <td>{a.licenseNumber ? <LedgerTag>{a.licenseNumber}</LedgerTag> : 'Not issued'}</td>
                            <td>{a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : '—'}</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

function CertificatesPanel({ profile }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/certificates/citizen/${profile.referenceNumber}`);
      setCerts(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load certificates', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [profile]);

  const downloadPdf = async (certificateId) => {
    try {
      const res = await api.get(`/api/certificates/${certificateId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Download failed', apiErrorMessage(err));
    }
  };

  return (
      <div className="panel">
        <div className="panel-header">
          <h2>Your certificates</h2>
          <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
        </div>
        <div className="panel-body">
          {loading ? (
              <div style={{ padding: 18 }}><span className="spinner dark" /></div>
          ) : certs.length === 0 ? (
              <div className="empty-row">No certificates found.</div>
          ) : (
              <div className="grid-2">
                {certs.map((c) => (
                    <div className="panel" key={c.certificateId}>
                      <div className="panel-header">
                        <h2>{c.certificateType.replace('_', ' ')}</h2>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="panel-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div className="qr-box">
                          <img src={`data:image/png;base64,${c.qrCodeBase64}`} alt={`QR code for ${c.certificateId}`} />
                          <LedgerTag>{c.certificateId}</LedgerTag>
                        </div>
                        <div className="detail-grid" style={{ flex: 1, minWidth: 160 }}>
                          <div className="detail-item"><label>Issue date</label><div>{c.issueDate ? new Date(c.issueDate).toLocaleDateString() : '—'}</div></div>
                          <div className="detail-item"><label>Expiry</label><div>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : '—'}</div></div>
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => downloadPdf(c.certificateId)}>
                          Download PDF
                        </button>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}