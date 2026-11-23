import type { LedgerEntry } from "@/types";

interface LedgerProps {
  entries: LedgerEntry[];
}

export function Ledger({ entries }: LedgerProps) {
  if (entries.length === 0) {
    return <p className="empty">Settlements will appear here.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {entries.map((r) => (
        <li className="row" style={{ marginTop: 8 }} key={r.id}>
          <span className="mono">{r.text}</span>
          <span className="ok">{r.pi.toFixed(2)} π</span>
        </li>
      ))}
    </ul>
  );
}
