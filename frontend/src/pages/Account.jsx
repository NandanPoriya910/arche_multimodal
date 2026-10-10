import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({ cur: '', next: '', again: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (form.next !== form.again) return setMsg({ type: 'error', text: 'New passwords do not match.' });
    setBusy(true);
    try {
      await api.changePassword(form.cur, form.next);
      setForm({ cur: '', next: '', again: '' });
      setMsg({ type: 'ok', text: 'Password updated.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 18 }}><div><h1 style={{ fontSize: 24 }}>Account</h1><p>Your profile and password.</p></div></div>
      <div className="card" style={{ padding: 22, marginBottom: 18 }}>
        <dl className="kv" style={{ margin: 0 }}>
          <dt>Name</dt><dd>{user.name}</dd>
          <dt>Username</dt><dd>{user.username}</dd>
          <dt>Email</dt><dd>{user.email || '—'}</dd>
          <dt>Role</dt><dd><span className="badge blue">{user.role}</span></dd>
          <dt>Department</dt><dd>{user.department}</dd>
        </dl>
      </div>
      <form className="card" style={{ padding: 22, maxWidth: 480 }} onSubmit={submit}>
        <h3 style={{ marginBottom: 14 }}>Change password</h3>
        {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
        <div className="field"><label htmlFor="cur">Current password</label><input id="cur" type="password" className="input" value={form.cur} onChange={set('cur')} autoComplete="current-password" /></div>
        <div className="field"><label htmlFor="nw">New password</label><input id="nw" type="password" className="input" value={form.next} onChange={set('next')} autoComplete="new-password" /><span className="hint">At least 8 characters.</span></div>
        <div className="field"><label htmlFor="ag">Repeat new password</label><input id="ag" type="password" className="input" value={form.again} onChange={set('again')} autoComplete="new-password" /></div>
        <button className="btn primary" disabled={busy || !form.cur || !form.next}>{busy && <Loader2 size={16} className="spin" />} Update password</button>
      </form>
    </div>
  );
}
