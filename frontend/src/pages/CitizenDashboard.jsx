import { useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';

const TABS = ['KYC', 'Firearm license', 'Certificates'];

export default function CitizenDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  return (
      <>
        <Navbar subtitle="Citizen Portal" />
        <main className="main">
          <div className="page-header">
            <h1>Citizen portal</h1>
            <p>Submit KYC, apply for a firearm license, and track your certificates.</p>
          </div>
          <div className="tabs">
            {TABS.map((t) => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          {tab === 'KYC' && <KycPanel />}
          {tab === 'Firearm license' && <FirearmPanel />}
          {tab === 'Certificates' && <CertificatesPanel />}
        </main>
      </>
  );
}

function KycPanel() {
  const [refNumber, setRefNumber] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!refNumber.trim()) return;
    setSubmitLoading(true);
    try {
      const res = await api.post('/api/kyc/submit', { citizenReferenceNumber: refNumber.trim() });
      const data = unwrap(res);
      setSubmitResult(data);
      toast.success('KYC submitted', data.requestNumber);
    } catch (err) {
      toast.error('Submission failed', apiErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  const checkStatus = async (e) => {
    e.preventDefault();
    if (!statusQuery.trim()) return;
    setStatusLoading(true);
    setStatusResult(null);
    try {
      const res = await api.get(`/api/kyc/status/${statusQuery.trim()}`);
      setStatusResult(unwrap(res));
    } catch (err) {
      toast.error('Lookup failed', apiErrorMessage(err));
    } finally {
      setStatusLoading(false);
    }
  };

  return (
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><h2>Submit KYC</h2></div>
          <div className="panel-body">
            <form onSubmit={submit}>
              <div className="field">
                <label>Citizen reference number</label>
                <input required value={refNumber} onChange={(e) => setRefNumber(e.target.value)} placeholder="CIT-20260702115022-E67DD2" />
                <div className="field-hint">Provided when you were registered by a police officer.</div>
              </div>
              <button className="btn" type="submit" disabled={submitLoading}>
                {submitLoading && <span className="spinner" />}
                {submitLoading ? 'Submitting…' : 'Submit KYC'}
              </button>
            </form>
            {submitResult && (
                <div className="alert alert-success" style={{ marginTop: 16 }}>
                  Request created: <LedgerTag>{submitResult.requestNumber}</LedgerTag>
                </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Check KYC status</h2></div>
          <div className="panel-body">
            <form onSubmit={checkStatus}>
              <div className="field">
                <label>Request number</label>
                <input required value={statusQuery} onChange={(e) => setStatusQuery(e.target.value)} placeholder="KYC-20260702115142-47A52A" />
              </div>
              <button className="btn" type="submit" disabled={statusLoading}>
                {statusLoading ? 'Checking…' : 'Check status'}
              </button>
            </form>
            {statusResult && (
                <div className="detail-grid" style={{ marginTop: 16 }}>
                  <div className="detail-item"><label>Status</label><div><StatusBadge status={statusResult.status} /></div></div>
                  <div className="detail-item"><label>Assigned officer</label><div>{statusResult.assignedOfficer}</div></div>
                  <div className="detail-item"><label>Submitted</label><div>{statusResult.submittedAt ? new Date(statusResult.submittedAt).toLocaleString() : '—'}</div></div>
                  <div className="detail-item"><label>Verified</label><div>{statusResult.verifiedAt ? new Date(statusResult.verifiedAt).toLocaleString() : 'Not yet'}</div></div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

function FirearmPanel() {
  const [form, setForm] = useState({ citizenReferenceNumber: '', weaponType: 'PISTOL', purpose: '' });
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(null);

  const [appNumber, setAppNumber] = useState('');
  const [appStatus, setAppStatus] = useState(null);
  const [appLoading, setAppLoading] = useState(false);
  const [lookupMode, setLookupMode] = useState('application'); // 'application' | 'license'
  const toast = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const apply = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/firearm/apply', form);
      const data = unwrap(res);
      setApplied(data);
      toast.success('Application submitted', data.applicationNumber);
      setForm({ citizenReferenceNumber: '', weaponType: 'PISTOL', purpose: '' });
    } catch (err) {
      toast.error('Application failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (e) => {
    e.preventDefault();
    if (!appNumber.trim()) return;
    setAppLoading(true);
    setAppStatus(null);
    try {
      const url = lookupMode === 'license'
          ? `/api/firearm/license/${appNumber.trim()}`
          : `/api/firearm/application/${appNumber.trim()}`;
      const res = await api.get(url);
      setAppStatus(unwrap(res));
    } catch (err) {
      toast.error('Lookup failed', apiErrorMessage(err));
    } finally {
      setAppLoading(false);
    }
  };

  return (
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><h2>Apply for firearm license</h2></div>
          <div className="panel-body">
            <form onSubmit={apply}>
              <div className="field">
                <label>Citizen reference number</label>
                <input required value={form.citizenReferenceNumber} onChange={set('citizenReferenceNumber')} placeholder="CIT-20260702115022-E67DD2" />
              </div>
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
              <button className="btn" type="submit" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
            {applied && (
                <div className="alert alert-success" style={{ marginTop: 16 }}>
                  Application filed: <LedgerTag>{applied.applicationNumber}</LedgerTag>
                </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Check application status</h2></div>
          <div className="panel-body">
            <div className="tabs" style={{ marginBottom: 16 }}>
              <button
                  type="button"
                  className={`tab ${lookupMode === 'application' ? 'active' : ''}`}
                  onClick={() => { setLookupMode('application'); setAppStatus(null); setAppNumber(''); }}
              >
                By application number
              </button>
              <button
                  type="button"
                  className={`tab ${lookupMode === 'license' ? 'active' : ''}`}
                  onClick={() => { setLookupMode('license'); setAppStatus(null); setAppNumber(''); }}
              >
                By license number
              </button>
            </div>
            <form onSubmit={checkStatus}>
              <div className="field">
                <label>{lookupMode === 'license' ? 'License number' : 'Application number'}</label>
                <input
                    required
                    value={appNumber}
                    onChange={(e) => setAppNumber(e.target.value)}
                    placeholder={lookupMode === 'license' ? 'LIC-20260703105618-762E07' : 'FA-20260702122308-48059E'}
                />
              </div>
              <button className="btn" type="submit" disabled={appLoading}>
                {appLoading ? 'Checking…' : 'Check status'}
              </button>
            </form>
            {appStatus && (
                <div className="detail-grid" style={{ marginTop: 16 }}>
                  <div className="detail-item"><label>Status</label><div><StatusBadge status={appStatus.status} /></div></div>
                  <div className="detail-item"><label>Weapon type</label><div>{appStatus.weaponType}</div></div>
                  <div className="detail-item"><label>License number</label><div>{appStatus.licenseNumber ? <LedgerTag>{appStatus.licenseNumber}</LedgerTag> : 'Not issued'}</div></div>
                  <div className="detail-item"><label>Expiry</label><div>{appStatus.expiryDate ? new Date(appStatus.expiryDate).toLocaleDateString() : '—'}</div></div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

function CertificatesPanel() {
  const [citizenId, setCitizenId] = useState('');
  const [certs, setCerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async (e) => {
    e.preventDefault();
    if (!citizenId.trim()) return;
    setLoading(true);
    setCerts(null);
    try {
      const res = await api.get(`/api/certificates/citizen/${citizenId.trim()}`);
      setCerts(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load certificates', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="panel">
        <div className="panel-header"><h2>Your certificates</h2></div>
        <div className="panel-body">
          <form onSubmit={load} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap' }}>
            <div className="field" style={{ marginBottom: 0, minWidth: 260, flex: 1 }}>
              <label>Citizen ID</label>
              <input value={citizenId} onChange={(e) => setCitizenId(e.target.value)} placeholder="Your citizen ID" />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Loading…' : 'View certificates'}
            </button>
          </form>

          {certs && certs.length === 0 && <div className="empty-row">No certificates found.</div>}

          <div className="grid-2">
            {certs && certs.map((c) => (
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
                      <div className="detail-item"><label>Issued by</label><div>{c.issuedBy}</div></div>
                      <div className="detail-item"><label>Issue date</label><div>{c.issueDate ? new Date(c.issueDate).toLocaleDateString() : '—'}</div></div>
                      <div className="detail-item"><label>Expiry</label><div>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : '—'}</div></div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}
