import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { formatWhen } from '../utils.js';

// Pending sign-up requests. `load` / `decide` come from the dashboard so Admin and HR share one component.
export default function Approvals({ load, decide, onChange }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const refresh = useCallback(() => load().then((r) => { setRows(r.requests); setErr(''); }).catch((e) => setErr(e.message)), [load]);
  useEffect(() => { refresh(); }, [refresh]);

  async function act(id, approve) {
    setBusy(id);
    try { await decide(id, approve); await refresh(); onChange?.(); } catch (e) { setErr(e.message); } finally { setBusy(''); }
  }

  if (!rows && !err) return <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}><Loader2 className="spin" /></div>;
  return (
    <>
      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
      <div className="card" style={{ overflowX: 'auto' }}>
        {rows?.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Name', 'Email', 'Requested role', 'Requested', ''].map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}><b>{r.name}</b></td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>{r.email}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}><span className="badge blue">{r.requestedRole}</span></td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>{formatWhen(r.requestedAt)}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <button className="btn" disabled={busy === r.id} style={{ padding: '4px 10px', marginRight: 6 }} onClick={() => act(r.id, true)}><Check size={15} /> Approve</button>
                    <button className="btn" disabled={busy === r.id} style={{ padding: '4px 10px', color: 'var(--red)' }} onClick={() => act(r.id, false)}><X size={15} /> Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{ padding: 24, color: 'var(--muted)' }}>No sign-up requests are waiting.</div>}
      </div>
    </>
  );
}
