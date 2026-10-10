import { useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, Search, UserCheck, Users, LayoutDashboard } from 'lucide-react';
import { api } from '../services/api.js';
import Approvals from '../components/Approvals.jsx';
import { formatWhen } from '../utils.js';

const TABS = [['overview', 'Overview', LayoutDashboard], ['requests', 'Sign-up requests', UserCheck], ['employees', 'Employees', Users], ['docs', 'HR documents', FileText]];
const Spin = () => <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}><Loader2 className="spin" /></div>;
const Pill = ({ ok, children }) => <span className={`badge ${ok ? 'green' : 'red'}`}>{children}</span>;
const Th = ({ children }) => <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{children}</th>;
const Td = ({ children }) => <td style={{ padding: '10px 14px', fontSize: 14, borderBottom: '1px solid var(--border)' }}>{children}</td>;

function Overview({ stats }) {
  if (!stats) return <Spin />;
  const cards = [['Employees', stats.employees], ['Active', stats.activeEmployees], ['Awaiting approval', stats.pendingRequests], ['Documents you can read', stats.visibleDocuments]];
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
        {cards.map(([k, v]) => <div className="card" key={k} style={{ padding: 16 }}><div style={{ color: 'var(--muted)', fontSize: 13 }}>{k}</div><div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{v}</div></div>)}
      </div>
      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <b>What HR can do here</b>
        <ul style={{ margin: '8px 0 0 18px', color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>
          <li>Approve or reject Employee sign-up requests</li>
          <li>Enable or disable Employee accounts and update their department</li>
          <li>Read HR and General documents (Finance documents stay hidden)</li>
        </ul>
        <b style={{ display: 'block', marginTop: 12 }}>What needs an administrator</b>
        <ul style={{ margin: '8px 0 0 18px', color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>
          <li>Changing roles, resetting passwords, approving HR requests</li>
          <li>Reading other people's chats, provider keys, and the activity log</li>
        </ul>
      </div>
    </>
  );
}

function Employees() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.hrEmployees(q).then((r) => { setRows(r.employees); setErr(''); }).catch((e) => setErr(e.message)), [q]);
  useEffect(() => { load(); }, [load]);
  const act = (p) => p.then(load).catch((e) => setErr(e.message));
  return (
    <>
      <div className="input-icon search" style={{ marginBottom: 12 }}><Search className="lead" size={18} /><input className="input" placeholder="Search employees" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {err && <div className="error" style={{ marginBottom: 10 }}>{err}</div>}
      {!rows ? <Spin /> : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Employee</Th><Th>Department</Th><Th>Last login</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <Td><b>{e.name}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{e.username} · {e.email}</div></Td>
                  <Td>{e.department}</Td>
                  <Td>{e.lastLogin ? formatWhen(e.lastLogin) : '—'}</Td>
                  <Td><Pill ok={e.isActive}>{e.status === 'REJECTED' ? 'Rejected' : e.isActive ? 'Active' : 'Disabled'}</Pill></Td>
                  <Td>
                    <button className="btn" style={{ padding: '4px 10px', marginRight: 6 }} onClick={() => act(api.hrUpdateEmployee(e.id, { isActive: !e.isActive }))}>{e.isActive ? 'Disable' : 'Enable'}</button>
                    <button className="btn" style={{ padding: '4px 10px' }} onClick={() => { const d = window.prompt(`Department for ${e.name}`, e.department); if (d && d.trim()) act(api.hrUpdateEmployee(e.id, { department: d.trim() })); }}>Set dept</button>
                  </Td>
                </tr>
              ))}
              {!rows.length && <tr><Td>No employees yet.</Td><Td /><Td /><Td /><Td /></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Docs() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.hrDocuments().then((r) => setRows(r.documents)).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="error">{err}</div>;
  if (!rows) return <Spin />;
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><Th>Document</Th><Th>Department</Th><Th>Access</Th><Th>Uploaded by</Th><Th>Added</Th></tr></thead>
        <tbody>{rows.map((d) => <tr key={d.id}><Td><b>{d.title}</b><div style={{ color: 'var(--muted)', fontSize: 12 }}>{d.filename}</div></Td><Td>{d.department}</Td><Td>{d.accessLabel}</Td><Td>{d.uploadedBy}</Td><Td>{formatWhen(d.createdAt)}</Td></tr>)}
          {!rows.length && <tr><Td>No documents available to you.</Td><Td /><Td /><Td /><Td /></tr>}</tbody>
      </table>
    </div>
  );
}

export default function HRDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const refresh = useCallback(() => api.hrOverview().then(setStats).catch(() => {}), []);
  useEffect(() => { refresh(); }, [refresh]);
  return (
    <div className="scroll">
      <div className="page" style={{ maxWidth: 1200 }}>
        <div className="page-head"><div><h1><Users size={26} style={{ verticalAlign: -4 }} /> HR Dashboard</h1><p>Manage employee accounts and sign-up requests.</p></div></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map(([id, label, Icon]) => <button key={id} className="btn" onClick={() => setTab(id)} style={tab === id ? { background: 'var(--active)', color: 'var(--active-text)', borderColor: 'transparent' } : {}}><Icon size={16} /> {label}{id === 'requests' && stats?.pendingRequests ? ` (${stats.pendingRequests})` : ''}</button>)}
        </div>
        {tab === 'overview' && <Overview stats={stats} />}
        {tab === 'requests' && <Approvals load={api.hrPending} decide={api.hrDecide} onChange={refresh} />}
        {tab === 'employees' && <Employees />}
        {tab === 'docs' && <Docs />}
      </div>
    </div>
  );
}
