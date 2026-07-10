import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import RecordCard from '../components/RecordCard';
import TamperAlert from '../components/TamperAlert';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';

const TABS = ['Tamper detection', 'Audit logs', 'Record history'];

export default function AuditDashboard() {
  const [tab, setTab] = useState(TABS[0]);

  return (
      <>
        <Navbar subtitle="Audit & Integrity" />
        <main className="main">
          <div className="page-header">
            <h1>Audit officer console</h1>
            <p>Verify record integrity, review the audit trail, and inspect version history.</p>
          </div>
          <div className="tabs">
            {TABS.map((t) => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {t}
                </button>
            ))}
          </div>
          {tab === 'Tamper detection' && <TamperPanel />}
          {tab === 'Audit logs' && <AuditLogsPanel />}
          {tab === 'Record history' && <RecordHistoryPanel />}
        </main>
      </>
  );
}

function TamperPanel() {
  const [recordId, setRecordId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const runCheck = async (e) => {
    e.preventDefault();
    if (!recordId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get(`/api/records/verify/${recordId.trim()}`);
      const data = unwrap(res);
      setResult(data);
      toast.success('Verification complete', data.tampered ? 'Tampering detected.' : 'Record is intact.');
    } catch (err) {
      toast.error('Verification failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="tamper-panel">
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Run a tamper check</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
          Compares the database record hash against the hash anchored on the blockchain.
        </p>
        <form onSubmit={runCheck} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 260, flex: 1 }}>
            <label htmlFor="recordId">Record ID</label>
            <input
                id="recordId"
                placeholder="REC-20260705120859-F95EF4"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Checking…' : 'Run tamper check'}
          </button>
        </form>

        {result && <TamperAlert result={result} />}
      </div>
  );
}

function AuditLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [showingMine, setShowingMine] = useState(false);
  const toast = useToast();

  const load = async (action, mine) => {
    setLoading(true);
    try {
      const url = mine ? '/api/audit/actor' : action ? `/api/audit/action/${action}` : '/api/audit/all';
      const res = await api.get(url);
      setLogs(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load audit logs', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    setShowingMine(false);
    load(actionFilter.trim() || null, false);
  };

  const showMyActivity = () => {
    setActionFilter('');
    setShowingMine(true);
    load(null, true);
  };

  return (
      <div className="panel">
        <div className="panel-header">
          <h2>Audit trail</h2>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: 8 }}>
            <input
                placeholder="Filter by action type…"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ padding: '6px 9px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5 }}
            />
            <button className="btn btn-secondary btn-sm" type="submit">Filter</button>
            <button
                type="button"
                className={`btn btn-sm ${showingMine ? '' : 'btn-secondary'}`}
                onClick={showMyActivity}
            >
              My activity
            </button>
            {(actionFilter || showingMine) && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setActionFilter(''); setShowingMine(false); load(); }}>
                  Clear
                </button>
            )}
          </form>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
              <div style={{ padding: 18 }}><span className="spinner dark" /></div>
          ) : logs.length === 0 ? (
              <div className="empty-row">No audit entries found.</div>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data">
                  <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                  </tr>
                  </thead>
                  <tbody>
                  {logs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                        <td>{log.actorName}</td>
                        <td><span className="badge badge-gray">{log.actorRole}</span></td>
                        <td>{log.actionType}</td>
                        <td><LedgerTag truncate={22}>{log.resourceId}</LedgerTag></td>
                        <td style={{ color: 'var(--ink-soft)' }}>{log.details}</td>
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

function RecordHistoryPanel() {
  const [recordId, setRecordId] = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latestOnly, setLatestOnly] = useState(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const toast = useToast();

  const search = async (e) => {
    e.preventDefault();
    if (!recordId.trim()) return;
    setLoading(true);
    setHistory(null);
    setLatestOnly(null);
    try {
      const res = await api.get(`/api/records/history/${recordId.trim()}`);
      setHistory(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load history', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const viewLatest = async () => {
    if (!recordId.trim()) return;
    setLatestLoading(true);
    setHistory(null);
    setLatestOnly(null);
    try {
      const res = await api.get(`/api/records/${recordId.trim()}`);
      setLatestOnly(unwrap(res));
    } catch (err) {
      toast.error('Could not load record', apiErrorMessage(err));
    } finally {
      setLatestLoading(false);
    }
  };

  return (
      <div>
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-body">
            <form onSubmit={search} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="field" style={{ marginBottom: 0, minWidth: 260, flex: 1 }}>
                <label htmlFor="histRecordId">Record ID</label>
                <input
                    id="histRecordId"
                    placeholder="REC-20260705120859-F95EF4"
                    value={recordId}
                    onChange={(e) => setRecordId(e.target.value)}
                />
              </div>
              <button className="btn" type="submit" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Loading…' : 'View full history'}
              </button>
              <button type="button" className="btn btn-secondary" disabled={latestLoading} onClick={viewLatest}>
                {latestLoading ? 'Loading…' : 'Latest version only'}
              </button>
            </form>
          </div>
        </div>

        {latestOnly && <RecordCard record={latestOnly} />}
        {history && history.length === 0 && (
            <div className="empty-row">No versions found for that record ID.</div>
        )}
        {history && history.map((rec) => <RecordCard key={rec.id || rec.recordId + rec.version} record={rec} />)}
      </div>
  );
}
