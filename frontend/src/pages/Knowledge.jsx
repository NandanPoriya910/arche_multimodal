import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileImage, FileSpreadsheet, FileText, Loader2, RefreshCw, Sparkles, Trash2, Upload, Database, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import UploadModal from '../components/UploadModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatBytes, formatWhen } from '../utils.js';

const KIND = {
  pdf: { icon: FileText, label: 'PDF', bg: 'var(--red-bg)', color: 'var(--red)' },
  image: { icon: FileImage, label: 'Image · OCR', bg: 'var(--purple-bg)', color: 'var(--purple)' },
  records: { icon: FileSpreadsheet, label: 'Records', bg: 'var(--green-bg)', color: 'var(--green)' },
  text: { icon: FileText, label: 'Text', bg: 'var(--blue-bg)', color: 'var(--blue-600)' },
};

export default function Knowledge() {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const [docs, setDocs] = useState(null);
  const [status, setStatus] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null); // {type, text}

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([api.listDocuments(), api.kbStatus()]);
      setDocs(d.documents);
      setStatus(s);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
      setDocs((x) => x || []);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function run(name, fn, okText) {
    setBusy(name);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ type: 'ok', text: okText(r) });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy('');
      load();
    }
  }

  const sample = () =>
    run('sample', api.loadSampleData, (r) => {
      const loaded = r.results.filter((x) => x.status === 'loaded').length;
      const failed = r.results.filter((x) => x.status === 'failed');
      return failed.length ? `Loaded ${loaded} file(s). ${failed[0].file} failed: ${failed[0].error}` : loaded ? `Loaded ${loaded} sample file(s).` : 'Sample data was already loaded.';
    });

  const idx = status?.index;

  return (
    <div className="scroll">
      <div className="page">
        <div className="page-head">
          <div>
            <h1>Knowledge Base</h1>
            <p>Documents, images and records you’re allowed to see. Each item carries its own access rules, enforced at search time.</p>
          </div>
          <div className="actions">
            {isAdmin && (
              <button className="btn" onClick={sample} disabled={!!busy}>
                {busy === 'sample' ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Load sample data
              </button>
            )}
            <button className="btn primary" onClick={() => setShowUpload(true)}>
              <Upload size={16} /> Upload
            </button>
          </div>
        </div>

        {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

        {idx?.stale && (
          <div className="notice warn">
            <TriangleAlert size={18} />
            <span style={{ flex: 1 }}>The embedding model changed since the index was built (<b>{idx.signature?.model}</b> → <b>{idx.activeEmbeddingModel}</b>). Search is paused until you re-index.</span>
            <button className="btn sm" onClick={() => run('reindex', api.reindex, (r) => `Re-indexed ${r.chunks} passages with ${r.model}.`)} disabled={!!busy}>
              {busy === 'reindex' ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} Re-index now
            </button>
          </div>
        )}
        {idx?.problems?.length > 0 && <div className="notice error"><TriangleAlert size={18} /><span>{idx.problems.join(' ')}</span></div>}

        {status && (
          <div className="stats">
            <div className="card stat"><b>{status.documents}</b><span>Documents you can access</span></div>
            <div className="card stat"><b>{status.chunks}</b><span>Searchable passages</span></div>
            <div className="card stat"><b>{status.byKind?.pdf || 0} / {status.byKind?.image || 0} / {status.byKind?.records || 0}</b><span>PDFs / images / record sets</span></div>
            {idx && <div className="card stat"><b>{idx.total}</b><span>Vectors in FAISS ({idx.partitions.length} partitions)</span></div>}
          </div>
        )}

        {isAdmin && idx && (
          <div className="card" style={{ padding: 18, marginBottom: 22 }}>
            <div className="row-between" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Database size={20} color="var(--blue-600)" />
                <b>FAISS vector index</b>
                <span className="hint">{idx.signature ? `${idx.signature.model} · ${idx.signature.dim} dims` : 'empty'}</span>
              </div>
              <button className="btn sm" onClick={() => run('reindex', api.reindex, (r) => `Re-indexed ${r.chunks} passages with ${r.model}.`)} disabled={!!busy || idx.total === 0 && !status.chunks}>
                {busy === 'reindex' ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} Re-index
              </button>
            </div>
            <div className="part">
              {idx.partitions.length === 0 && <span className="hint">No vectors yet.</span>}
              {idx.partitions.map((p) => <span key={p.name} className="badge blue"><ShieldCheck size={13} /> {p.name}: {p.vectors} vectors</span>)}
            </div>
            <p className="hint" style={{ marginTop: 10 }}>One FAISS index per department. A search only touches partitions the signed-in user can reach, and every hit is re-checked against its ACL before it can leave the retrieval layer.</p>
          </div>
        )}

        <div className="card list">
          {docs === null && <div className="empty-state"><Loader2 className="spin" /></div>}
          {docs?.length === 0 && (
            <div className="empty-state">
              <FileText size={34} />
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Nothing here yet</div>
              <div>{isAdmin ? 'Upload a file or load the sample data to try access control.' : 'Upload a private document, or ask an admin to add shared ones.'}</div>
              {isAdmin && <div className="hint" style={{ marginTop: 8 }}>Tip: configure an embedding model first in <Link to="/settings/providers">LLM Providers</Link>.</div>}
            </div>
          )}
          {docs?.map((d) => {
            const k = KIND[d.kind] || KIND.text;
            const Icon = k.icon;
            return (
              <div className="list-row" key={d.id}>
                <span className="ficon" style={{ background: k.bg, color: k.color }}><Icon size={21} /></span>
                <div className="grow">
                  <div className="title">{d.filename}</div>
                  <div className="meta">
                    <span className={`badge ${d.department === 'HR' ? 'purple' : d.department === 'FINANCE' ? 'amber' : 'blue'}`}>{d.department}</span>
                    <span className="badge green"><ShieldCheck size={12} /> {d.accessLabel}</span>
                    <span>{k.label}{d.stats?.pages ? ` · ${d.stats.pages} page${d.stats.pages > 1 ? 's' : ''}` : ''}{d.stats?.rows ? ` · ${d.stats.rows} rows` : ''}{d.stats?.ocrConfidence != null ? ` · OCR ${d.stats.ocrConfidence}%` : ''}</span>
                    <span>{d.stats?.chunks ?? 0} passages</span>
                    <span>{formatBytes(d.size)}</span>
                    <span>by {d.uploadedBy} · {formatWhen(d.createdAt)}</span>
                    {d.status === 'failed' && <span className="badge red" title={d.error}>failed: {d.error?.slice(0, 80)}</span>}
                  </div>
                </div>
                {d.canDownload && d.kind !== 'records' && d.status === 'ready' && (
                  <button className="icon-btn" title="Open original" aria-label="Open original" onClick={() => api.openDocument(d.id).catch((e) => setMsg({ type: 'error', text: e.message }))}><ExternalLink size={18} /></button>
                )}
                {d.canDelete && (
                  <button
                    className="icon-btn"
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => window.confirm(`Delete “${d.filename}” and remove it from the index?`) && run('delete', () => api.deleteDocument(d.id), () => 'Document deleted.')}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showUpload && (
        <UploadModal
          user={user}
          onClose={() => setShowUpload(false)}
          onDone={() => {
            setShowUpload(false);
            setMsg({ type: 'ok', text: 'Document uploaded and indexed.' });
            load();
          }}
        />
      )}
    </div>
  );
}
