import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useT, LANGUAGES } from '../i18n';
import { useTheme } from '../theme';
import { getSyncState, onSyncStateChange } from '../sync';

function syncMeta(status, t) {
  if (status === 'syncing') return { label: t('syncing'), cls: 'info', icon: 'refresh' };
  if (status === 'local')   return { label: t('localMesh'), cls: 'warn',   icon: 'wifi' };
  if (status === 'offline') return { label: t('offline'),   cls: 'danger', icon: 'wifi-off' };
  return { label: t('allCaughtUp'), cls: '', icon: 'wifi' };
}

function CrumbsForRoute({ path, lesson, isTeacher, t }) {
  if (path.startsWith('/lesson/') || path.startsWith('/quiz/')) {
    return (
      <div className="crumbs">
        <span>{t('courses')}</span>
        <span className="sep">/</span>
        <span className="current">{lesson?.title || t('lessonCol')}</span>
      </div>
    );
  }
  let current = isTeacher ? t('dashboard') : t('home');
  if (path.startsWith('/courses'))   current = t('courses');
  if (path.startsWith('/progress'))  current = t('progress');
  if (path.startsWith('/content'))   current = t('content');
  if (path.startsWith('/results'))   current = t('results');
  return <div className="crumbs"><span className="current">{current}</span></div>;
}

function LangSwitcher() {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="iconbtn"
        onClick={() => setOpen(o => !o)}
        title={t('language')}
        type="button"
        style={{ width: 'auto', padding: '0 10px', gap: 6 }}
      >
        <Icon name="globe" size={15} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{current.label}</span>
      </button>
      {open && (
        <div className="popover" style={{ right: 0, top: 42, minWidth: 170 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`popover-item${l.code === lang ? ' active' : ''}`}
              onClick={() => { setLang(l.code); setOpen(false); }}
              type="button"
            >
              <span style={{ fontWeight: 600, color: 'var(--ink-faint)', width: 22 }}>{l.label}</span>
              <span>{l.name}</span>
              {l.code === lang && <Icon name="check" size={14} color="var(--brand)" style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Topbar({
  isTeacher,
  lessonTitle,
  a11y, onToggleA11y,
  onOpenPair,
  onSyncChipClick,
  newContent, onDismissNewContent
}) {
  const { t } = useT();
  const { theme, setTheme } = useTheme();
  const [sync, setSync] = useState(getSyncState());
  const location = useLocation();

  useEffect(() => onSyncStateChange(setSync), []);

  const s = syncMeta(sync.status, t);

  return (
    <header className="topbar">
      <CrumbsForRoute path={location.pathname} lesson={{ title: lessonTitle }} isTeacher={isTeacher} t={t} />

      <div className="search">
        <Icon name="search" size={15} />
        <input placeholder={t('searchPlaceholder')} />
        <span className="search-kbd">⌘K</span>
      </div>

      {newContent > 0 && (
        <button className="new-content-pill" onClick={onDismissNewContent} title={t('dismiss')} type="button">
          <span className="new-content-dot" />
          <span><strong>+{newContent}</strong> {newContent === 1 ? t('newContentTitleSingular') : t('newContentTitlePlural')}</span>
        </button>
      )}

      <button className={`sync-chip ${s.cls}`} onClick={onSyncChipClick} title={s.label} type="button">
        <span className="dot" />
        {s.label}
      </button>

      <button className="iconbtn" onClick={onOpenPair} title={t('pairDevice')} type="button">
        <Icon name="qr" size={17} />
      </button>

      <button
        className={`iconbtn${a11y ? ' is-active' : ''}`}
        onClick={onToggleA11y}
        title={a11y ? t('accessibilityNormal') : t('accessibilityTitle')}
        type="button"
      >
        <Icon name="accessibility" size={17} />
      </button>

      <LangSwitcher />

      <button className="iconbtn" title={t('notifications')} type="button">
        <Icon name="bell" size={17} />
      </button>

      <button
        className="iconbtn"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={t('toggleTheme')}
        type="button"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
      </button>
    </header>
  );
}
