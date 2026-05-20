import Icon from './Icon';

const MAP = {
  synced:  { label: 'All caught up', cls: 'ok',   icon: 'wifi' },
  syncing: { label: 'Syncing',       cls: 'info', icon: 'refresh' },
  local:   { label: 'Local mesh',    cls: 'warn', icon: 'wifi' },
  offline: { label: 'Offline',       cls: 'bad',  icon: 'wifi-off' }
};

export default function SyncBadge({ status }) {
  const s = MAP[status] || MAP.synced;
  return (
    <span className={`lms-sync-badge ${s.cls}`} title={s.label}>
      <Icon name={s.icon} size={14} />
      <span>{s.label}</span>
    </span>
  );
}
