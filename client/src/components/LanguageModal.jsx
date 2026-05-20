import { useMemo, useState } from 'react';
import Icon from './Icon';
import { LMS_LANGUAGES } from '../data/languages';

export default function LanguageModal({ lang, onPick, onClose }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return LMS_LANGUAGES;
    const q = query.toLowerCase().trim();
    return LMS_LANGUAGES.filter(l =>
      l.label.toLowerCase().includes(q) ||
      l.native.toLowerCase().includes(q) ||
      l.code.toLowerCase() === q ||
      l.region.toLowerCase().includes(q)
    );
  }, [query]);

  const groups = useMemo(() => {
    const g = {};
    filtered.forEach(l => {
      if (!g[l.region]) g[l.region] = [];
      g[l.region].push(l);
    });
    return g;
  }, [filtered]);

  return (
    <div className="lms-modal-backdrop" onClick={onClose}>
      <div className="lms-modal lms-lang-modal" onClick={e => e.stopPropagation()}>
        <div className="lms-modal-head">
          <h2 style={{ margin: 0, fontFamily: 'var(--lms-font-display)', fontSize: 20, fontWeight: 500 }}>
            Pick your language
          </h2>
          <button className="lms-iconbtn" type="button" onClick={onClose} title="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="lms-modal-search">
          <Icon name="search" size={16} color="var(--lms-ink-muted)" />
          <input
            placeholder="Search by name, native, or region…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="lms-iconbtn small" type="button" onClick={() => setQuery('')}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
        <div className="lms-lang-list">
          {Object.entries(groups).map(([region, items]) => (
            <div key={region}>
              <div className="lms-lang-group-label">{region}</div>
              {items.map(l => (
                <button
                  key={l.code}
                  type="button"
                  className={`lms-lang-item${l.code === lang ? ' selected' : ''}`}
                  onClick={() => onPick(l.code)}
                >
                  <span className="lms-lang-native">{l.native}</span>
                  <span className="lms-lang-english">{l.label}</span>
                  <span className="lms-lang-code-pill">{l.code.toUpperCase()}</span>
                  {l.code === lang && <Icon name="check-circle" size={18} color="var(--lms-primary)" />}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--lms-ink-muted)' }}>
              No languages match "{query}".
            </div>
          )}
        </div>
        <div className="lms-modal-foot">
          <span style={{ fontSize: 12, color: 'var(--lms-ink-faint)' }}>
            {LMS_LANGUAGES.length} languages available. Translations roll out over the mesh.
          </span>
        </div>
      </div>
    </div>
  );
}
