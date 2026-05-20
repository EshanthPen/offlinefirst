import Icon from './Icon';

export default function SectionHeader({ title, subtitle, cta, onCta }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 'var(--s-5)', gap: 16
    }}>
      <div>
        <h2 className="h2" style={{ marginBottom: subtitle ? 4 : 0 }}>{title}</h2>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{subtitle}</div>}
      </div>
      {cta && (
        <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }} onClick={onCta} type="button">
          {cta} <Icon name="chevron-right" size={14} />
        </button>
      )}
    </div>
  );
}
