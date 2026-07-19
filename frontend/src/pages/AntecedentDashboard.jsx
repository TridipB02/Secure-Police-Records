import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';
import RecordCard from '../components/RecordCard';

const TABS = ['Submit report', 'My reports', 'Search by citizen', 'All citizens'];

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
        {tab === 'All citizens' && <AllCitizensPanel />}
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
  const [citizenRecords, setCitizenRecords] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const toast = useToast();

  const lookupRecords = async () => {
    if (!form.citizenReferenceNumber.trim()) return;
    setRecordsLoading(true);
    setCitizenRecords(null);
    try {
      const res = await api.get(`/api/records/citizen/${form.citizenReferenceNumber.trim()}`);
      setCitizenRecords(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not look up records', apiErrorMessage(err));
    } finally {
      setRecordsLoading(false);
    }
  };

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
              <div style={{ display: 'flex', gap: 8 }}>
                <input required value={form.citizenReferenceNumber} onChange={set('citizenReferenceNumber')} placeholder="CIT-20260702115022-E67DD2" style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary btn-sm" disabled={recordsLoading} onClick={lookupRecords}>
                  {recordsLoading ? 'Checking…' : 'Check FIR history'}
                </button>
              </div>
            </div>
            {citizenRecords && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                    {citizenRecords.length === 0 ? 'No police records found for this citizen.' : `${citizenRecords.length} record(s) found:`}
                  </div>
                  {citizenRecords.map((r) => (
                      <div key={r.id} style={{ marginBottom: 12 }}>
                        <RecordCard record={r} showHashes={false} />
                      </div>
                  ))}
                </div>
            )}
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
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
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

  const displayedReports = reports
    .filter((r) => {
      if (!searchText.trim()) return true;
      const q = searchText.trim().toLowerCase();
      return (
        (r.citizenName || '').toLowerCase().includes(q) ||
        (r.citizenReference || '').toLowerCase().includes(q) ||
        (r.reportNumber || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.submittedAt || 0).getTime();
      const dateB = new Date(b.submittedAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>My submitted reports</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Search citizen or report…"
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
        ) : displayedReports.length === 0 ? (
          <div className="empty-row">No reports found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr><th>Report</th><th>Citizen</th><th>Status</th><th>Pending cases</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {displayedReports.map((r) => (
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

function AllCitizensPanel() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
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

  const displayedCitizens = citizens
    .filter((c) => {
      if (!searchText.trim()) return true;
      const q = searchText.trim().toLowerCase();
      return (
        (c.fullName || '').toLowerCase().includes(q) ||
        (c.referenceNumber || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>All registered citizens</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Search name, ref, phone, email…"
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
        ) : displayedCitizens.length === 0 ? (
          <div className="empty-row">No citizens found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr><th>Reference</th><th>Full name</th><th>Phone</th><th>Email</th><th>ID proof</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {displayedCitizens.map((c) => (
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