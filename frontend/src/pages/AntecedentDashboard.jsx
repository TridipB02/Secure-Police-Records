import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import LedgerTag from '../components/LedgerTag';
import StatusBadge from '../components/StatusBadge';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';
import RecordCard from '../components/RecordCard';

const TABS = ['Pending checks', 'Submit report', 'My reports', 'Search by citizen', 'All citizens'];

export default function AntecedentDashboard() {
  const [tab, setTab] = useState(TABS[0]);
  const [prefillRef, setPrefillRef] = useState('');
  const [editReport, setEditReport] = useState(null); // report being edited, or null

  const goToSubmit = (refNumber) => {
    setEditReport(null);
    setPrefillRef(refNumber);
    setTab('Submit report');
  };

  const goToEdit = (report) => {
    setEditReport(report);
    setTab('Submit report');
  };

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
                <button
                    key={t}
                    className={`tab ${tab === t ? 'active' : ''}`}
                    onClick={() => { if (t !== 'Submit report') setEditReport(null); setTab(t); }}
                >
                  {t}
                </button>
            ))}
          </div>
          {tab === 'Pending checks' && <PendingChecksPanel onGoToSubmit={goToSubmit} />}
          {tab === 'Submit report' && (
              <SubmitPanel
                  prefillRef={prefillRef}
                  editReport={editReport}
                  onDoneEditing={() => setEditReport(null)}
              />
          )}
          {tab === 'My reports' && <MyReportsPanel onEdit={goToEdit} />}
          {tab === 'Search by citizen' && <SearchByCitizenPanel onEdit={goToEdit} />}
          {tab === 'All citizens' && <AllCitizensPanel />}
        </main>
      </>
  );
}

function PendingChecksPanel({ onGoToSubmit }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/firearm/status/ANTECEDENT_CHECK');
      setApps(unwrap(res) || []);
    } catch (err) {
      toast.error('Could not load pending checks', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
      <div className="panel">
        <div className="panel-header">
          <h2>Pending antecedent checks</h2>
          <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
              <div style={{ padding: 18 }}><span className="spinner dark" /></div>
          ) : apps.length === 0 ? (
              <div className="empty-row">No firearm applications currently awaiting antecedent check.</div>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data">
                  <thead>
                  <tr><th>Application</th><th>Citizen</th><th>Weapon</th><th>Applied</th><th></th></tr>
                  </thead>
                  <tbody>
                  {apps.map((a) => (
                      <tr key={a.applicationNumber}>
                        <td><LedgerTag>{a.applicationNumber}</LedgerTag></td>
                        <td>
                          <div style={{ fontWeight: 500, marginBottom: 2 }}>{a.citizenName || '—'}</div>
                          <LedgerTag truncate={22}>{a.citizenReference}</LedgerTag>
                        </td>
                        <td>{a.weaponType}</td>
                        <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <button className="btn btn-sm" onClick={() => onGoToSubmit(a.citizenReference)}>
                            Submit report
                          </button>
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

const initialForm = {
  citizenReferenceNumber: '',
  firHistory: '',
  convictionStatus: 'NONE',
  pendingCases: 0,
  blacklistFlag: false,
  overallStatus: 'CLEAR',
};

function SubmitPanel({ prefillRef, editReport, onDoneEditing }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [citizenRecords, setCitizenRecords] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const toast = useToast();

  const isEditing = !!editReport;

  useEffect(() => {
    if (editReport) {
      setForm({
        citizenReferenceNumber: editReport.citizenReference || '',
        firHistory: editReport.firHistory || '',
        convictionStatus: editReport.convictionStatus || 'NONE',
        pendingCases: editReport.pendingCases ?? 0,
        blacklistFlag: !!editReport.blacklistFlag,
        overallStatus: editReport.overallStatus || 'CLEAR',
      });
      setResult(null);
    } else if (prefillRef) {
      setForm((f) => ({ ...f, citizenReferenceNumber: prefillRef }));
    }
  }, [editReport, prefillRef]);

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

  const cancelEdit = () => {
    setForm(initialForm);
    setResult(null);
    onDoneEditing();
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = isEditing
          ? await api.put(`/api/antecedent/${editReport.reportNumber}`, form)
          : await api.post('/api/antecedent/submit', form);
      const data = unwrap(res);
      setResult(data);
      toast.success(isEditing ? 'Report updated' : 'Report submitted', data.reportNumber);
      if (isEditing) {
        onDoneEditing();
      } else {
        setForm(initialForm);
      }
    } catch (err) {
      toast.error(isEditing ? 'Update failed' : 'Submission failed', apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h2>{isEditing ? `Edit report ${editReport.reportNumber}` : 'Submit antecedent report'}</h2>
            {isEditing && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                  Cancel edit
                </button>
            )}
          </div>
          <div className="panel-body">
            <form onSubmit={submit}>
              <div className="field">
                <label>Citizen reference number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                      required
                      disabled={isEditing}
                      value={form.citizenReferenceNumber}
                      onChange={set('citizenReferenceNumber')}
                      placeholder="CIT-20260702115022-E67DD2"
                      style={{ flex: 1 }}
                  />
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
                {loading ? (isEditing ? 'Updating…' : 'Submitting…') : (isEditing ? 'Update report' : 'Submit report')}
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Latest report</h2></div>
          <div className="panel-body">
            {!result ? (
                <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
                  {isEditing ? 'Update the report to see the refreshed details here.' : 'Submit a report to see its reference details here.'}
                </p>
            ) : (
                <AntecedentReportCard report={result} />
            )}
          </div>
        </div>
      </div>
  );
}

// Detailed report card — full FIR history + all fields, used in My Reports / Search by Citizen / Submit result
function AntecedentReportCard({ report }) {
  return (
      <div className="detail-grid">
        <div className="detail-item"><label>Report number</label><div><LedgerTag>{report.reportNumber}</LedgerTag></div></div>
        <div className="detail-item"><label>Citizen</label><div>{report.citizenName || '—'}</div></div>
        <div className="detail-item"><label>Citizen ref.</label><div><LedgerTag truncate={22}>{report.citizenReference}</LedgerTag></div></div>
        <div className="detail-item"><label>Status</label><div><StatusBadge status={report.overallStatus} /></div></div>
        <div className="detail-item"><label>Conviction status</label><div>{report.convictionStatus}</div></div>
        <div className="detail-item"><label>Pending cases</label><div>{report.pendingCases}</div></div>
        <div className="detail-item"><label>Blacklist flag</label><div>{report.blacklistFlag ? 'Yes' : 'No'}</div></div>
        <div className="detail-item"><label>Officer</label><div>{report.officerName || '—'}</div></div>
        <div className="detail-item"><label>Submitted</label><div>{report.submittedAt ? new Date(report.submittedAt).toLocaleString() : '—'}</div></div>
        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
          <label>FIR history</label>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{report.firHistory || 'No FIR registered'}</div>
        </div>
        <div className="detail-item"><label>Report hash</label><div><LedgerTag truncate={18}>{report.reportHash}</LedgerTag></div></div>
        {report.blockchainTxId && (
            <div className="detail-item"><label>Blockchain tx</label><div><LedgerTag truncate={18}>{report.blockchainTxId}</LedgerTag></div></div>
        )}
      </div>
  );
}

function MyReportsPanel({ onEdit }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState(null);
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
      <div className="grid-2">
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
                    <tr><th>Report</th><th>Citizen</th><th>Status</th><th>Pending cases</th><th>Submitted</th><th></th></tr>
                    </thead>
                    <tbody>
                    {displayedReports.map((r) => (
                        <tr key={r.reportNumber} className={selected?.reportNumber === r.reportNumber ? 'row-active' : ''}>
                          <td><LedgerTag>{r.reportNumber}</LedgerTag></td>
                          <td>
                            <div style={{ fontWeight: 500, marginBottom: 2 }}>{r.citizenName || '—'}</div>
                            <LedgerTag truncate={22}>{r.citizenReference}</LedgerTag>
                          </td>
                          <td><StatusBadge status={r.overallStatus} /></td>
                          <td>{r.pendingCases}</td>
                          <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(r)}>
                              View
                            </button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Report detail</h2>
            {selected && (
                <button className="btn btn-sm" onClick={() => onEdit(selected)}>Edit report</button>
            )}
          </div>
          <div className="panel-body">
            {!selected ? (
                <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Select a report from the list to view its full details.</p>
            ) : (
                <AntecedentReportCard report={selected} />
            )}
          </div>
        </div>
      </div>
  );
}

function SearchByCitizenPanel({ onEdit }) {
  const [citizenId, setCitizenId] = useState('');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const search = async (e) => {
    e.preventDefault();
    if (!citizenId.trim()) return;
    setLoading(true);
    setReports(null);
    setSelected(null);
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
      <div className="grid-2">
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
                  <thead><tr><th>Report</th><th>Status</th><th>Conviction status</th><th>Pending cases</th><th>Submitted</th><th></th></tr></thead>
                  <tbody>
                  {reports.map((r) => (
                      <tr key={r.reportNumber} className={selected?.reportNumber === r.reportNumber ? 'row-active' : ''}>
                        <td><LedgerTag>{r.reportNumber}</LedgerTag></td>
                        <td><StatusBadge status={r.overallStatus} /></td>
                        <td>{r.convictionStatus}</td>
                        <td>{r.pendingCases}</td>
                        <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(r)}>
                            View
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Report detail</h2>
            {selected && (
                <button className="btn btn-sm" onClick={() => onEdit(selected)}>Edit report</button>
            )}
          </div>
          <div className="panel-body">
            {!selected ? (
                <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Select a report to view its full details, including FIR history.</p>
            ) : (
                <AntecedentReportCard report={selected} />
            )}
          </div>
        </div>
      </div>
  );
}

function AllCitizensPanel() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchText, setSearchText] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const toast = useToast();

  const viewDetail = async (referenceNumber) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get(`/api/citizens/${referenceNumber}`);
      setDetail(unwrap(res));
    } catch (err) {
      toast.error('Could not load citizen details', apiErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

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
        {(detailLoading || detail) && (
            <div className="panel-body" style={{ borderBottom: '1px solid var(--border)' }}>
              {detailLoading ? (
                  <span className="spinner dark" />
              ) : (
                  <div className="detail-grid">
                    <div className="detail-item"><label>Full name</label><div>{detail.fullName}</div></div>
                    <div className="detail-item"><label>Reference</label><div><LedgerTag>{detail.referenceNumber}</LedgerTag></div></div>
                    <div className="detail-item"><label>{detail.idProofType}</label><div>{detail.idProofNumber}</div></div>
                    <div className="detail-item"><label>Date of birth</label><div>{detail.dateOfBirth}</div></div>
                    <div className="detail-item"><label>Phone</label><div>{detail.phone}</div></div>
                    <div className="detail-item"><label>Address</label><div>{detail.address}</div></div>
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setDetail(null)}>Close</button>
                    </div>
                  </div>
              )}
            </div>
        )}
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
              <div style={{ padding: 18 }}><span className="spinner dark" /></div>
          ) : displayedCitizens.length === 0 ? (
              <div className="empty-row">No citizens found.</div>
          ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data">
                  <thead>
                  <tr><th>Reference</th><th>Full name</th><th>Phone</th><th>Email</th><th>ID proof</th><th>Registered</th><th></th></tr>
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
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(c.referenceNumber)}>
                            View ID
                          </button>
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