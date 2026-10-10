import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, FileText, Loader2, MessageSquare } from 'lucide-react';
import { api } from '../services/api.js';
import { firstName, formatWhen } from '../utils.js';

export default function EmployeeDashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.employeeOverview().then(setD).catch((e) => setErr(e.message)); }, []);

  return (
    <div className="scroll">
      <div className="page" style={{ maxWidth: 1100 }}>
        <div className="page-head"><div><h1><Briefcase size={26} style={{ verticalAlign: -4 }} /> My Workspace</h1><p>{d ? `Welcome back, ${firstName(d.profile.name)}.` : 'Your chats and the documents you can read.'}</p></div></div>
        {err && <div className="error">{err}</div>}
        {!d && !err && <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}><Loader2 className="spin" /></div>}
        {d && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14 }}>
              {[['My chats', d.stats.chats], ['Documents I can read', d.stats.readableDocuments], ['My private uploads', d.stats.myUploads]].map(([k, v]) => (
                <div className="card" key={k} style={{ padding: 16 }}><div style={{ color: 'var(--muted)', fontSize: 13 }}>{k}</div><div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{v}</div></div>
              ))}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Profile</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{d.profile.department}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{d.profile.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, margin: '16px 0', flexWrap: 'wrap' }}>
              <Link to="/" className="btn primary"><MessageSquare size={17} /> Ask a question</Link>
              <Link to="/knowledge" className="btn"><BookOpen size={17} /> Knowledge base</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
              <div className="card" style={{ padding: 18 }}>
                <b>Recent chats</b>
                {d.recentChats.length ? d.recentChats.map((c) => (
                  <Link key={c.id} to={`/chat/${c.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', color: 'inherit', textDecoration: 'none' }}>
                    <span>{c.title}</span><span style={{ color: 'var(--muted)', fontSize: 12 }}>{formatWhen(c.updatedAt)}</span>
                  </Link>
                )) : <p className="hint" style={{ marginTop: 8 }}>No chats yet.</p>}
              </div>
              <div className="card" style={{ padding: 18 }}>
                <b>Documents available to you</b>
                {d.documents.length ? d.documents.map((x) => (
                  <div key={x.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <FileText size={18} color="var(--text-2)" /><span style={{ flex: 1 }}>{x.title}</span><span className="hint">{x.accessLabel}</span>
                  </div>
                )) : <p className="hint" style={{ marginTop: 8 }}>Nothing shared with you yet.</p>}
              </div>
            </div>
            <p className="hint" style={{ marginTop: 14 }}>You can only see documents your role allows. Anything you upload is private to you.</p>
          </>
        )}
      </div>
    </div>
  );
}
