import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';

const TABS = ['Submit report', 'My reports', 'Search by citizen'];

export default function AntecedentDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <>
      <Navbar subtitle="Antecedent Verification" />
      <main className="main">
        <div className="page-header">
          <h1>Antecedent officer console</h1>
          <p>Submit criminal background reports and review prior submissions.</p>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        {tab === 'Submit report' && <SubmitPanel />}
        {tab === 'My reports' && <MyReportsPanel />}
        {tab === 'Search by citizen' && <SearchByCitizenPanel />}
      </main>
    </>
  );
}

const initialForm = {
  citizenReferenceNumber: '',
  firHistory: '',
  convictionStatus: 'NONE',
  pendingCases: 0,
  blacklistFlag: false,
  overallStatus: 'CLEAR',
};

function SubmitPanel() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked
      : e.target.type === 'number' ? Number(e.target.value)
      : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/antecedent/submit', form);
      const data = unwrap(res);
      setResult(data);
      toast.success('Report submitted', data.reportNumber);
      setForm(initialForm);
    } catch (err) {
      toast.error('Submission failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-header"><h2>Submit antecedent report</h2></div>
        <div className="panel-body">
          <form onSubmit={submit}>
            <div className="field">
              <label>Citizen reference number</label>
              <input required value={form.citizenReferenceNumber} onChange={set('citizenReferenceNumber')} placeholder="CIT-20260702115022-E67DD2" />
            </div>
            <div className="field">
              <label>FIR history</label>
              <textarea required rows={3} value={form.firHistory} onChange={set('firHistory')} placeholder="No FIR registered" />
            </div>
            <div className="field">
              <label>Conviction status</label>
              <input required value={form.convictionStatus} onChange={set('convictionStatus')} placeholder="NONE" />
            </div>
            <div className="field">
              <label>Pending cases</label>
              <input required type="number" min="0" value={form.pendingCases} onChange={set('pendingCases')} />
            </div>
            <div className="field field-check">
              <input id="blacklistFlag" type="checkbox" checked={form.blacklistFlag} onChange={set('blacklistFlag')} />
              <label htmlFor="blacklistFlag" style={{ margin: 0 }}>Blacklist flag</label>
            </div>
            <div className="field">
              <label>Overall status</label>
              <select value={form.overallStatus} onChange={set('overallStatus')}>
                <option value="CLEAR">Clear</option>
                <option value="ADVERSE">Adverse</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
              </select>
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Submitting…' : 'Submit report'}
            </button>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Latest report</h2></div>
        <div className="panel-body">
          {!result ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Submit a report to see its reference details here.</p>
          ) : (
            <div className="detail-grid">
              <div className="detail-item"><label>Report number</label><div><LedgerTag>{result.reportNumber}</LedgerTag></div></div>
              <div className="detail-item"><label>Citizen</label><div>{result.citizenName || '—'}</div></div>
              <div className="detail-item"><label>Citizen ref.</label><div><LedgerTag truncate={22}>{result.citizenReference}</LedgerTag></div></div>
              <div className="detail-item"><label>Status</label><div><StatusBadge status={result.overallStatus} /></div></div>
              <div className="detail-item"><label>Conviction status</label><div>{result.convictionStatus}</div></div>
              <div className="detail-item"><label>Pending cases</label><div>{result.pendingCases}</div></div>
              <div className="detail-item"><label>Report hash</label><div><LedgerTag truncate={18}>{result.reportHash}</LedgerTag></div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MyReportsPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/antecedent/officer');
      setReports(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load reports', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>My submitted reports</h2>
        <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 18 }}><span className="spinner dark" /></div>
        ) : reports.length === 0 ? (
          <div className="empty-row">No reports submitted yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr><th>Report</th><th>Citizen</th><th>Status</th><th>Pending cases</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.reportNumber}>
                    <td><LedgerTag>{r.reportNumber}</LedgerTag></td>
                    <td>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>{r.citizenName || '—'}</div>
                      <LedgerTag truncate={22}>{r.citizenReference}</LedgerTag>
                    </td>
                    <td><StatusBadge status={r.overallStatus} /></td>
                    <td>{r.pendingCases}</td>
                    <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
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

function SearchByCitizenPanel() {
  const [citizenId, setCitizenId] = useState('');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const search = async (e) => {
    e.preventDefault();
    if (!citizenId.trim()) return;
    setLoading(true);
    setReports(null);
    try {
      const res = await api.get(`/api/antecedent/citizen/${citizenId.trim()}`);
      setReports(unwrap(res) || []);
    } catch (err) {
      toast.error('Search failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header"><h2>Search by citizen</h2></div>
      <div className="panel-body">
        <form onSubmit={search} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 260, flex: 1 }}>
            <label>Citizen ID / reference</label>
            <input value={citizenId} onChange={(e) => setCitizenId(e.target.value)} placeholder="CIT-20260702115022-E67DD2" />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
        {reports && reports.length > 0 && (
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
            Showing reports for <strong>{reports[0].citizenName || citizenId}</strong>
          </p>
        )}
        {reports && reports.length === 0 && <div className="empty-row">No antecedent reports found for this citizen.</div>}
        {reports && reports.length > 0 && (
          <table className="data">
            <thead><tr><th>Report</th><th>Status</th><th>Conviction status</th><th>Pending cases</th><th>Submitted</th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.reportNumber}>
                  <td><LedgerTag>{r.reportNumber}</LedgerTag></td>
                  <td><StatusBadge status={r.overallStatus} /></td>
                  <td>{r.convictionStatus}</td>
                  <td>{r.pendingCases}</td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
