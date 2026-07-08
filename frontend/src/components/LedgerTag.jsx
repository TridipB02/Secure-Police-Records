import { useState } from 'react';
export default function LedgerTag({ children, dot, truncate }) {
  const [copied, setCopied] = useState(false);
  if (children === null || children === undefined || children === '') {
    return <span className="ledger-tag">—</span>;
  }

  const text = String(children);
  const display = truncate && text.length > truncate
    ? `${text.slice(0, truncate)}…`
    : text;

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
    }
  };

  return (
    <span
      className="ledger-tag copyable"
      onClick={handleClick}
      title={copied ? 'Copied' : text}
    >
      {dot && <span className={`hash-dot ${dot}`} />}
      {copied ? 'copied' : display}
    </span>
  );
}
