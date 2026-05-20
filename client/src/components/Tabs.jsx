export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="lms-tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          className={`lms-tab${value === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.badge != null && t.badge > 0 && <span className="lms-tab-badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}
