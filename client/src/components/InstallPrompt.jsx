import { useEffect, useState } from 'react';
import Icon from './Icon';
import { useT } from '../i18n';

const DISMISS_KEY = 'offlinefirst_install_dismissed';

export default function InstallPrompt() {
  const { t } = useT();
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
    if (choice?.outcome === 'accepted') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="install-dock">
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'var(--brand-soft)', color: 'var(--brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon name="download" size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t('installAppTitle')}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{t('installAppSub')}</div>
      </div>
      <button className="btn btn-primary" onClick={install} style={{ padding: '8px 14px', fontSize: 13 }} type="button">
        {t('install')}
      </button>
      <button className="iconbtn" onClick={dismiss} title={t('notNow')} type="button">
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
