export default function MeshGraph({ devices = [] }) {
  const peers = devices.filter(d => d.live !== false).slice(0, 8);
  const cx = 220, cy = 150;
  const radius = 110;
  const step = peers.length > 0 ? (2 * Math.PI) / peers.length : 0;

  return (
    <div className="lms-card lms-mesh">
      <div className="lms-card-head">
        <h2 className="lms-section-title">Local mesh network</h2>
        <span className="lms-chip ok" style={{ marginLeft: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse-dot 1.4s infinite' }} />
          {peers.length} {peers.length === 1 ? 'peer' : 'peers'} online
        </span>
      </div>
      <svg viewBox="0 0 440 300" style={{ display: 'block', width: '100%', height: 320 }}>
        <circle cx={cx} cy={cy} r="140" fill="var(--lms-primary-soft)" opacity="0.6" />
        {[50, 85, 120].map((r, i) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none"
            stroke="var(--lms-rule-strong)" strokeWidth="1"
            strokeDasharray={i === 1 ? '3 4' : '1 5'} opacity={0.4} />
        ))}
        {peers.map((p, i) => {
          const angle = i * step - Math.PI / 2;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          const label = (p.name || p.id || 'device').split(' · ').pop();
          return (
            <g key={p.id}>
              <line x1={cx} y1={cy} x2={px} y2={py}
                stroke="var(--lms-primary)" strokeWidth="1.4"
                strokeDasharray={p.live !== false ? '0' : '2 4'} />
              <circle cx={px} cy={py} r="18" fill="var(--lms-surface)" stroke="var(--lms-primary)" strokeWidth="2" />
              <text x={px} y={py + 5} textAnchor="middle"
                fontSize="12" fill="var(--lms-primary)" fontFamily="Roboto, sans-serif" fontWeight="700">
                {label[0]?.toUpperCase() || '?'}
              </text>
              <text x={px} y={py + 36} textAnchor="middle"
                fontSize="11" fill="var(--lms-ink-muted)" fontFamily="Roboto, sans-serif">
                {label.slice(0, 14)}
              </text>
              {p.synced != null && p.total != null && (
                <text x={px} y={py + 50} textAnchor="middle"
                  fontSize="10" fill="var(--lms-ink-faint)" fontFamily="Roboto, sans-serif">
                  {p.synced} / {p.total} lessons
                </text>
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="28" fill="var(--lms-primary)" />
        <text x={cx} y={cy + 5} textAnchor="middle"
          fontSize="14" fill="white" fontFamily="Roboto, sans-serif" fontWeight="700">YOU</text>
        <text x={cx} y={cy + 58} textAnchor="middle"
          fontSize="11" fill="var(--lms-ink-muted)" fontFamily="Roboto, sans-serif" letterSpacing="0.06em">
          THIS DEVICE
        </text>
        {peers.length === 0 && (
          <text x={cx} y={cy + 95} textAnchor="middle"
            fontSize="12" fill="var(--lms-ink-faint)" fontFamily="Roboto, sans-serif">
            No peers detected nearby
          </text>
        )}
      </svg>
    </div>
  );
}
