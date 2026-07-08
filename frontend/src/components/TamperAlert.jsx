import LedgerTag from './LedgerTag';
export default function TamperAlert({ result }) {
  const tampered = result.tampered;
  const statusLabel = tampered ? 'Tampered' : 'Intact';
  const detail = result.status?.includes(' - ') ? result.status.split(' - ')[1] : null;

  return (
    <div className={`tamper-result ${tampered ? 'tampered' : 'intact'}`}>
      <div className="tamper-result-head">
        <span className={`hash-dot ${tampered ? 'bad' : 'ok'}`} />
        {statusLabel}
        {tampered && ' — chain of custody broken'}
      </div>
      {detail && <p style={{ margin: '0 0 10px', fontSize: 13 }}>{detail}</p>}
      <dl className="hash-compare">
        <dt>Record ID</dt>
        <dd><LedgerTag>{result.recordId}</LedgerTag></dd>
        <dt>Database hash</dt>
        <dd><LedgerTag dot={tampered ? 'bad' : 'ok'} truncate={40}>{result.dbHash}</LedgerTag></dd>
        <dt>Blockchain hash</dt>
        <dd><LedgerTag dot={tampered ? 'bad' : 'ok'} truncate={40}>{result.blockchainHash}</LedgerTag></dd>
        <dt>Checked at</dt>
        <dd>{result.checkedAt ? new Date(result.checkedAt).toLocaleString() : '—'}</dd>
      </dl>
    </div>
  );
}
