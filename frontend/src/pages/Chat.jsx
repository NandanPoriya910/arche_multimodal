import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Lightbulb, Link2, Loader2, MessageSquare, Paperclip, Send, TriangleAlert, X } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import SourceDrawer from '../components/SourceDrawer.jsx';
import { AssistantMessage, Typing, UserMessage } from '../components/MessageView.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useChats } from '../context/ChatsContext.jsx';
import { api } from '../services/api.js';
import { firstName } from '../utils.js';

const SUGGESTIONS = [
  { icon: MessageSquare, bg: 'linear-gradient(135deg,#8b5cf6,#a855f7)', title: 'Search company policies', text: 'Ask about leave, conduct, security and more.', prompt: 'How many days of paid annual leave does a full-time employee get?' },
  { icon: Lightbulb, bg: 'linear-gradient(135deg,#2dd4a4,#12b886)', title: 'Look up records', text: 'Find rows from HR & finance data you can access.', prompt: 'What is my pay grade and base salary?' },
  { icon: FileText, bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', title: 'Summarize a document', text: 'Get key points from the PDFs you have access to.', prompt: 'Summarize the employee handbook.' },
  { icon: Link2, bg: 'linear-gradient(135deg,#9b6cf5,#8b5cf6)', title: 'Read scanned images', text: 'Ask about text found in uploaded images (OCR).', prompt: 'When is the Ahmedabad office closed for Diwali?' },
];

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh } = useChats();

  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [models, setModels] = useState({ options: [], default: null, embeddingConfigured: true, loaded: false });
  const [modelKey, setModelKey] = useState(() => localStorage.getItem('modelKey') || '');
  const [attachments, setAttachments] = useState([]);
  const [citation, setCitation] = useState(null);

  const chatIdRef = useRef(id || null);
  const loadedRef = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  // available models
  useEffect(() => {
    api.availableModels().then((r) => setModels({ ...r, loaded: true })).catch(() => setModels((m) => ({ ...m, loaded: true })));
  }, []);

  // load chat when route changes
  useEffect(() => {
    if (!id) {
      chatIdRef.current = null;
      loadedRef.current = null;
      setMessages([]);
      setError('');
      return;
    }
    if (loadedRef.current === id) return; // we just created this one locally
    let cancelled = false;
    setError('');
    api.getChat(id)
      .then((r) => {
        if (cancelled) return;
        chatIdRef.current = id;
        loadedRef.current = id;
        setMessages(r.messages);
      })
      .catch(() => !cancelled && navigate('/', { replace: true }));
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending]);

  const keyOf = (o) => `${o.provider}|${o.model}`;
  const defaultKey = models.default ? keyOf(models.default) : models.options[0] ? keyOf(models.options[0]) : '';
  const activeKey = models.options.some((o) => keyOf(o) === modelKey) ? modelKey : defaultKey;
  const activeModel = models.options.find((o) => keyOf(o) === activeKey);
  const ready = models.options.length > 0 && models.embeddingConfigured;

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || pending || !ready) return;
    setError('');
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setPending(true);
    setMessages((m) => [...m, { role: 'user', content: text }]);

    let cid = chatIdRef.current;
    let created = false;
    try {
      if (!cid) {
        cid = (await api.createChat()).chat.id;
        created = true;
      }
      let r;
      try {
        r = await api.sendMessage(cid, text, activeModel);
      } catch (e) {
        if (created) api.deleteChat(cid).catch(() => {});
        throw e;
      }
      setMessages((m) => [...m, r.assistantMessage]);
      if (created) {
        chatIdRef.current = cid;
        loadedRef.current = cid;
        navigate(`/chat/${cid}`, { replace: true });
      }
      refresh();
    } catch (e) {
      setMessages((m) => m.slice(0, -1)); // take the optimistic question back…
      setInput(text); // …and let the user retry
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  async function onFiles(files) {
    for (const file of files) {
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      setAttachments((a) => [...a, { key, name: file.name, status: 'uploading' }]);
      try {
        const r = await api.uploadDocument(file, { access: 'private', department: 'GENERAL' });
        setAttachments((a) => a.map((x) => (x.key === key ? { ...x, status: 'ready', chunks: r.document.stats?.chunks } : x)));
      } catch (e) {
        setAttachments((a) => a.map((x) => (x.key === key ? { ...x, status: 'error', error: e.message } : x)));
      }
    }
  }

  const empty = messages.length === 0 && !pending;

  return (
    <div className="chat-wrap">
      {empty ? (
        <div className="empty scroll">
          <Logo size={58} />
          <h1>
            <span className="grad-text">Hello, {firstName(user.name)}</span> <span aria-hidden="true">👋</span>
          </h1>
          <p>I’m your AI assistant. Ask me anything about your knowledge base — every answer is cited and respects what you’re allowed to see.</p>
          <div className="suggest">
            {SUGGESTIONS.map(({ icon: Icon, bg, title, text, prompt }) => (
              <button
                key={title}
                className="suggest-card"
                onClick={() => {
                  setInput(prompt);
                  taRef.current?.focus();
                }}
              >
                <span className="ico" style={{ background: bg }}><Icon size={24} /></span>
                <span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </span>
                <ArrowRight className="arrow" size={20} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="thread">
          <div className="thread-inner">
            {messages.map((m, i) =>
              m.role === 'user' ? <UserMessage key={m.id || i} text={m.content} /> : <AssistantMessage key={m.id || i} message={m} onOpenCitation={setCitation} />
            )}
            {pending && <Typing />}
            <div ref={endRef} />
          </div>
        </div>
      )}

      <div className="composer-wrap">
        <div className="composer-inner">
          {models.loaded && !ready && (
            <div className="notice warn">
              <TriangleAlert size={18} />
              <span>
                {!models.options.length ? 'No LLM provider is configured yet. ' : 'No embedding model is configured yet. '}
                {user.role === 'ADMIN' ? <>Add an API key in <Link to="/settings/providers">Settings → LLM Providers</Link>.</> : 'Please ask an administrator to set one up.'}
              </span>
            </div>
          )}
          {error && <div className="notice error"><TriangleAlert size={18} />{error}</div>}

          {attachments.length > 0 && (
            <div className="chips">
              {attachments.map((a) => (
                <span className="chip" key={a.key} title={a.error}>
                  {a.status === 'uploading' && <Loader2 size={14} className="spin" />}
                  {a.status === 'ready' && <CheckCircle2 size={14} color="var(--green)" />}
                  {a.status === 'error' && <TriangleAlert size={14} color="var(--red)" />}
                  {a.name}
                  <span className="muted" style={{ fontSize: 12 }}>
                    {a.status === 'uploading' ? 'indexing…' : a.status === 'ready' ? 'private to you' : a.error}
                  </span>
                  <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => setAttachments((x) => x.filter((y) => y.key !== a.key))} aria-label="Dismiss"><X size={13} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="composer">
            <input ref={fileRef} type="file" hidden multiple accept=".pdf,.png,.jpg,.jpeg,.bmp,.webp,.csv,.json,.txt,.md" onChange={(e) => { onFiles([...e.target.files]); e.target.value = ''; }} />
            <button className="attach" onClick={() => fileRef.current?.click()} aria-label="Attach a file" title="Attach a file (private to you)">
              <Paperclip size={22} />
            </button>
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              placeholder="Type your message here..."
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="send" onClick={() => send()} disabled={!input.trim() || pending || !ready} aria-label="Send">
              {pending ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
            </button>
          </div>

          <div className="composer-foot">
            <span>Answers come only from documents you can access, with verified citations.</span>
            {models.options.length > 0 && (
              <select
                className="model-select"
                value={activeKey}
                onChange={(e) => {
                  setModelKey(e.target.value);
                  localStorage.setItem('modelKey', e.target.value);
                }}
                aria-label="Model"
              >
                {models.options.map((o) => (
                  <option key={keyOf(o)} value={keyOf(o)}>{o.providerName} · {o.model}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <SourceDrawer citation={citation} onClose={() => setCitation(null)} />
    </div>
  );
}
