import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ANTECEDENT_CHECK', 'APPROVED', 'REJECTED', 'REVOKED'];

export default function LicensingDashboard() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reasonMap, setReasonMap] = useState({});
  const [certificates, setCertificates] = useState({});
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const toast = useToast();

  const load = async (status) => {
    setLoading(true);
    try {
      const url = status ? `/api/firearm/status/${status}` : '/api/firearm/all';
      const res = await api.get(url);
      setApps(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load applications', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filter = (status) => {
    setStatusFilter(status);
    load(status || null);
  };

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
      load(statusFilter || null);
    } catch (err) {
      toast.error('Update failed', apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

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

  const revokeCertificate = async (applicationNumber, certificateId) => {
    const reason = reasonMap[applicationNumber];
    if (!reason) {
      toast.error('Reason required', 'Provide a reason before revoking this certificate.');
      return;
    }
    setBusyId(applicationNumber);
    try {
      const res = await api.put(`/api/certificates/revoke/${certificateId}`, { reason });
      const data = unwrap(res);
      setCertificates((c) => ({ ...c, [applicationNumber]: data }));
      toast.success('Certificate revoked', certificateId);
    } catch (err) {
      toast.error('Revoke failed', apiErrorMessage(err));
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
      <>
        <Navbar subtitle="Licensing Authority" />
        <main className="main">
          <div className="page-header">
            <h1>Firearm licensing console</h1>
            <p>Review applications, approve or reject, and issue certificates.</p>
          </div>

          <div className="tabs">
            <button className={`tab ${!statusFilter ? 'active' : ''}`} onClick={() => filter('')}>All</button>
            {STATUSES.map((s) => (
                <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => filter(s)}>{s}</button>
            ))}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Applications</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  placeholder="Search citizen, application, license…"
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
                <button className="btn btn-secondary btn-sm" onClick={() => load(statusFilter || null)}>Refresh</button>
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
                              <input
                                  placeholder="Reason (reject/revoke/cert)"
                                  value={reasonMap[a.applicationNumber] || ''}
                                  onChange={(e) => setReasonMap((m) => ({ ...m, [a.applicationNumber]: e.target.value }))}
                                  style={{ padding: '5px 8px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 170 }}
                              />
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
                                    <>
                                      <button className="btn btn-secondary btn-sm" disabled={busyId === a.applicationNumber} onClick={() => generateCertificate(a.applicationNumber)}>
                                        Certificate
                                      </button>
                                      <button className="btn btn-danger btn-sm" disabled={busyId === a.applicationNumber} onClick={() => updateStatus(a.applicationNumber, 'REVOKED')}>Revoke</button>
                                    </>
                                )}
                              </div>
                              {certificates[a.applicationNumber] && (
                                  <div className="qr-box" style={{ marginTop: 10, alignItems: 'stretch' }}>
                                    <img
                                        src={`data:image/png;base64,${certificates[a.applicationNumber].qrCodeBase64}`}
                                        alt={`QR code for ${certificates[a.applicationNumber].certificateId}`}
                                    />
                                    <LedgerTag>{certificates[a.applicationNumber].certificateId}</LedgerTag>
                                    <StatusBadge status={certificates[a.applicationNumber].status} />
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => downloadCertificatePdf(certificates[a.applicationNumber].certificateId)}
                                    >
                                      Download PDF
                                    </button>
                                    {certificates[a.applicationNumber].status === 'VALID' && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            disabled={busyId === a.applicationNumber}
                                            onClick={() => revokeCertificate(a.applicationNumber, certificates[a.applicationNumber].certificateId)}
                                        >
                                          Revoke certificate
                                        </button>
                                    )}
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
        </main>
      </>
  );
}
