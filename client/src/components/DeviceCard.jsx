import Avatar from './Avatar';

function fmtAgo(ms) {
  if (ms == null) return '';
  if (ms < 60 * 1000)        return `${Math.round(ms / 1000)}s ago`;
  if (ms < 60 * 60 * 1000)   return `${Math.round(ms / 60000)}m ago`;
  return `${Math.round(ms / 3600000)}h ago`;
}

export default function DeviceCard({ device }) {
  const synced = device.synced || 0;
  const total = device.total || 0;
  const pct = total > 0 ? (synced / total) * 100 : 0;
  const name = device.name || device.id || 'Unknown';
  const tail = name.split(' · ').pop();

  return (
    <div className="lms-card lms-device-card">
      <div className="lms-device-row">
        <Avatar name={tail} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lms-device-name">{name}</div>
          <div className="lms-list-row-muted">
            {device.role === 'teacher' ? 'Teacher' : 'Student'} · {fmtAgo(device.last_seen_ms)}
          </div>
        </div>
        <span
          className={`lms-device-pip ${device.live ? 'on' : 'off'}`}
          title={device.live ? 'Online' : 'Offline'}
        />
      </div>
      <div className="lms-device-bar">
        <div style={{ width: `${pct}%`, background: pct === 100 ? 'var(--lms-ok)' : 'var(--lms-warn)' }} />
      </div>
      <div className="lms-device-meta">
        <span>{synced} / {total} lessons</span>
        <span>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
