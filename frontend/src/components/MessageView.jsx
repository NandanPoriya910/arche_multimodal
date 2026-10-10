import { CheckCircle2, ShieldAlert } from 'lucide-react';
import Logo from './Logo.jsx';
import { kindIcon, locationLabel } from './SourceDrawer.jsx';

export function UserMessage({ text }) {
  return (
    <div className="msg user">
      <div className="bubble-user">{text}</div>
    </div>
  );
}

export function Typing() {
  return (
    <div className="msg">
      <div className="av"><Logo size={20} /></div>
      <div className="typing" aria-label="Assistant is thinking"><i /><i /><i /></div>
    </div>
  );
}

export function ErrorMessage({ text }) {
  return (
    <div className="msg">
      <div className="av"><Logo size={20} /></div>
      <div className="bubble-ai"><div className="notice error" style={{ margin: 0 }}><ShieldAlert size={18} />{text}</div></div>
    </div>
  );
}

export function AssistantMessage({ message, onOpenCitation }) {
  const { statements = [], citations = [], meta = {}, content } = message;
  const byN = new Map(citations.map((c) => [c.n, c]));
  const grounded = statements.length > 0;

  return (
    <div className="msg">
      <div className="av"><Logo size={20} /></div>
      <div className="bubble-ai">
        <div className={`answer ${grounded ? '' : 'refusal'}`}>
          {grounded
            ? statements.map((s, i) => (
                <span className="stmt" key={i}>
                  {s.text}
                  {s.cites.map((n) => (
                    <button key={n} className="cite" title={byN.get(n)?.filename} onClick={() => onOpenCitation(byN.get(n))}>
                      {n}
                    </button>
                  ))}
                </span>
              ))
            : content}
        </div>

        {grounded && (
          <>
            <div className="sources">
              {citations.map((c) => {
                const Icon = kindIcon[c.kind];
                return (
                  <button key={c.n} className="source-pill" onClick={() => onOpenCitation(c)}>
                    <span className="n">{c.n}</span>
                    {Icon && <Icon size={15} />}
                    <span className="nm">{c.filename}</span>
                    <span className="muted">{locationLabel(c)}</span>
                  </button>
                );
              })}
            </div>
            <div className="verify-line">
              <span className="ok"><CheckCircle2 size={14} /> {statements.length} statement{statements.length === 1 ? '' : 's'} verified against sources</span>
              {meta.droppedStatements > 0 && <span title="These claims could not be backed by the cited text, so they were removed.">{meta.droppedStatements} unsupported statement{meta.droppedStatements === 1 ? '' : 's'} removed</span>}
              {meta.model && <span>{meta.model}</span>}
              {meta.latencyMs != null && <span>{(meta.latencyMs / 1000).toFixed(1)}s</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
