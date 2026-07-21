import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import RecordCard from '../components/RecordCard';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';

const TABS = ['Pending KYC', 'Verified KYC', 'Register citizen', 'Police records'];

export default function OfficerDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  return (
      <>
        <Navbar subtitle="Officer Console" />
        <main className="main">
          <div className="page-header">
            <h1>Police officer console</h1>
            <p>Verify citizen KYC, register new citizens, and manage police records.</p>
          </div>
          <div className="tabs">
            {TABS.map((t) => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          {tab === 'Pending KYC' && <PendingKycPanel />}
          {tab === 'Verified KYC' && <VerifiedKycPanel />}
          {tab === 'Register citizen' && <RegisterCitizenPanel />}
          {tab === 'Police records' && <RecordsPanel />}
        </main>
      </>
  );
}

function PendingKycPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/kyc/pending');
      setRequests(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load pending requests', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const displayedRequests = requests
    .filter((r) => {
      if (!searchText.trim()) return true;
      const q = searchText.trim().toLowerCase();
      return (
        (r.citizenName || '').toLowerCase().includes(q) ||
        (r.citizenReference || '').toLowerCase().includes(q) ||
        (r.requestNumber || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.submittedAt || 0).getTime();
      const dateB = new Date(b.submittedAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const decide = async (requestNumber, status) => {
    setBusyId(requestNumber);
    try {
      await api.put('/api/kyc/verify', {
        requestNumber,
        status,
        remarks: remarksMap[requestNumber] || (status === 'VERIFIED' ? 'All documents valid' : 'Documents incomplete'),
      });
      toast.success(`KYC ${status.toLowerCase()}`, requestNumber);
      load();
    } catch (err) {
      toast.error('Action failed', apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const genCertificate = async (requestNumber) => {
    setBusyId(requestNumber);
    try {
      await api.post(`/api/certificates/kyc/${requestNumber}`);
      toast.success('Certificate generated', requestNumber);
    } catch (err) {
      toast.error('Certificate generation failed', apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
      <div className="panel">
        <div className="panel-header">
          <h2>Pending KYC requests</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Search citizen or request…"
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
          ) : displayedRequests.length === 0 ? (
              <div className="empty-row">No pending KYC requests.</div>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data">
                  <thead>
                  <tr>
                    <th>Request</th>
                    <th>Citizen</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {displayedRequests.map((r) => (
                      <tr key={r.requestNumber}>
                        <td><LedgerTag>{r.requestNumber}</LedgerTag></td>
                        <td>
                          <div style={{ fontWeight: 500, marginBottom: 2 }}>{r.citizenName || '—'}</div>
                          <LedgerTag truncate={22}>{r.citizenReference}</LedgerTag>
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <input
                              placeholder="Remarks"
                              value={remarksMap[r.requestNumber] || ''}
                              onChange={(e) => setRemarksMap((m) => ({ ...m, [r.requestNumber]: e.target.value }))}
                              style={{ padding: '5px 8px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 160 }}
                          />
                        </td>
                        <td>
                          <div className="btn-row" style={{ marginTop: 0 }}>
                            <button className="btn btn-sm" disabled={busyId === r.requestNumber} onClick={() => decide(r.requestNumber, 'VERIFIED')}>Verify</button>
                            <button className="btn btn-secondary btn-sm" disabled={busyId === r.requestNumber} onClick={() => decide(r.requestNumber, 'REJECTED')}>Reject</button>
                            <button className="btn btn-secondary btn-sm" disabled={busyId === r.requestNumber} onClick={() => genCertificate(r.requestNumber)}>Certificate</button>
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

function VerifiedKycPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [certificates, setCertificates] = useState({});
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/kyc/by-status/VERIFIED');
      setRequests(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load verified requests', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const displayedRequests = requests
    .filter((r) => !certificates[r.requestNumber])
    .filter((r) => {
      if (!searchText.trim()) return true;
      const q = searchText.trim().toLowerCase();
      return (
        (r.citizenName || '').toLowerCase().includes(q) ||
        (r.citizenReference || '').toLowerCase().includes(q) ||
        (r.requestNumber || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.verifiedAt || 0).getTime();
      const dateB = new Date(b.verifiedAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const genCertificate = async (requestNumber) => {
    setBusyId(requestNumber);
    try {
      const res = await api.post(`/api/certificates/kyc/${requestNumber}`);
      const data = unwrap(res);
      setCertificates((c) => ({ ...c, [requestNumber]: data }));
      toast.success('Certificate generated', data.certificateId);
    } catch (err) {
      toast.error('Certificate generation failed', apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

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
          <h2>Verified KYC requests</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Search citizen or request…"
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
          ) : displayedRequests.length === 0 ? (
              <div className="empty-row">No verified KYC requests awaiting certification.</div>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data">
                  <thead>
                    <tr><th>Request</th><th>Citizen</th><th>Verified</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {displayedRequests.map((r) => (
                        <tr key={r.requestNumber}>
                          <td><LedgerTag>{r.requestNumber}</LedgerTag></td>
                          <td>
                            <div style={{ fontWeight: 500, marginBottom: 2 }}>{r.citizenName || '—'}</div>
                            <LedgerTag truncate={22}>{r.citizenReference}</LedgerTag>
                          </td>
                          <td>{r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString() : '—'}</td>
                          <td>
                            <div className="btn-row" style={{ marginTop: 0 }}>
                              {!certificates[r.requestNumber] ? (
                                  <button className="btn btn-sm" disabled={busyId === r.requestNumber} onClick={() => genCertificate(r.requestNumber)}>
                                    Generate certificate
                                  </button>
                              ) : (
                                  <button className="btn btn-secondary btn-sm" onClick={() => downloadPdf(certificates[r.requestNumber].certificateId)}>
                                    Download PDF
                                  </button>
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

function RegisterCitizenPanel() {
  const initial = { fullName: '', dateOfBirth: '', address: '', phone: '', email: '', idProofType: 'AADHAAR', idProofNumber: '' };
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/citizens/register', form);
      const data = unwrap(res);
      setResult(data);
      toast.success('Citizen registered', data.referenceNumber);
      setForm(initial);
    } catch (err) {
      toast.error('Registration failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><h2>Register a citizen</h2></div>
          <div className="panel-body">
            <form onSubmit={submit}>
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
                  <option value="AADHAAR">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VOTER_ID">Voter ID</option>
                </select>
              </div>
              <div className="field">
                <label>ID proof number</label>
                <input required value={form.idProofNumber} onChange={set('idProofNumber')} />
              </div>
              <button className="btn" type="submit" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Registering…' : 'Register citizen'}
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Latest registration</h2></div>
          <div className="panel-body">
            {!result ? (
                <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Register a citizen to see their reference number here.</p>
            ) : (
                <div className="detail-grid">
                  <div className="detail-item"><label>Reference number</label><div><LedgerTag>{result.referenceNumber}</LedgerTag></div></div>
                  <div className="detail-item"><label>Full name</label><div>{result.fullName}</div></div>
                  <div className="detail-item"><label>Phone</label><div>{result.phone}</div></div>
                  <div className="detail-item"><label>Email</label><div>{result.email}</div></div>
                  <div className="detail-item"><label>ID proof</label><div>{result.idProofType}</div></div>
                  <div className="detail-item"><label>Registered</label><div>{result.createdAt ? new Date(result.createdAt).toLocaleString() : '—'}</div></div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

function RecordsPanel() {
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({ citizenReferenceNumber: '', recordType: 'FIR', content: '', actionReason: '', existingRecordId: '' });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [historyId, setHistoryId] = useState('');
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [latestOnly, setLatestOnly] = useState(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const toast = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = mode === 'create'
          ? { citizenReferenceNumber: form.citizenReferenceNumber, recordType: form.recordType, content: form.content, actionReason: form.actionReason }
          : { recordType: form.recordType, content: form.content, actionReason: form.actionReason, existingRecordId: form.existingRecordId };
      const res = mode === 'create'
          ? await api.post('/api/records/create', payload)
          : await api.put('/api/records/update', payload);
      const data = unwrap(res);
      setCreated(data);
      toast.success(mode === 'create' ? 'Record created' : 'Record updated', data.recordId);
      setForm({ citizenReferenceNumber: '', recordType: 'FIR', content: '', actionReason: '', existingRecordId: '' });
    } catch (err) {
      toast.error('Save failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (e) => {
    e.preventDefault();
    if (!historyId.trim()) return;
    setHistoryLoading(true);
    setHistory(null);
    setLatestOnly(null);
    try {
      const res = await api.get(`/api/records/history/${historyId.trim()}`);
      setHistory(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load history', apiErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  const viewLatest = async () => {
    if (!historyId.trim()) return;
    setLatestLoading(true);
    setHistory(null);
    setLatestOnly(null);
    try {
      const res = await api.get(`/api/records/${historyId.trim()}`);
      setLatestOnly(unwrap(res));
    } catch (err) {
      toast.error('Could not load record', apiErrorMessage(err));
    } finally {
      setLatestLoading(false);
    }
  };

  return (
      <div>
        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="panel">
            <div className="panel-header">
              <h2>{mode === 'create' ? 'Create record' : 'Update record'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setMode(mode === 'create' ? 'update' : 'create')}>
                Switch to {mode === 'create' ? 'update' : 'create'}
              </button>
            </div>
            <div className="panel-body">
              <form onSubmit={submit}>
                {mode === 'create' && (
                    <div className="field">
                      <label>Citizen reference number</label>
                      <input required value={form.citizenReferenceNumber} onChange={set('citizenReferenceNumber')} placeholder="CIT-20260702115022-E67DD2" />
                    </div>
                )}
                {mode === 'update' && (
                    <div className="field">
                      <label>Existing record ID</label>
                      <input required value={form.existingRecordId} onChange={set('existingRecordId')} placeholder="REC-20260705120859-F95EF4" />
                    </div>
                )}
                <div className="field">
                  <label>Record type</label>
                  <select value={form.recordType} onChange={set('recordType')}>
                    <option value="FIR">FIR</option>
                    <option value="CHARGESHEET">Chargesheet</option>
                    <option value="ARREST_MEMO">Arrest memo</option>
                    <option value="CASE_DIARY">Case diary</option>
                  </select>
                </div>
                <div className="field">
                  <label>Content</label>
                  <textarea required rows={4} value={form.content} onChange={set('content')} />
                </div>
                <div className="field">
                  <label>Action reason</label>
                  <input required value={form.actionReason} onChange={set('actionReason')} />
                </div>
                <button className="btn" type="submit" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Saving…' : mode === 'create' ? 'Create record' : 'Update record'}
                </button>
              </form>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h2>Latest saved record</h2></div>
            <div className="panel-body">
              {!created ? (
                  <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Create or update a record to see its details and hash here.</p>
              ) : <RecordCard record={created} />}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Record history</h2></div>
          <div className="panel-body">
            <form onSubmit={viewHistory} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="field" style={{ marginBottom: 0, minWidth: 260, flex: 1 }}>
                <label>Record ID</label>
                <input value={historyId} onChange={(e) => setHistoryId(e.target.value)} placeholder="REC-20260705120859-F95EF4" />
              </div>
              <button className="btn" type="submit" disabled={historyLoading}>
                {historyLoading ? 'Loading…' : 'View full history'}
              </button>
              <button type="button" className="btn btn-secondary" disabled={latestLoading} onClick={viewLatest}>
                {latestLoading ? 'Loading…' : 'Latest version only'}
              </button>
            </form>
            {latestOnly && <RecordCard record={latestOnly} />}
            {history && history.length === 0 && <div className="empty-row">No versions found.</div>}
            {history && history.map((rec) => <RecordCard key={rec.id || rec.recordId + rec.version} record={rec} />)}
          </div>
        </div>
      </div>
  );
}
