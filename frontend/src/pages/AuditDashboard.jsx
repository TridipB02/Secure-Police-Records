import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import LedgerTag from '../components/LedgerTag';
import RecordCard from '../components/RecordCard';
import TamperAlert from '../components/TamperAlert';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import MyProfilePanel from '../components/MyProfilePanel';
import {
  ShieldCheck, FileSearch, History as HistoryIcon,
  FileText, ShieldAlert as ShieldAlertIcon, Users, User,
} from 'lucide-react';

const ACTION_TYPES = [
  'KYC_SUBMITTED', 'KYC_VERIFIED', 'ANTECEDENT_SUBMITTED',
  'FIREARM_APPLIED', 'FIREARM_STATUS_UPDATED',
  'CERTIFICATE_GENERATED', 'KYC_CERTIFICATE_GENERATED', 'CERTIFICATE_REVOKED',
  'RECORD_CREATED', 'RECORD_UPDATED',
];

const SECTIONS = [
  {
    key: 'tamper', label: 'Tamper detection', icon: ShieldCheck,
    subsections: [
      { key: 'record', label: 'Police record', icon: FileText },
      { key: 'antecedent', label: 'Antecedent report', icon: ShieldAlertIcon },
    ],
  },
  {
    key: 'audit', label: 'Audit logs', icon: FileSearch,
    subsections: [
      { key: 'staff', label: 'Staff activity', icon: Users },
      { key: 'citizen', label: 'Citizen activity', icon: User },
    ],
  },
  { key: 'history', label: 'Record history', icon: HistoryIcon },
];

export default function AuditDashboard() {
  const [section, setSection] = useState('tamper');
  const [sub, setSub] = useState('record');

  const changeSection = (key) => {
    setSection(key);
    const found = SECTIONS.find((s) => s.key === key);
    if (found?.subsections) setSub(found.subsections[0].key);
    else setSub(null);
  };

  return (
      <DashboardLayout
          subtitle="Audit & Integrity"
          sections={SECTIONS}
          active={section}
          activeSub={sub}
          onChange={changeSection}
          onChangeSub={setSub}
      >
        <div className="page-header">
          <h1>Audit officer console</h1>
          <p>Verify record integrity, review the audit trail, and inspect version history.</p>
        </div>

        {section === 'tamper' && <TamperPanel checkType={sub} />}
        {section === 'audit' && <AuditLogsPanel audience={sub} />}
        {section === 'history' && <RecordHistoryPanel />}
        {section === 'profile' && <MyProfilePanel />}
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

function TamperPanel({ checkType }) {
  const [recordId, setRecordId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setResult(null);
    setRecordId('');
    // eslint-disable-next-line
  }, [checkType]);

  const runCheck = async (e) => {
    e.preventDefault();
    if (!recordId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const url = checkType === 'antecedent'
          ? `/api/antecedent/verify/${recordId.trim()}`
          : `/api/records/verify/${recordId.trim()}`;
      const res = await api.get(url);
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
          Compares the database hash against the hash anchored on the blockchain.
        </p>
        <form onSubmit={runCheck} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 260, flex: 1 }}>
            <label htmlFor="recordId">{checkType === 'antecedent' ? 'Report ID' : 'Record ID'}</label>
            <input
                id="recordId"
                placeholder={checkType === 'antecedent' ? 'ANT-*****' : 'REC-*****'}
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

function AuditLogsPanel({ audience }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [showingMine, setShowingMine] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
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

  const displayedLogs = logs
      .filter((log) => (audience === 'citizen' ? log.actorRole === 'CITIZEN' : log.actorRole !== 'CITIZEN'))
      .filter((log) => {
        if (!searchText.trim()) return true;
        const q = searchText.trim().toLowerCase();
        return (
            (log.actorName || '').toLowerCase().includes(q) ||
            (log.resourceId || '').toLowerCase().includes(q) ||
            (log.actionType || '').toLowerCase().includes(q) ||
            (log.details || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

  return (
      <div className="panel">
        <div className="panel-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <h2>{audience === 'citizen' ? 'Citizen activity' : 'Staff activity'}</h2>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
                placeholder="Search actor, resource, action…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ padding: '6px 9px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5, width: 200 }}
            />
            <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ padding: '6px 9px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 12.5 }}
            >
              <option value="">All action types</option>
              {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <button className="btn btn-secondary btn-sm" type="submit">Filter</button>
            <button
                type="button"
                className={`btn btn-sm ${showingMine ? '' : 'btn-secondary'}`}
                onClick={showMyActivity}
            >
              My activity
            </button>
            <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            >
              Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
            {(actionFilter || showingMine || searchText) && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setActionFilter(''); setShowingMine(false); setSearchText(''); load(); }}>
                  Clear
                </button>
            )}
          </form>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
              <div style={{ padding: 18 }}><span className="spinner dark" /></div>
          ) : displayedLogs.length === 0 ? (
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
                  {displayedLogs.map((log) => (
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
                    placeholder="REC-*****"
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