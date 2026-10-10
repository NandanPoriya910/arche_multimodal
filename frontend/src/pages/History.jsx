import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search, Trash2 } from 'lucide-react';
import { useChats } from '../context/ChatsContext.jsx';
import { formatWhen } from '../utils.js';

export default function History() {
  const { chats, loaded, remove } = useChats();
  const [q, setQ] = useState('');
  const shown = useMemo(() => chats.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())), [chats, q]);

  return (
    <div className="scroll">
      <div className="page">
        <div className="page-head">
          <div>
            <h1>Chat History</h1>
            <p>Your past conversations. Only you can see them.</p>
          </div>
          <div className="input-icon search" style={{ width: 300 }}>
            <Search className="lead" size={18} />
            <input className="input" style={{ height: 44 }} placeholder="Search chats" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="card list">
          {loaded && shown.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={32} />
              <div>{q ? 'No chats match your search.' : 'No conversations yet.'}</div>
            </div>
          )}
          {shown.map((c) => (
            <div className="list-row" key={c.id}>
              <Link to={`/chat/${c.id}`} className="list-row link" style={{ padding: 0, border: 0, flex: 1, minWidth: 0 }}>
                <span className="ficon" style={{ background: 'var(--blue-bg)', color: 'var(--blue-600)' }}><MessageSquare size={20} /></span>
                <div className="grow">
                  <div className="title">{c.title}</div>
                  <div className="meta">{formatWhen(c.updatedAt)}</div>
                </div>
              </Link>
              <button
                className="icon-btn"
                aria-label="Delete chat"
                onClick={async () => {
                  if (window.confirm('Delete this chat?')) await remove(c.id).catch((e) => alert(e.message));
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
