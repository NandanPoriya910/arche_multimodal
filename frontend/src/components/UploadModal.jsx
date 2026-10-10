import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { api } from '../services/api.js';
import { ROLE_DEPARTMENTS, formatBytes } from '../utils.js';

const ROLES = ['ADMIN', 'HR', 'FINANCE', 'EMPLOYEE'];
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.bmp,.webp,.csv,.json,.txt,.md';

export default function UploadModal({ user, onClose, onDone }) {
  const departments = ROLE_DEPARTMENTS[user.role] || [];
  const canShare = departments.length > 0;
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [department, setDepartment] = useState(departments.includes('GENERAL') ? 'GENERAL' : departments[0] || 'GENERAL');
  const [access, setAccess] = useState(canShare ? 'department' : 'private');
  const [roles, setRoles] = useState([user.role === 'ADMIN' ? 'ADMIN' : user.role]);
  const [tableName, setTableName] = useState('');
  const [ownerColumn, setOwnerColumn] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const isRecords = file && /\.(csv|json)$/i.test(file.name);
  const isImage = file && /\.(png|jpe?g|bmp|webp)$/i.test(file.name);

  async function submit(e) {
    e.preventDefault();
    if (!file) return setError('Choose a file first.');
    setBusy(true);
    setError('');
    try {
      await api.uploadDocument(file, {
        department,
        access,
        allowedRoles: access === 'roles' ? roles : undefined,
        tableName: isRecords ? tableName : undefined,
        ownerColumn: isRecords && access !== 'private' ? ownerColumn : undefined,
      });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const option = (value, title, text) => (
    <label key={value} className={`radio-card ${access === value ? 'sel' : ''}`}>
      <input type="radio" name="access" checked={access === value} onChange={() => setAccess(value)} />
      <span><b>{title}</b><span className="hint">{text}</span></span>
    </label>
  );

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="modal" onSubmit={submit}>
        <h2>Add to knowledge base</h2>
        <p className="hint" style={{ marginBottom: 16 }}>PDFs, images (read with OCR), CSV/JSON records, or text files.</p>

        {error && <div className="notice error">{error}</div>}

        <div
          className={`drop ${drag ? 'on' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" hidden accept={ACCEPT} onChange={(e) => setFile(e.target.files[0] || null)} />
          <Upload size={26} />
          <div style={{ marginTop: 6, fontWeight: 600 }}>{file ? file.name : 'Drop a file here or click to browse'}</div>
          <div className="hint">{file ? formatBytes(file.size) : 'Up to 25 MB'}</div>
        </div>

        {isImage && <div className="notice info">Text in this image will be extracted with OCR. Clear, high-contrast images work best.</div>}

        {canShare && (
          <>
            <div className="field">
              <label htmlFor="dept">Department</label>
              <select id="dept" className="input" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={access === 'private'}>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="label" style={{ marginBottom: 8 }}>Who can see this?</div>
            {option("department", `Everyone with ${department} access`, "Default for the selected department.")}
            {option("roles", "Only specific roles", "Pick exactly which roles may read it.")}
            {access === 'roles' && (
              <div className="roles">
                {ROLES.map((r) => (
                  <label className="check" key={r}>
                    <input type="checkbox" checked={roles.includes(r)} onChange={(e) => setRoles((cur) => (e.target.checked ? [...cur, r] : cur.filter((x) => x !== r)))} /> {r}
                  </label>
                ))}
              </div>
            )}
            {option("private", "Only me", "Private to you (admins can still see it).")}
          </>
        )}
        {!canShare && <div className="notice info">As an employee you can add <b>private</b> documents that only you can search.</div>}

        {isRecords && access !== 'private' && (
          <div style={{ marginTop: 14 }}>
            <div className="grid2">
              <div className="field">
                <label htmlFor="tn">Table name</label>
                <input id="tn" className="input" placeholder={file.name.replace(/\.\w+$/, '')} value={tableName} onChange={(e) => setTableName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="oc">Row owner column <span className="muted">(optional)</span></label>
                <input id="oc" className="input" placeholder="e.g. employee_username" value={ownerColumn} onChange={(e) => setOwnerColumn(e.target.value)} />
              </div>
            </div>
            <p className="hint" style={{ marginTop: -6 }}>
              Row-level security: if set, each row is also readable by the user whose <b>username</b> appears in that column (e.g. employees can see only their own payroll row).
            </p>
          </div>
        )}

        <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 22 }}>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy || !file}>
            {busy ? <><Loader2 size={16} className="spin" /> Indexing…</> : 'Upload & index'}
          </button>
        </div>
      </form>
    </div>
  );
}
