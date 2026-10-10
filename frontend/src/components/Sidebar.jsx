import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useMatch, useNavigate } from 'react-router-dom';
import { BookOpen, Briefcase, ChevronsUpDown, Clock, LogOut, MessageSquare, Moon, MoreVertical, Pencil, Plus, Settings, Shield, Sun, Trash2, User, Users } from 'lucide-react';
import Logo from './Logo.jsx';
import { useChats } from '../context/ChatsContext.jsx';
import { formatWhen, initials } from '../utils.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function RecentItem({ chat, active, onNavigate }) {
  const { remove, rename } = useChats();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Link to={`/chat/${chat.id}`} className={`recent-item ${active ? 'active' : ''}`} onClick={onNavigate}>
        <MessageSquare size={16} />
        <div className="grow">
          <div className="t">{chat.title}</div>
          <div className="s">{formatWhen(chat.updatedAt)}</div>
        </div>
        <button
          className="icon-btn kebab"
          aria-label="Chat options"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <MoreVertical size={16} />
        </button>
      </Link>
      {open && (
        <div className="menu">
          <button
            onClick={async () => {
              setOpen(false);
              const t = window.prompt('Rename chat', chat.title);
              if (t && t.trim()) await rename(chat.id, t.trim()).catch((e) => alert(e.message));
            }}
          >
            <Pencil size={15} /> Rename
          </button>
          <button
            className="danger"
            onClick={async () => {
              setOpen(false);
              if (!window.confirm('Delete this chat?')) return;
              await remove(chat.id).catch((e) => alert(e.message));
              if (active) navigate('/');
            }}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function UserCard({ onNavigate }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="side-user" ref={ref}>
      {open && (
        <div className="user-pop">
          <Link to="/settings/account" onClick={() => { setOpen(false); onNavigate?.(); }}>
            <User size={16} /> Account
          </Link>
          <button className="danger" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
      <button className="user-card" onClick={() => setOpen((v) => !v)} aria-label="Account menu">
        <span className="avatar">{initials(user.name)}</span>
        <span className="who">
          <b>{user.name}</b>
          <span>{user.role}</span>
        </span>
        <ChevronsUpDown size={16} />
      </button>
      <button className="icon-btn theme-btn" onClick={toggle} aria-label="Toggle theme" title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
        {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const { chats, loaded } = useChats();
  const id = useMatch('/chat/:id')?.params.id;
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <Link to="/" className="side-brand" onClick={onNavigate}>
        <Logo size={34} />
        <span className="wordmark">ARCHE</span>
      </Link>
      <button
        className="btn primary new-chat"
        onClick={() => {
          navigate('/');
          onNavigate?.();
        }}
      >
        <Plus size={18} /> New chat
      </button>

      <nav className="nav">
        <NavLink to="/history" className="nav-item" onClick={onNavigate}>
          <Clock size={18} /> Chat History
        </NavLink>
        <NavLink to="/knowledge" className="nav-item" onClick={onNavigate}>
          <BookOpen size={18} /> Knowledge Base
        </NavLink>
      </nav>

      <div className="side-section">Recent</div>
      <div className="recent">
        {loaded && chats.length === 0 && <div className="hint" style={{ padding: '6px 10px' }}>No chats yet. Ask your first question!</div>}
        {chats.slice(0, 8).map((c) => (
          <RecentItem key={c.id} chat={c} active={c.id === id} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="side-bottom">
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className="nav-item" onClick={onNavigate}>
            <Shield size={18} /> Admin Panel
          </NavLink>
        )}
        {user?.role === 'HR' && (
          <NavLink to="/hr" className="nav-item" onClick={onNavigate}>
            <Users size={18} /> HR Dashboard
          </NavLink>
        )}
        {['EMPLOYEE', 'HR', 'FINANCE', 'ADMIN'].includes(user?.role) && (
          <NavLink to="/employee" className="nav-item" onClick={onNavigate}>
            <Briefcase size={18} /> My Workspace
          </NavLink>
        )}
        <NavLink to="/settings" className="nav-item" onClick={onNavigate}>
          <Settings size={18} /> Settings
        </NavLink>
      </div>
      <UserCard onNavigate={onNavigate} />
    </aside>
  );
}
