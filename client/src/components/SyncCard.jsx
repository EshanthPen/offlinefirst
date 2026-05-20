import Icon from './Icon';
import { useT } from '../i18n';

const META = {
  synced:  { labelKey: 'allCaughtUp',  detailKey: 'allCaughtUpDetail', cls: 'success', icon: 'wifi'     },
  syncing: { labelKey: 'syncing',      detailKey: 'syncingDetail',     cls: 'info',    icon: 'refresh'  },
  local:   { labelKey: 'localMesh',    detailKey: 'localMeshDetail',   cls: 'warning', icon: 'wifi'     },
  offline: { labelKey: 'offline',      detailKey: 'offlineDetail',     cls: 'danger',  icon: 'wifi-off' }
};

export default function SyncCard({ status, peers = 0, pending = 0, onClose }) {
  const { t } = useT();
  const m = META[status] || META.synced;
  return (
    <div className={`sync-card sync-card-${m.cls}`}>
      <div className="sync-card-row">
        <Icon name={m.icon} size={18} color={`var(--${m.cls === 'success' ? 'success' : m.cls === 'info' ? 'info' : m.cls === 'warning' ? 'warning' : 'danger'})`} />
        <div style={{ flex: 1 }}>
          <div className="sync-card-label">{t(m.labelKey)}</div>
          <div className="sync-card-detail">{t(m.detailKey)}</div>
        </div>
        {onClose && (
          <button className="iconbtn" onClick={onClose} style={{ width: 26, height: 26 }} title="Close" type="button">
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
      <div className="sync-card-meta">
        <span><Icon name="users" size={13} /> {peers} {peers === 1 ? t('peerSingular') : t('peerPlural')} {t('connected')}</span>
        {pending > 0 && (
          <span className="pending">
            <Icon name="clock" size={13} /> {pending} {pending === 1 ? t('pendingSingular') : t('pendingPlural')}
          </span>
        )}
      </div>
    </div>
  );
}
