import LedgerTag from './LedgerTag';
export default function RecordCard({ record, showHashes = true }) {
  return (
    <div className="panel" style={{ marginBottom: 12 }}>
      <div className="panel-header">
        <h2>
          {record.recordType} <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>· v{record.version}</span>
        </h2>
        <span className="badge badge-gray">{record.actionType}</span>
      </div>
      <div className="panel-body">
        <p style={{ margin: '0 0 14px', fontSize: 13.5 }}>{record.content}</p>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Record ID</label>
            <div><LedgerTag>{record.recordId}</LedgerTag></div>
          </div>
          {showHashes && (
              <>
                <div className="detail-item">
                  <label>Current hash</label>
                  <div><LedgerTag truncate={18}>{record.currentHash}</LedgerTag></div>
                </div>
                <div className="detail-item">
                  <label>Previous hash</label>
                  <div><LedgerTag truncate={18}>{record.previousHash}</LedgerTag></div>
                </div>
                <div className="detail-item">
                  <label>Blockchain TX</label>
                  <div><LedgerTag truncate={18}>{record.blockchainTxId}</LedgerTag></div>
                </div>
              </>
          )}
          <div className="detail-item">
            <label>Officer</label>
            <div>{record.officerName}</div>
          </div>
          <div className="detail-item">
            <label>Recorded</label>
            <div>{record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
