import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useT } from '../i18n';

export default function NewContentBanner({ count, onDismiss }) {
  const { t } = useT();
  const navigate = useNavigate();
  if (!count) return null;

  return (
    <div className="new-content-banner" style={{ marginBottom: 'var(--s-6)' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'var(--brand-soft)', color: 'var(--brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon name="download" size={15} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {count} {count === 1 ? t('newContentTitleSingular') : t('newContentTitlePlural')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t('newContentSub')}</div>
      </div>
      <button
        className="btn btn-secondary"
        onClick={() => { onDismiss(); navigate('/courses'); }}
        style={{ padding: '6px 12px', fontSize: 13 }}
        type="button"
      >
        {t('view')}
      </button>
      <button className="iconbtn" onClick={onDismiss} title={t('dismiss')} type="button">
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
