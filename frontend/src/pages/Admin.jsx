import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Activity, FileText, LayoutDashboard, Loader2, MessageSquare, Search, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import Approvals from '../components/Approvals.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatWhen } from '../utils.js';

const ROLES = ['ADMIN', 'HR', 'FINANCE', 'EMPLOYEE'];
const TABS = [
  ['overview', 'Overview', LayoutDashboard],
  ['approvals', 'Approvals', UserCheck],
  ['users', 'Users', Users],
  ['chats', 'Chats', MessageSquare],
  ['docs', 'Documents', FileText],
  ['audit', 'Activity Log', Activity],
];
const ACTIONS = ['login', 'login_failed', 'signup', 'query', 'upload', 'delete', 'reindex', 'sample_data', 'provider_update', 'provider_key_removed', 'defaults_update', 'admin_user_create', 'admin_user_update', 'admin_view_chat', 'admin_delete_chat', 'signup_approved', 'signup_rejected', 'hr_employee_update', 'admin_view_document', 'admin_delete_document'];
const tone = (a) => (a === 'login_failed' || /delete|removed|rejected/.test(a) ? 'red' : a === 'login' || a === 'signup' || a === 'signup_approved' ? 'green' : a === 'query' ? 'blue' : a.startsWith('admin') ? 'purple' : 'amber');
const Pill = ({ c = 'blue', children }) => <span style={{ background: `var(--${c}-bg)`, color: c === 'blue' ? 'var(--blue-600)' : `var(--${c})`, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>;
const Th = ({ children }) => <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{children}</th>;
const Td = ({ children, ...p }) => <td style={{ padding: '10px 14px', fontSize: 14, borderBottom: '1px solid var(--border)', verticalAlign: 'top' }} {...p}>{children}</td>;
const Table = ({ head, children }) => (
  <div className="card" style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{head.map((h) => <Th key={h}>{h}</Th>)}</tr></thead><tbody>{children}</tbody></table>
  </div>
);
const Spin = () => <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}><Loader2 className="spin" /></div>;

function useLoad(fn, deps) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const reload = useCallback(() => fn().then((d) => { setData(d); setErr(''); }).catch((e) => setErr(e.message)), deps); // eslint-disable-line
  useEffect(() => { reload(); }, [reload]);
  return [data, err, reload];
}

function Overview() {
  const [s, err] = useLoad(() => api.adminStats(), []);
  if (err) return <div className="error">{err}</div>;
  if (!s) return <Spin />;
  const cards = [['Users', `${s.activeUsers}/${s.users} active`], ['Chats', s.chats], ['Messages', s.messages], ['Documents', s.documents], ['Questions (24h)', s.queries24], ['Logins (24h)', s.logins24], ['Failed logins (24h)', s.failed24]];
  const max = Math.max(1, ...s.perDay.map((d) => d.n));
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
        {cards.map(([k, v]) => <div className="card" key={k} style={{ padding: 16 }}><div style={{ color: 'var(--muted)', fontSize: 13 }}>{k}</div><div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: k.startsWith('Failed') && v > 0 ? 'var(--red)' : undefined }}>{v}</div></div>)}
      </div>
      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <b>Activity — last 7 days</b>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120, marginTop: 14 }}>
          {s.perDay.map((d) => <div key={d._id} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}><div title={`${d.n} events`} style={{ height: Math.max(4, (d.n / max) * 90), background: 'var(--grad)', borderRadius: 6 }} />{d._id.slice(5)}</div>)}
          {!s.perDay.length && <span style={{ color: 'var(--muted)' }}>No activity yet.</span>}
        </div>
      </div>
      <div className="card" style={{ padding: 18, marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <b style={{ marginRight: 6 }}>Accounts by role</b>
        {s.byRole.map((r) => <Pill key={r._id} c="purple">{r._id}: {r.n}</Pill>)}
        {s.pendingCount > 0 && <Pill c="amber">{s.pendingCount} awaiting approval</Pill>}
      </div>
      <div className="card" style={{ padding: 18, marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {s.byAction.map((a) => <Pill key={a._id} c={tone(a._id)}>{a._id}: {a.n}</Pill>)}
      </div>
    </>
  );
}

function UsersTab() {
  const [q, setQ] = useState('');
  const [data, err, reload] = useLoad(() => api.adminUsers(q), [q]);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');
  const [imp, setImp] = useState(null); // result of the last CSV import
  const act = (p) => p.then(() => { setMsg(''); reload(); }).catch((e) => setMsg(e.message));
  const onCsv = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) api.adminImportUsers(file).then((r) => { setImp(r); setMsg(''); reload(); }).catch((er) => { setImp(null); setMsg(er.message); });
  };
  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div className="input-icon search" style={{ flex: 1 }}><Search className="lead" size={18} /><input className="input" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn" onClick={() => setForm({ name: '', email: '', password: '', role: 'EMPLOYEE', department: 'General' })}>+ Add user</button>
        <label className="btn" style={{ cursor: 'pointer' }}>Upload CSV<input type="file" accept=".csv,text/csv" hidden onChange={onCsv} /></label>
        <button className="btn" onClick={() => api.adminUsersTemplate().catch((e) => setMsg(e.message))}>CSV template</button>
      </div>
      {imp && (
        <div className="card" style={{ padding: 12, marginBottom: 12, fontSize: 13 }}>
          <b>CSV import:</b> {imp.created.length} created, {imp.skipped.length} skipped, {imp.failed.length} failed
          {[...imp.skipped.map((x) => `Line ${x.line} (${x.username}): ${x.reason}`), ...imp.failed.map((x) => `Line ${x.line}: ${x.reason}`)].slice(0, 10).map((t) => <div key={t} style={{ color: 'var(--muted)' }}>{t}</div>)}
        </div>
      )}
      {(err || msg) && <div className="error" style={{ marginBottom: 10 }}>{err || msg}</div>}
      {form && (
        <div className="card" style={{ padding: 16, marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
          {['name', 'email', 'password', 'department'].map((k) => <input key={k} className="input" type={k === 'password' ? 'password' : 'text'} placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          <button className="btn" onClick={() => act(api.adminCreateUser(form).then(() => setForm(null)))}>Create</button>
        </div>
      )}
      {!data ? <Spin /> : (
        <Table head={['User', 'Role', 'Dept', 'Chats / Msgs', 'Last login', 'Status', 'Actions']}>
          {data.users.map((u) => (
            <tr key={u.id}>
              <Td><b>{u.name}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{u.username} · {u.email}</div></Td>
              <Td><select className="input" style={{ height: 34, padding: '0 8px' }} value={u.role} onChange={(e) => act(api.adminUpdateUser(u.id, { role: e.target.value }))}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Td>
              <Td>{u.department}</Td>
              <Td>{u.chats} / {u.messages}</Td>
              <Td>{u.lastLogin ? formatWhen(u.lastLogin) : '—'}</Td>
              <Td><Pill c={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Pill></Td>
              <Td>
                <button className="btn" style={{ padding: '4px 10px', marginRight: 6 }} onClick={() => act(api.adminUpdateUser(u.id, { isActive: !u.isActive }))}>{u.isActive ? 'Disable' : 'Enable'}</button>
                <button className="btn" style={{ padding: '4px 10px' }} onClick={() => { const p = window.prompt(`New password for ${u.username} (min 8 chars)`); if (p) act(api.adminUpdateUser(u.id, { password: p })); }}>Reset pw</button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

function ChatsTab() {
  const [q, setQ] = useState('');
  const [data, err, reload] = useLoad(() => api.adminChats(`limit=100${q ? `&q=${encodeURIComponent(q)}` : ''}`), [q]);
  const [open, setOpen] = useState(null);
  const view = (id) => api.adminChat(id).then((r) => setOpen(r.chat)).catch((e) => alert(e.message));
  return (
    <>
      <div className="input-icon search" style={{ marginBottom: 12 }}><Search className="lead" size={18} /><input className="input" placeholder="Search inside all chat messages" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {err && <div className="error">{err}</div>}
      {!data ? <Spin /> : (
        <Table head={['Title', 'User', 'Messages', 'Updated', '']}>
          {data.chats.map((c) => (
            <tr key={c.id}>
              <Td><a href="#" onClick={(e) => { e.preventDefault(); view(c.id); }}>{c.title}</a></Td>
              <Td>{c.user?.name || '(deleted)'} <span style={{ color: 'var(--muted)' }}>@{c.user?.username}</span></Td>
              <Td>{c.messages}</Td><Td>{formatWhen(c.updatedAt)}</Td>
              <Td><button className="btn" style={{ padding: '4px 10px', color: 'var(--red)' }} onClick={async () => { if (window.confirm('Delete this chat permanently?')) { await api.adminDeleteChat(c.id).catch((e) => alert(e.message)); reload(); } }}>Delete</button></Td>
            </tr>
          ))}
        </Table>
      )}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px,100%)', maxHeight: '85vh', overflow: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><div><b>{open.title}</b><div style={{ color: 'var(--muted)', fontSize: 13 }}>by {open.user?.name} (@{open.user?.username})</div></div><button className="icon-btn" onClick={() => setOpen(null)}><X size={18} /></button></div>
            {open.messages.map((m, i) => (
              <div key={i} style={{ marginTop: 12, padding: 12, borderRadius: 12, background: m.role === 'user' ? 'var(--blue-bg)' : 'var(--bg-soft)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{m.role} · {formatWhen(m.createdAt)}{m.citations ? ` · ${m.citations} sources` : ''}</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{m.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function DocsTab() {
  const [f, setF] = useState({ q: '', role: '', uploader: '', department: '', kind: '' });
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v))).toString();
  const [data, err, reload] = useLoad(() => api.adminDocs(qs), [qs]);
  const [open, setOpen] = useState(null); // { doc, chunks, total, skip }
  const [msg, setMsg] = useState('');
  const set = (k, v) => setF({ ...f, [k]: v });

  const read = (doc, skip = 0) => api.adminDocContent(doc.id, skip).then((r) => setOpen({ doc, ...r, skip })).catch((e) => setMsg(e.message));
  const del = async (d) => {
    if (!window.confirm(`Delete "${d.title}" uploaded by ${d.uploadedBy}? This removes it from the knowledge base.`)) return;
    await api.adminDeleteDoc(d.id).catch((e) => setMsg(e.message));
    reload();
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Search title / filename" value={f.q} onChange={(e) => set('q', e.target.value)} />
        <select className="input" style={{ width: 150 }} value={f.role} onChange={(e) => set('role', e.target.value)}><option value="">Uploader role</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        <select className="input" style={{ width: 160 }} value={f.uploader} onChange={(e) => set('uploader', e.target.value)}><option value="">Any uploader</option>{(data?.uploaders || []).map((u) => <option key={u}>{u}</option>)}</select>
        <select className="input" style={{ width: 150 }} value={f.department} onChange={(e) => set('department', e.target.value)}><option value="">Any department</option>{['HR', 'FINANCE', 'GENERAL'].map((d) => <option key={d}>{d}</option>)}</select>
        <select className="input" style={{ width: 130 }} value={f.kind} onChange={(e) => set('kind', e.target.value)}><option value="">Any type</option>{['pdf', 'image', 'records', 'text'].map((k) => <option key={k}>{k}</option>)}</select>
      </div>
      <p className="hint" style={{ marginBottom: 10 }}>As admin you can open everything uploaded by employees, HR, finance and users, including private files. Viewing is recorded in the activity log.</p>
      {(err || msg) && <div className="error" style={{ marginBottom: 10 }}>{err || msg}</div>}
      {!data ? <Spin /> : (
        <Table head={['Document', 'Uploaded by', 'Dept', 'Access', 'Type', 'Chunks', 'Status', 'Added', '']}>
          {data.documents.map((d) => (
            <tr key={d.id}>
              <Td><b>{d.title}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{d.filename}</div></Td>
              <Td>{d.uploaderName}<div style={{ fontSize: 12 }}><Pill c="purple">{d.uploaderRole}</Pill> <span style={{ color: 'var(--muted)' }}>@{d.uploadedBy}</span></div></Td>
              <Td>{d.department}</Td>
              <Td>{d.private ? <Pill c="amber">Private</Pill> : d.accessLabel}</Td>
              <Td>{d.kind}</Td><Td>{d.stats?.chunks ?? '—'}</Td>
              <Td><Pill c={d.status === 'ready' ? 'green' : d.status === 'failed' ? 'red' : 'amber'}>{d.status}</Pill></Td>
              <Td>{formatWhen(d.createdAt)}</Td>
              <Td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                  <button className="btn" style={{ padding: '4px 10px' }} onClick={() => api.adminOpenDoc(d.id).catch((e) => setMsg(e.message))}>Open</button>
                  <button className="btn" style={{ padding: '4px 10px' }} onClick={() => read(d)}>Content</button>
                  <button className="btn" style={{ padding: '4px 10px', color: 'var(--red)' }} onClick={() => del(d)}>Delete</button>
                </div>
              </Td>
            </tr>
          ))}
          {!data.documents.length && <tr><Td>No documents match.</Td><Td /><Td /><Td /><Td /><Td /><Td /><Td /><Td /></tr>}
        </Table>
      )}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 'min(820px,100%)', maxHeight: '85vh', overflow: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div><b>{open.document.title}</b><div style={{ color: 'var(--muted)', fontSize: 13 }}>uploaded by @{open.document.uploadedBy} · {open.document.accessLabel} · {open.total} passages</div></div>
              <button className="icon-btn" onClick={() => setOpen(null)}><X size={18} /></button>
            </div>
            {open.chunks.map((c) => (
              <div key={c.id} style={{ marginTop: 10, padding: 12, borderRadius: 12, background: 'var(--bg-soft)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{c.table ? `${c.table} · row ${c.row}` : c.page ? `page ${c.page}` : 'text'}{c.confidence != null ? ` · OCR ${Math.round(c.confidence)}%` : ''}</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{c.text}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn" disabled={open.skip === 0} onClick={() => read(open.doc, Math.max(0, open.skip - 50))}>Prev</button>
              <button className="btn" disabled={open.skip + 50 >= open.total} onClick={() => read(open.doc, open.skip + 50)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AuditTab() {
  const [f, setF] = useState({ action: '', username: '', q: '' });
  const [skip, setSkip] = useState(0);
  const qs = new URLSearchParams({ limit: 50, skip, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }).toString();
  const [data, err] = useLoad(() => api.adminAudit(qs), [qs]);
  const set = (k, v) => { setSkip(0); setF({ ...f, [k]: v }); };
  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <select className="input" style={{ width: 200 }} value={f.action} onChange={(e) => set('action', e.target.value)}><option value="">All actions</option>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</select>
        <input className="input" style={{ width: 180 }} placeholder="Username" value={f.username} onChange={(e) => set('username', e.target.value)} />
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Search question text" value={f.q} onChange={(e) => set('q', e.target.value)} />
      </div>
      {err && <div className="error">{err}</div>}
      {!data ? <Spin /> : (
        <>
          <Table head={['When', 'User', 'Action', 'Details']}>
            {data.logs.map((l) => (
              <tr key={l._id}>
                <Td>{new Date(l.createdAt).toLocaleString()}</Td>
                <Td>{l.username || '—'} <span style={{ color: 'var(--muted)', fontSize: 12 }}>{l.role}</span></Td>
                <Td><Pill c={tone(l.action)}>{l.action}</Pill></Td>
                <Td><div style={{ maxWidth: 520, wordBreak: 'break-word', fontSize: 13 }}>{l.query}{l.detail && <code style={{ display: 'block', color: 'var(--muted)' }}>{JSON.stringify(l.detail)}</code>}</div></Td>
              </tr>
            ))}
          </Table>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>
            {skip + 1}–{Math.min(skip + 50, data.total)} of {data.total}
            <button className="btn" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - 50))}>Prev</button>
            <button className="btn" disabled={skip + 50 >= data.total} onClick={() => setSkip(skip + 50)}>Next</button>
          </div>
        </>
      )}
    </>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  const View = { overview: Overview, approvals: () => <Approvals decide={api.adminDecide} load={api.adminPending} />, users: UsersTab, chats: ChatsTab, docs: DocsTab, audit: AuditTab }[tab];
  return (
    <div className="scroll">
      <div className="page" style={{ maxWidth: 1200 }}>
        <div className="page-head"><div><h1><ShieldCheck size={26} style={{ verticalAlign: -4 }} /> Admin Panel</h1><p>Monitor logins, users, chats, documents and every action in the system.</p></div></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map(([id, label, Icon]) => <button key={id} className="btn" onClick={() => setTab(id)} style={tab === id ? { background: 'var(--active)', color: 'var(--active-text)', borderColor: 'transparent' } : {}}><Icon size={16} /> {label}</button>)}
        </div>
        <View />
      </div>
    </div>
  );
}
