export default function EmptyState({ illustration, title, sub, action, onAction }) {
  return (
    <div className="lms-empty">
      <div className="lms-empty-art" aria-hidden="true">
        {illustration || (
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <rect x="20" y="42" width="80" height="56" rx="4" fill="#E8F0FE" />
            <rect x="28" y="50" width="44" height="6" rx="2" fill="#C6DAFC" />
            <rect x="28" y="62" width="64" height="4" rx="2" fill="#DADCE0" />
            <rect x="28" y="72" width="56" height="4" rx="2" fill="#DADCE0" />
            <rect x="28" y="82" width="40" height="4" rx="2" fill="#DADCE0" />
            <circle cx="92" cy="38" r="14" fill="#1967D2" />
            <path d="M86 38l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </div>
      <h3 className="lms-empty-title">{title}</h3>
      {sub && <p className="lms-empty-sub">{sub}</p>}
      {action && (
        <button className="lms-pill-btn" type="button" onClick={onAction} style={{ marginTop: 16 }}>
          {action}
        </button>
      )}
    </div>
  );
}
