import Icon from './Icon';
import { useT } from '../i18n';

export default function ListenButton({ active, onClick, size = 'sm' }) {
  const { t } = useT();
  return (
    <button
      onClick={onClick}
      className={`listen-btn${active ? ' active' : ''}${size === 'lg' ? ' listen-lg' : ''}`}
      title={active ? t('stop') : t('listen')}
      type="button"
    >
      <Icon name={active ? 'stop' : 'volume'} size={size === 'lg' ? 14 : 12} />
      <span>{active ? t('stop') : t('listen')}</span>
    </button>
  );
}
