import { useState } from 'react';
import { BadgeCheck, ExternalLink, FileImage, FileSpreadsheet, FileText, Loader2, X } from 'lucide-react';
import { api } from '../services/api.js';

export const kindIcon = { pdf: FileText, image: FileImage, record: FileSpreadsheet, text: FileText };

export function locationLabel(c) {
  if (c.kind === 'record') return `table “${c.table}” · row ${c.rowIndex}`;
  if (c.kind === 'image') return 'image (OCR)';
  return c.page ? `page ${c.page}` : 'text';
}

function Highlighted({ passage, start, end }) {
  if (start == null || end == null || end <= start) return passage;
  return (
    <>
      {passage.slice(0, start)}
      <mark>{passage.slice(start, end)}</mark>
      {passage.slice(end)}
    </>
  );
}

export default function SourceDrawer({ citation: c, onClose }) {
  const [opening, setOpening] = useState(false);
  const [err, setErr] = useState('');
  if (!c) return null;
  const Icon = kindIcon[c.kind] || FileText;

  async function open() {
    setErr('');
    setOpening(true);
    try {
      await api.openDocument(c.documentId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setOpening(false);
    }
  }

  return (
    <>
      <div className="drawer-back" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`Source ${c.n}`}>
        <header>
          <span className="ficon" style={{ background: 'var(--blue-bg)', color: 'var(--blue-600)' }}><Icon size={22} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>SOURCE [{c.n}]</div>
            <h3 style={{ fontSize: 17, wordBreak: 'break-word' }}>{c.filename}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <div className="body">
          <span className={`badge ${c.verification === 'exact' ? 'green' : 'amber'}`}>
            <BadgeCheck size={14} /> {c.verification === 'exact' ? 'Quote verified verbatim' : 'Closest matching sentence'}
          </span>

          <dl className="kv">
            <dt>Type</dt><dd>{c.kind === 'record' ? 'Database record' : c.kind === 'image' ? 'Image (OCR)' : c.kind === 'pdf' ? 'PDF' : 'Text'}</dd>
            <dt>Location</dt><dd>{locationLabel(c)}</dd>
            {c.kind === 'record' && <><dt>Row key</dt><dd>{c.rowKey || '—'}</dd></>}
            {c.pageCharStart != null && <><dt>Characters</dt><dd>{c.pageCharStart}–{c.pageCharEnd} on {c.kind === 'image' ? 'the image text' : `page ${c.page}`}</dd></>}
            {c.ocrConfidence != null && <><dt>OCR confidence</dt><dd>{c.ocrConfidence}%</dd></>}
            <dt>Relevance</dt><dd>{Math.round(c.score * 100)}% similarity</dd>
          </dl>

          <div className="label" style={{ marginBottom: 8 }}>Supporting passage <span className="muted" style={{ fontWeight: 400 }}>(highlight = cited text)</span></div>
          <div className="passage"><Highlighted passage={c.passage} start={c.quoteStart} end={c.quoteEnd} /></div>

          {c.kind !== 'record' && (
            <div style={{ marginTop: 18 }}>
              <button className="btn" onClick={open} disabled={opening}>
                {opening ? <Loader2 size={16} className="spin" /> : <ExternalLink size={16} />} Open original file
              </button>
            </div>
          )}
          {err && <div className="notice error" style={{ marginTop: 14 }}>{err}</div>}
        </div>
      </aside>
    </>
  );
}
