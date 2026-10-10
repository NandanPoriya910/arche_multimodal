import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Loader2, Plus, RefreshCw, Trash2, TriangleAlert, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const BRAND = { openai: '#10a37f', anthropic: '#d97757', gemini: '#4285f4', voyage: '#6d5bd0' };
const LETTER = { openai: 'O', anthropic: 'A', gemini: 'G', voyage: 'V' };

function TagInput({ value, onChange, suggestions = [], listId }) {
  const [text, setText] = useState('');
  const add = (m) => {
    const v = m.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText('');
  };
  return (
    <div>
      <div className="tags">
        {value.map((m) => (
          <span className="tag" key={m}>{m}<button type="button" onClick={() => onChange(value.filter((x) => x !== m))} aria-label={`Remove ${m}`}><X size={13} /></button></span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          list={listId}
          placeholder="Type a model name and press Enter"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(text); } }}
        />
        <button type="button" className="btn" onClick={() => add(text)} disabled={!text.trim()}><Plus size={16} /></button>
      </div>
      <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
      {suggestions.filter((s) => !value.includes(s)).length > 0 && (
        <div className="sug">
          {suggestions.filter((s) => !value.includes(s)).slice(0, 8).map((s) => <button type="button" key={s} onClick={() => add(s)}>+ {s}</button>)}
        </div>
      )}
    </div>
  );
}

function ProviderCard({ p, onChanged }) {
  const [apiKey, setApiKey] = useState('');
  const [show, setShow] = useState(false);
  const [baseUrl, setBaseUrl] = useState(p.baseUrl);
  const [enabled, setEnabled] = useState(p.enabled);
  const [chatModels, setChatModels] = useState(p.chatModels);
  const [embeddingModel, setEmbeddingModel] = useState(p.embeddingModel);
  const [fetched, setFetched] = useState({ chat: [], embedding: [] });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const { chat, embeddings } = p.capabilities;
  const chatSug = [...new Set([...p.suggestedChatModels, ...fetched.chat])];
  const embSug = [...new Set([...p.suggestedEmbeddingModels, ...fetched.embedding])];

  async function act(name, fn) {
    setBusy(name);
    setMsg(null);
    try {
      return await fn();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy('');
    }
  }

  const save = () =>
    act('save', async () => {
      const r = await api.saveProvider(p.id, { apiKey: apiKey || undefined, baseUrl, enabled, chatModels, embeddingModel });
      setApiKey('');
      setMsg({ type: 'ok', text: 'Saved. The key is encrypted and never shown again.' });
      onChanged(r);
    });

  const test = () =>
    act('test', async () => {
      const r = await api.testProvider(p.id);
      setMsg({ type: r.ok ? 'ok' : 'error', text: r.ok ? `Connection OK — ${r.message}` : r.message });
      onChanged(null);
    });

  const fetchModels = () =>
    act('models', async () => {
      const r = await api.fetchProviderModels(p.id);
      setFetched(r);
      setMsg({ type: 'ok', text: `Found ${r.chat.length} chat and ${r.embedding.length} embedding models. Click one to add it.` });
    });

  const removeKey = () =>
    act('remove', async () => {
      if (!window.confirm(`Remove the saved ${p.name} API key?`)) return;
      const r = await api.removeProviderKey(p.id);
      setMsg({ type: 'ok', text: 'Key removed.' });
      onChanged(r);
    });

  const status = !p.configured ? <span className="badge">Not configured</span> : p.lastTest ? (p.lastTest.ok ? <span className="badge green"><CheckCircle2 size={13} /> Connected</span> : <span className="badge red">Test failed</span>) : <span className="badge blue">Key saved</span>;

  return (
    <div className="card provider">
      <div className="provider-head">
        <span className="provider-logo" style={{ background: BRAND[p.id] }}>{LETTER[p.id]}</span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h3>{p.name}</h3>
          <div className="hint">{[chat && 'Chat', embeddings && 'Embeddings'].filter(Boolean).join(' · ')}</div>
        </div>
        {status}
        <label className="switch" title={enabled ? 'Enabled' : 'Disabled'}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} aria-label="Enabled" /><span />
        </label>
      </div>

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      {p.lastTest && !p.lastTest.ok && !msg && <div className="notice error">{p.lastTest.message}</div>}

      <div className="field">
        <label htmlFor={`k-${p.id}`}>API key</label>
        <div className="input-icon">
          <KeyRound className="lead" size={18} />
          <input
            id={`k-${p.id}`}
            className="input"
            style={{ height: 44, paddingRight: 48 }}
            type={show ? 'text' : 'password'}
            autoComplete="off"
            placeholder={p.configured ? `${p.apiKeyMasked}  (leave blank to keep)` : p.keyHint}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button type="button" className="icon-btn trail" onClick={() => setShow((s) => !s)} aria-label="Show or hide key">{show ? <Eye size={18} /> : <EyeOff size={18} />}</button>
        </div>
        <span className="hint">Get a key at <a href={p.docsUrl} target="_blank" rel="noreferrer">{new URL(p.docsUrl).host} <ExternalLink size={11} /></a></span>
      </div>

      {chat && (
        <div className="field">
          <label>Chat models shown in the model picker</label>
          <TagInput value={chatModels} onChange={setChatModels} suggestions={chatSug} listId={`cm-${p.id}`} />
        </div>
      )}
      {embeddings && (
        <div className="field">
          <label htmlFor={`e-${p.id}`}>Embedding model</label>
          <input id={`e-${p.id}`} className="input" list={`em-${p.id}`} placeholder={p.suggestedEmbeddingModels[0]} value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} />
          <datalist id={`em-${p.id}`}>{embSug.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
      )}

      <details>
        <summary className="hint" style={{ cursor: 'pointer', marginBottom: 10 }}>Advanced: custom base URL</summary>
        <div className="field">
          <input className="input" placeholder={p.defaultBaseUrl} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          <span className="hint">Leave empty to use the official endpoint. Use this for a proxy or a compatible gateway.</span>
        </div>
      </details>

      <div className="provider-foot">
        <button className="btn primary" onClick={save} disabled={!!busy}>{busy === 'save' && <Loader2 size={16} className="spin" />} Save</button>
        <button className="btn" onClick={test} disabled={!!busy || !p.configured}>{busy === 'test' ? <Loader2 size={16} className="spin" /> : <Zap size={16} />} Test connection</button>
        <button className="btn" onClick={fetchModels} disabled={!!busy || !p.configured}>{busy === 'models' ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} Fetch models</button>
        {p.configured && <button className="btn danger" style={{ marginLeft: 'auto' }} onClick={removeKey} disabled={!!busy}><Trash2 size={16} /> Remove key</button>}
      </div>
    </div>
  );
}

function Defaults({ data, onSaved }) {
  const { providers, defaults, index } = data;
  const usable = (cap) => providers.filter((p) => p.configured && p.enabled && p.capabilities[cap]);
  const [d, setD] = useState(defaults);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  useEffect(() => setD(defaults), [defaults]);

  const modelsFor = (id, cap) => {
    const p = providers.find((x) => x.id === id);
    if (!p) return [];
    return cap === 'chat' ? [...new Set([...p.chatModels, ...p.suggestedChatModels])] : [...new Set([p.embeddingModel, ...p.suggestedEmbeddingModels].filter(Boolean))];
  };

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.saveDefaultModels(d);
      onSaved(r.defaults);
      setMsg(r.reindexRequired
        ? { type: 'warn', text: 'Saved. The embedding model changed, so existing documents must be re-indexed (Knowledge Base → Re-index) before search works again.' }
        : { type: 'ok', text: 'Default models saved.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const chatP = usable('chat');
  const embP = usable('embeddings');

  return (
    <div className="card defaults">
      <h3 style={{ fontSize: 18 }}>Default models</h3>
      <p className="hint" style={{ margin: '4px 0 16px' }}>Chat answers use the chat model. Documents and questions are embedded with the embedding model and stored in FAISS.</p>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      {index?.signature && <div className="hint" style={{ marginBottom: 12 }}>Current index built with <b>{index.signature.model}</b> ({index.signature.dim} dims).</div>}

      {(chatP.length === 0 || embP.length === 0) && (
        <div className="notice info"><TriangleAlert size={18} />
          <span>{chatP.length === 0 && 'Save an API key for a chat provider (OpenAI, Anthropic or Gemini). '}{embP.length === 0 && 'Save an API key for an embeddings provider (OpenAI, Gemini or Voyage).'}</span>
        </div>
      )}

      <div className="grid2">
        <div className="field">
          <label>Chat provider</label>
          <select className="input" value={d.chatProvider} onChange={(e) => setD({ ...d, chatProvider: e.target.value, chatModel: modelsFor(e.target.value, 'chat')[0] || '' })}>
            <option value="">Select…</option>
            {chatP.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Chat model</label>
          <input className="input" list="dm-chat" value={d.chatModel} onChange={(e) => setD({ ...d, chatModel: e.target.value })} placeholder="model name" />
          <datalist id="dm-chat">{modelsFor(d.chatProvider, 'chat').map((m) => <option key={m} value={m} />)}</datalist>
        </div>
        <div className="field">
          <label>Embedding provider</label>
          <select className="input" value={d.embeddingProvider} onChange={(e) => setD({ ...d, embeddingProvider: e.target.value, embeddingModel: modelsFor(e.target.value, 'emb')[0] || '' })}>
            <option value="">Select…</option>
            {embP.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Embedding model</label>
          <input className="input" list="dm-emb" value={d.embeddingModel} onChange={(e) => setD({ ...d, embeddingModel: e.target.value })} placeholder="model name" />
          <datalist id="dm-emb">{modelsFor(d.embeddingProvider, 'emb').map((m) => <option key={m} value={m} />)}</datalist>
        </div>
      </div>
      <button className="btn primary" onClick={save} disabled={busy}>{busy && <Loader2 size={16} className="spin" />} Save defaults</button>
    </div>
  );
}

export default function Providers() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.listProviders().then(setData).catch((e) => setError(e.message));
  useEffect(() => { if (user.role === 'ADMIN') load(); }, [user.role]);

  if (user.role !== 'ADMIN') {
    return <div className="notice warn"><TriangleAlert size={18} />Only administrators can manage LLM providers and API keys.</div>;
  }
  if (error) return <div className="notice error">{error}</div>;
  if (!data) return <div className="empty-state"><Loader2 className="spin" /></div>;

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>LLM Providers & API Keys</h1>
          <p>Connect providers directly with your own API keys. Keys are encrypted at rest and only used by the server. Need documents? <Link to="/knowledge">Open the Knowledge Base</Link>.</p>
        </div>
      </div>
      <Defaults data={data} onSaved={(defaults) => setData((d) => ({ ...d, defaults }))} />
      {data.providers.map((p) => (
        <ProviderCard
          key={p.id}
          p={p}
          onChanged={(r) => (r ? setData((d) => ({ ...d, providers: d.providers.map((x) => (x.id === r.provider.id ? r.provider : x)), defaults: r.defaults || d.defaults })) : load())}
        />
      ))}
    </div>
  );
}
