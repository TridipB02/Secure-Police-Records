import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  FileInput, Search as SearchIcon, ShieldAlert,
  CheckCircle2, XCircle, Ban, RefreshCw, Award, Download,
} from 'lucide-react';

const SECTIONS = [
  { key: 'ANTECEDENT_CHECK', label: 'Antecedent check', icon: ShieldAlert },
  { key: 'SUBMITTED', label: 'Submitted', icon: FileInput },
  { key: 'UNDER_REVIEW', label: 'Under review', icon: SearchIcon },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
  { key: 'CERTIFICATES', label: 'Certificates', icon: Award },
  { key: 'REVOKED', label: 'Revoked', icon: Ban },
  { key: 'REJECTED', label: 'Rejected', icon: XCircle },
];

export default function LicensingDashboard() {
  const [statusFilter, setStatusFilter] = useState('ANTECEDENT_CHECK');

  const changeSection = (key) => {
    setStatusFilter(key);
  };

  return (
      <DashboardLayout
          subtitle="Licensing Authority"
          sections={SECTIONS}
          active={statusFilter}
          activeSub={null}
          onChange={changeSection}
          onChangeSub={() => {}}
      >
        <div className="page-header">
          <h1>Firearm licensing console</h1>
          <p>Review applications, approve or reject, and issue certificates.</p>
        </div>

        {statusFilter === 'profile' && <ProfilePanel />}
        {statusFilter === 'CERTIFICATES' && <CertificatesPanel />}
        {statusFilter !== 'profile' && statusFilter !== 'CERTIFICATES' && (
            <ApplicationsPanel statusFilter={statusFilter} />
        )}
      </DashboardLayout>
  );
}

function ProfilePanel() {
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

function ApplicationsPanel({ statusFilter }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reasonMap, setReasonMap] = useState({});
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/firearm/status/${statusFilter}`);
      setApps(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load applications', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const displayedApps = apps
      .filter((a) => {
        if (!searchText.trim()) return true;
        const q = searchText.trim().toLowerCase();
        return (
            (a.citizenName || '').toLowerCase().includes(q) ||
            (a.citizenReference || '').toLowerCase().includes(q) ||
            (a.applicationNumber || '').toLowerCase().includes(q) ||
            (a.licenseNumber || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

  const updateStatus = async (applicationNumber, status) => {
    const needsReason = status === 'REJECTED' || status === 'REVOKED';
    const reason = reasonMap[applicationNumber];
    if (needsReason && !reason) {
      toast.error('Reason required', `Provide a reason before you ${status.toLowerCase()} this application.`);
      return;
    }
    setBusyId(applicationNumber);
    try {
      await api.put('/api/firearm/status', { applicationNumber, status, ...(needsReason ? { reason } : {}) });
      toast.success(`Application ${status.toLowerCase()}`, applicationNumber);
      load();
    } catch (err) {
      toast.error('Update failed', apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
      <div className="panel">
        <div className="panel-header">
          <h2>Applications</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="search-input-wrap">
              <SearchIcon size={13} className="search-input-icon" />
              <input
                  placeholder="Citizen name"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ padding: '6px 9px 6px 28px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 220 }}
              />
            </div>
            <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            >
              Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={load} title="Refresh" aria-label="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
              <div style={{ padding: 18 }}><span className="spinner dark" /></div>
          ) : displayedApps.length === 0 ? (
              <div className="empty-row">No applications found.</div>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data">
                  <thead>
                  <tr>
                    <th>Application</th>
                    <th>Citizen</th>
                    <th>Weapon</th>
                    <th>Purpose</th>
                    <th>Biometric</th>
                    <th>Status</th>
                    <th>License</th>
                    <th>Reason (reject/revoke)</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {displayedApps.map((a) => (
                      <tr key={a.applicationNumber}>
                        <td><LedgerTag>{a.applicationNumber}</LedgerTag></td>
                        <td>
                          <div style={{ fontWeight: 500, marginBottom: 2 }}>{a.citizenName || '—'}</div>
                          <LedgerTag truncate={22}>{a.citizenReference}</LedgerTag>
                        </td>
                        <td>{a.weaponType}</td>
                        <td style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: 12.5 }}>{a.purpose}</td>
                        <td>{a.biometricVerified ? <span style={{ color: 'var(--status-green)', fontSize: 12 }}>✓ Verified</span> : <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>—</span>}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td>
                          {a.licenseNumber ? (
                              <div>
                                <LedgerTag>{a.licenseNumber}</LedgerTag>
                                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3 }}>
                                  exp. {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : '—'}
                                </div>
                              </div>
                          ) : '—'}
                        </td>
                        <td>
                          {(a.status === 'REJECTED' || a.status === 'REVOKED') ? (
                              <div style={{ fontSize: 12, color: 'var(--ink-soft)', maxWidth: 170, whiteSpace: 'normal' }}>
                                {(a.status === 'REJECTED' ? a.rejectionReason : a.revocationReason) || 'No reason recorded'}
                              </div>
                          ) : (
                              <input
                                  placeholder="Reason (reject/revoke)"
                                  value={reasonMap[a.applicationNumber] || ''}
                                  onChange={(e) => setReasonMap((m) => ({ ...m, [a.applicationNumber]: e.target.value }))}
                                  style={{ padding: '5px 8px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 170 }}
                              />
                          )}
                        </td>
                        <td>
                          <div className="btn-row" style={{ marginTop: 0 }}>
                            {a.status === 'SUBMITTED' && (
                                <>
                                  <button className="btn btn-secondary btn-sm" disabled={busyId === a.applicationNumber} onClick={() => updateStatus(a.applicationNumber, 'ANTECEDENT_CHECK')}>
                                    Send for antecedent check
                                  </button>
                                  <button className="btn btn-sm" disabled={busyId === a.applicationNumber} onClick={() => updateStatus(a.applicationNumber, 'APPROVED')}>Approve</button>
                                  <button className="btn btn-secondary btn-sm" disabled={busyId === a.applicationNumber} onClick={() => updateStatus(a.applicationNumber, 'REJECTED')}>Reject</button>
                                </>
                            )}
                            {(a.status === 'ANTECEDENT_CHECK' || a.status === 'UNDER_REVIEW') && (
                                <>
                                  <button className="btn btn-sm" disabled={busyId === a.applicationNumber} onClick={() => updateStatus(a.applicationNumber, 'APPROVED')}>Approve</button>
                                  <button className="btn btn-secondary btn-sm" disabled={busyId === a.applicationNumber} onClick={() => updateStatus(a.applicationNumber, 'REJECTED')}>Reject</button>
                                </>
                            )}
                            {a.status === 'APPROVED' && (
                                <button className="btn btn-danger btn-sm" disabled={busyId === a.applicationNumber} onClick={() => updateStatus(a.applicationNumber, 'REVOKED')}>Revoke</button>
                            )}
                          </div>
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

function CertificatesPanel() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [certificates, setCertificates] = useState({});
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/firearm/status/APPROVED');
      setApps(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load approved applications', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const displayedApps = apps
      .filter((a) => {
        if (!searchText.trim()) return true;
        const q = searchText.trim().toLowerCase();
        return (
            (a.citizenName || '').toLowerCase().includes(q) ||
            (a.citizenReference || '').toLowerCase().includes(q) ||
            (a.applicationNumber || '').toLowerCase().includes(q) ||
            (a.licenseNumber || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

  const generateCertificate = async (applicationNumber) => {
    setBusyId(applicationNumber);
    try {
      const res = await api.post(`/api/certificates/firearm/${applicationNumber}`);
      const data = unwrap(res);
      setCertificates((c) => ({ ...c, [applicationNumber]: data }));
      toast.success('Certificate generated', data.certificateId);
    } catch (err) {
      toast.error('Certificate generation failed', apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const downloadCertificatePdf = async (certificateId) => {
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
          <h2>Certificates</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="search-input-wrap">
              <SearchIcon size={13} className="search-input-icon" />
              <input
                  placeholder="Citizen name"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ padding: '6px 9px 6px 28px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 220 }}
              />
            </div>
            <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            >
              Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={load} title="Refresh" aria-label="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
              <div style={{ padding: 18 }}><span className="spinner dark" /></div>
          ) : displayedApps.length === 0 ? (
              <div className="empty-row">No approved applications awaiting certification.</div>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data">
                  <thead>
                  <tr>
                    <th>Application</th>
                    <th>Citizen</th>
                    <th>Weapon</th>
                    <th>License</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {displayedApps.map((a) => (
                      <tr key={a.applicationNumber}>
                        <td><LedgerTag>{a.applicationNumber}</LedgerTag></td>
                        <td>
                          <div style={{ fontWeight: 500, marginBottom: 2 }}>{a.citizenName || '—'}</div>
                          <LedgerTag truncate={22}>{a.citizenReference}</LedgerTag>
                        </td>
                        <td>{a.weaponType}</td>
                        <td>
                          {a.licenseNumber ? (
                              <div>
                                <LedgerTag>{a.licenseNumber}</LedgerTag>
                                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 3 }}>
                                  exp. {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : '—'}
                                </div>
                              </div>
                          ) : '—'}
                        </td>
                        <td>
                          {!certificates[a.applicationNumber] && (
                              <button className="btn btn-info-light btn-sm" disabled={busyId === a.applicationNumber} onClick={() => generateCertificate(a.applicationNumber)}>
                                <Award size={13} /> Generate certificate
                              </button>
                          )}

                          {certificates[a.applicationNumber] && (
                              <div className="qr-box" style={{ marginTop: 6, alignItems: 'stretch' }}>
                                <img
                                    src={`data:image/png;base64,${certificates[a.applicationNumber].qrCodeBase64}`}
                                    alt={`QR code for ${certificates[a.applicationNumber].certificateId}`}
                                />
                                <LedgerTag>{certificates[a.applicationNumber].certificateId}</LedgerTag>
                                <StatusBadge status={certificates[a.applicationNumber].status} />
                                <button
                                    className="btn btn-info-light btn-sm btn-icon"
                                    onClick={() => downloadCertificatePdf(certificates[a.applicationNumber].certificateId)}
                                    title="Download PDF"
                                    aria-label="Download PDF"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
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