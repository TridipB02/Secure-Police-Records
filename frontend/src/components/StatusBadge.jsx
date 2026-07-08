const COLOR_MAP = {
  // KYC
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  VERIFIED: 'green',
  REJECTED: 'red',

  // Firearm application
  SUBMITTED: 'gray',
  UNDER_REVIEW: 'amber',
  ANTECEDENT_CHECK: 'blue',
  APPROVED: 'green',
  REVOKED: 'red',

  // Certificate
  VALID: 'green',
  EXPIRED: 'amber',

  // Antecedent
  CLEAR: 'green',
  ADVERSE: 'red',

  // Tamper check
  INTACT: 'green',
  TAMPERED: 'red',
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-gray">UNKNOWN</span>;
  // Tamper status strings can be verbose, e.g. "TAMPERED - Content decryption failed"
  const key = status.split(' ')[0].toUpperCase();
  const color = COLOR_MAP[key] || 'gray';
  return <span className={`badge badge-${color}`}>{key}</span>;
}
