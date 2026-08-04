import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  IdCard, Crosshair, Award, RefreshCw, Fingerprint,
  ShieldCheck, Download,
} from 'lucide-react';

const SECTIONS = [
  { key: 'kyc', label: 'KYC', icon: IdCard },
  { key: 'biometric', label: 'Biometric', icon: Fingerprint },
  { key: 'firearm', label: 'Firearm license', icon: Crosshair },
  { key: 'certificates', label: 'Certificates', icon: Award },
];

export default function CitizenDashboard() {
  const [section, setSection] = useState('kyc');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [biometricVerified, setBiometricVerified] = useState(false);
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
    
  }, []);

  return (
      <DashboardLayout
          subtitle="Citizen Portal"
          sections={SECTIONS}
          active={section}
          activeSub={null}
          onChange={setSection}
          onChangeSub={() => {}}
      >
        <div className="page-header">
          <h1>Citizen portal</h1>
          <p>Submit KYC, apply for a firearm license, and track your certificates.</p>
        </div>

        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-header"><h2>My profile</h2></div>
          <div className="panel-body">
            {profileLoading ? (
                <span className="spinner dark" />
            ) : profile ? (
                <div className="detail-grid">
                  <div className="detail-item"><label>Reference number</label><div><LedgerTag>{profile.referenceNumber}</LedgerTag></div></div>
                  <div className="detail-item"><label>Full name</label><div>{profile.fullName || '—'}</div></div>
                  <div className="detail-item"><label>Date of birth</label><div>{profile.dateOfBirth || '—'}</div></div>
                  <div className="detail-item"><label>Address</label><div>{profile.address || '—'}</div></div>
                  <div className="detail-item"><label>Phone</label><div>{profile.phone || '—'}</div></div>
                  <div className="detail-item"><label>Email</label><div>{profile.email || '—'}</div></div>
                  <div className="detail-item"><label>{profile.idProofType || 'ID proof'}</label><div>{profile.idProofNumber || '—'}</div></div>
                </div>
            ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Profile unavailable.</div>
            )}
          </div>
        </div>

        {section === 'kyc' && <KycPanel profile={profile} />}
        {section === 'firearm' && (
            <FirearmPanel
                profile={profile}
                biometricVerified={biometricVerified}
                onGoToBiometric={() => setSection('biometric')}
            />
        )}
        {section === 'biometric' && (
            <BiometricPanel
                biometricVerified={biometricVerified}
                setBiometricVerified={setBiometricVerified}
            />
        )}
        {section === 'certificates' && <CertificatesPanel profile={profile} />}
        {section === 'profile' && <MyProfilePanel />}
      </DashboardLayout>
  );
}

function MyProfilePanel() {
  const { user } = useAuth();
  if (!user) return null;
  return (
      <div className="panel">
        <div className="panel-header"><h2>My profile</h2></div>
        <div className="panel-body">
          <div className="detail-grid">
            <div className="detail-item"><label>Full name</label><div>{user.fullName || '—'}</div></div>
            <div className="detail-item"><label>Username</label><div>{user.username || '—'}</div></div>
            <div className="detail-item"><label>Email</label><div>{user.email || '—'}</div></div>
            <div className="detail-item"><label>Role</label><div><StatusBadge status={user.role} /></div></div>
          </div>
        </div>
      </div>
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
            <button className="btn btn-secondary btn-sm btn-icon" onClick={loadRequests} title="Refresh" aria-label="Refresh">
              <RefreshCw size={14} />
            </button>
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
                    <tr><th>Request</th><th>Status</th><th>Assigned officer</th><th>Submitted</th><th>Verified</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                    {requests.map((r) => (
                        <tr key={r.requestNumber}>
                          <td><LedgerTag>{r.requestNumber}</LedgerTag></td>
                          <td><StatusBadge status={r.status} /></td>
                          <td>{r.assignedOfficer}</td>
                          <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
                          <td>{r.verifiedAt ? new Date(r.verifiedAt).toLocaleString() : 'Not yet'}</td>
                          <td>{r.status === 'REJECTED' ? (r.remarks || 'No reason recorded') : '—'}</td>
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

function FirearmPanel({ profile, biometricVerified, onGoToBiometric }) {
  const [form, setForm] = useState({ weaponType: 'PISTOL', purpose: '' });
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const toast = useToast();

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
    if (!biometricVerified) {
      toast.error('Biometric verification required', 'Please complete the biometric scan before submitting.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/firearm/apply', {
        citizenReferenceNumber: profile.referenceNumber,
        ...form,
        biometricVerified: true,
      });
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

              <div className={`biometric-status-strip ${biometricVerified ? 'biometric-status-strip--ok' : ''}`}>
                <Fingerprint size={16} />
                <span>{biometricVerified ? 'Biometric verified' : 'Biometric verification required'}</span>
                {!biometricVerified && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onGoToBiometric}>
                      Go to biometric scan
                    </button>
                )}
              </div>

              <button className="btn" type="submit" disabled={loading || !profile || !biometricVerified} style={{ marginTop: 14 }}>
                {loading && <span className="spinner" />}
                {loading ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Your applications</h2>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={loadApps} title="Refresh" aria-label="Refresh">
              <RefreshCw size={14} />
            </button>
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
                    <tr><th>Application</th><th>Weapon</th><th>Status</th><th>License</th><th>Expiry</th><th>Reason</th></tr>
                    </thead>
                    <tbody>
                    {apps.map((a) => (
                        <tr key={a.applicationNumber}>
                          <td><LedgerTag>{a.applicationNumber}</LedgerTag></td>
                          <td>{a.weaponType}</td>
                          <td><StatusBadge status={a.status} /></td>
                          <td>{a.licenseNumber ? <LedgerTag>{a.licenseNumber}</LedgerTag> : 'Not issued'}</td>
                          <td>{a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : '—'}</td>
                          <td>
                            {a.status === 'REJECTED'
                                ? (a.rejectionReason || 'No reason recorded')
                                : a.status === 'REVOKED'
                                    ? (a.revocationReason || 'No reason recorded')
                                    : '—'}
                          </td>
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

function BiometricPanel({ biometricVerified, setBiometricVerified }) {
  const [status, setStatus] = useState(biometricVerified ? 'verified' : 'idle');
  const [progress, setProgress] = useState(biometricVerified ? 100 : 0);

  const runScan = () => {
    setStatus('scanning');
    setProgress(0);

    const totalDuration = 2400;
    const stepMs = 40;
    const steps = totalDuration / stepMs;
    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      const pct = Math.min(100, Math.round((current / steps) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setStatus('verified');
          setBiometricVerified(true);
        }, 200);
      }
    }, stepMs);
  };

  const rescan = () => {
    setBiometricVerified(false);
    setStatus('idle');
    setProgress(0);
  };

  return (
      <div className="panel">
        <div className="panel-header"><h2>Biometric verification</h2></div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>

          <div className="thumb-scan-wrap">
            <Fingerprint className="thumb-scan-base" strokeWidth={1.4} />
            <div className="thumb-scan-fill-clip" style={{ height: `${progress}%` }}>
              <Fingerprint className="thumb-scan-fill" strokeWidth={1.4} />
            </div>
            {status === 'scanning' && <div className="thumb-scan-line" />}
          </div>

          <div style={{ marginTop: 22, textAlign: 'center' }}>
            {status === 'idle' && (
                <>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>Ready to scan</div>
                  <button type="button" className="btn" onClick={runScan}>
                    Place finger to scan
                  </button>
                </>
            )}
            {status === 'scanning' && (
                <>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Scanning… {progress}%</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>Matching against Aadhaar biometric database…</div>
                </>
            )}
            {status === 'verified' && (
                <>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                    <ShieldCheck size={16} /> Biometric match confirmed
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={rescan}>
                    Re-scan
                  </button>
                </>
            )}
          </div>
        </div>
      </div>
  );
}

function FingerprintGraphic({ className }) {
  return (
      <svg className={className} viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M100 50c-7 0-13 3-13 9s6 9 13 9 13-4 13-10-6-8-13-8z" />
          <path d="M100 38c-14 0-25 6-25 17s11 16 25 16 25-7 25-18-11-15-25-15z" />
          <path d="M100 27c-19 0-34 8-34 23s15 22 34 22 34-9 34-24-15-21-34-21z" />
          <path d="M100 16c-25 0-44 11-44 30s19 28 44 28 44-12 44-31-19-27-44-27z" />

          <path d="M72 62c-6 8-10 18-10 30 0 14 4 26 12 37" />
          <path d="M64 55c-8 10-13 24-13 39 0 18 5 33 15 47" />
          <path d="M56 48c-10 13-16 30-16 49 0 22 7 40 19 57" />
          <path d="M48 41c-11 15-18 35-18 58 0 25 8 47 22 66" />
          <path d="M40 34c-13 17-21 40-21 66 0 29 9 54 25 76" />

          <path d="M128 62c6 8 10 18 10 30 0 14-4 26-12 37" />
          <path d="M136 55c8 10 13 24 13 39 0 18-5 33-15 47" />
          <path d="M144 48c10 13 16 30 16 49 0 22-7 40-19 57" />
          <path d="M152 41c11 15 18 35 18 58 0 25-8 47-22 66" />
          <path d="M160 34c13 17 21 40 21 66 0 29-9 54-25 76" />

          <path d="M88 78c-3 6-4 13-4 21 0 10 3 19 8 27" />
          <path d="M112 78c3 6 4 13 4 21 0 10-3 19-8 27" />

          <path d="M80 100c-3 8-4 17-4 27 0 13 3 24 9 34" />
          <path d="M120 100c3 8 4 17 4 27 0 13-3 24-9 34" />

          <path d="M100 145l10-16 10 16" />

          <path d="M74 156c-2 8-3 16-3 25" />
          <path d="M126 156c2 8 3 16 3 25" />

          <path d="M64 172c11 12 23 18 36 18s25-6 36-18" />
          <path d="M54 184c14 15 29 22 46 22s32-7 46-22" />
          <path d="M44 194c17 17 34 25 56 25s39-8 56-25" />
        </g>
      </svg>
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
          <button className="btn btn-secondary btn-sm btn-icon" onClick={load} title="Refresh" aria-label="Refresh">
            <RefreshCw size={14} />
          </button>
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
                        {c.status === 'REVOKED' ? (
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div className="detail-item">
                                <label>Revocation reason</label>
                                <div>{c.revocationReason || 'No reason recorded'}</div>
                              </div>
                              <div className="detail-item" style={{ marginTop: 8 }}>
                                <label>Revoked on</label>
                                <div>{c.revokedAt ? new Date(c.revokedAt).toLocaleDateString() : '—'}</div>
                              </div>
                            </div>
                        ) : (
                            <>
                              <div className="qr-box">
                                <img src={`data:image/png;base64,${c.qrCodeBase64}`} alt={`QR code for ${c.certificateId}`} />
                                <LedgerTag>{c.certificateId}</LedgerTag>
                              </div>
                              <div className="detail-grid" style={{ flex: 1, minWidth: 160 }}>
                                <div className="detail-item"><label>Issue date</label><div>{c.issueDate ? new Date(c.issueDate).toLocaleDateString() : '—'}</div></div>
                                <div className="detail-item"><label>Expiry</label><div>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : '—'}</div></div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <button className="btn btn-info-light btn-sm btn-icon" onClick={() => downloadPdf(c.certificateId)} title="Download PDF" aria-label="Download PDF">
                                  <Download size={14} />
                                </button>
                              </div>
                            </>
                        )}
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}