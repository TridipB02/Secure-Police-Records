import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LedgerTag from '../components/LedgerTag';
import api, { unwrap, apiErrorMessage } from '../api/axios';

export default function VerifyCertificate() {
  const { certId } = useParams();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/certificates/verify/${certId}`);
        if (!cancelled) setCert(unwrap(res));
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [certId]);

  const banner = cert?.status === 'VALID'
    ? { tone: 'ok', label: 'Certificate verified', text: 'This certificate is valid and has not been revoked.' }
    : cert?.status === 'REVOKED'
    ? { tone: 'bad', label: 'Certificate revoked', text: cert.revocationReason || 'This certificate has been revoked by the issuing authority.' }
    : cert?.status === 'EXPIRED'
    ? { tone: 'warn', label: 'Certificate expired', text: 'This certificate is past its expiry date.' }
    : null;

  return (
    <div style={{
      minHeight: '100%', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: '32px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            border: '1.5px solid var(--ink)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px', fontFamily: 'var(--font-mono)', fontSize: 12,
          }}>SP</div>
          <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Certificate verification
          </p>
        </div>

        {loading && (
          <div className="panel"><div className="panel-body" style={{ textAlign: 'center', padding: 40 }}>
            <span className="spinner dark" />
          </div></div>
        )}

        {!loading && error && (
          <div className="panel">
            <div className="panel-body">
              <div className="alert alert-error" style={{ marginBottom: 0 }}>
                Could not verify this certificate: {error}
              </div>
            </div>
          </div>
        )}

        {!loading && cert && (
          <>
            {banner && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius)',
                  marginBottom: 16,
                  background: banner.tone === 'ok' ? 'var(--status-green-bg)' : banner.tone === 'bad' ? 'var(--status-red-bg)' : 'var(--status-amber-bg)',
                  border: `1px solid ${banner.tone === 'ok' ? '#bfe2c9' : banner.tone === 'bad' ? '#f0c9c9' : '#f0ddb0'}`,
                }}
              >
                <div style={{
                  fontWeight: 600, fontSize: 14.5,
                  color: banner.tone === 'ok' ? 'var(--status-green)' : banner.tone === 'bad' ? 'var(--status-red)' : 'var(--status-amber)',
                }}>
                  {banner.label}
                </div>
                <div style={{ fontSize: 12.5, marginTop: 3, color: 'var(--ink-soft)' }}>{banner.text}</div>
              </div>
            )}

            <div className="panel">
              <div className="panel-header">
                <h2>{cert.certificateType?.replace('_', ' ')}</h2>
              </div>
              <div className="panel-body">
                <div className="detail-grid">
                  <div className="detail-item"><label>Certificate ID</label><div><LedgerTag>{cert.certificateId}</LedgerTag></div></div>
                  <div className="detail-item"><label>Issued by</label><div>{cert.issuedBy}</div></div>
                  <div className="detail-item"><label>Issue date</label><div>{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '—'}</div></div>
                  <div className="detail-item"><label>Expiry date</label><div>{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : '—'}</div></div>
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <label>Document hash</label>
                    <div><LedgerTag truncate={48}>{cert.documentHash}</LedgerTag></div>
                  </div>
                  {cert.blockchainTxId && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <label>Blockchain TX</label>
                      <div><LedgerTag truncate={48}>{cert.blockchainTxId}</LedgerTag></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-soft)', marginTop: 18 }}>
          This is a public verification page. No login required.
        </p>
      </div>
    </div>
  );
}
