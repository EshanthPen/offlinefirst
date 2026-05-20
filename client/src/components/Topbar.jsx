import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon, { BrandMark } from './Icon';
import Avatar from './Avatar';
import SyncBadge from './SyncBadge';
import { useT } from '../i18n';
import { useTheme } from '../theme';
import { getSyncState, onSyncStateChange } from '../sync';
import { getLessonById } from '../db';

function buildCrumbs(path, lesson, isTeacher) {
  const crumbs = [{ label: 'OfflineFirst', to: '/' }];
  const m = path.match(/^\/(?:course|lesson|quiz)\/(.+)$/);
  if (path === '/') {
    crumbs.push({ label: isTeacher ? 'Dashboard' : 'Home', current: true });
  } else if (path === '/courses')   crumbs.push({ label: 'Enrolled',  current: true });
  else if (path === '/calendar')   crumbs.push({ label: 'Calendar',  current: true });
  else if (path === '/todo')       crumbs.push({ label: 'To-do',     current: true });
  else if (path === '/progress')   crumbs.push({ label: 'Grades',    current: true });
  else if (path === '/content')    crumbs.push({ label: 'Content',   current: true });
  else if (path === '/results')    crumbs.push({ label: 'Results',   current: true });
  else if (path === '/settings')   crumbs.push({ label: 'Settings',  current: true });
  else if (path === '/archived')   crumbs.push({ label: 'Archived',  current: true });

  if (m && lesson) {
    if (path.startsWith('/lesson/') || path.startsWith('/quiz/')) {
      crumbs.push({ label: lesson.subject, to: `/course/${lesson.id}` });
      crumbs.push({ label: lesson.title, current: !path.startsWith('/quiz/') });
      if (path.startsWith('/quiz/')) crumbs.push({ label: 'Quiz', current: true });
    } else {
      crumbs.push({ label: lesson.subject + ' · ' + (lesson.grade_level || ''), current: true });
    }
  }
  return crumbs;
}

export default function Topbar({ profile, onToggleNav, onOpenLang, onOpenPair }) {
  const { t, lang } = useT();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sync, setSync] = useState(getSyncState());
  const [lessonForCrumb, setLessonForCrumb] = useState(null);

  useEffect(() => onSyncStateChange(setSync), []);

  useEffect(() => {
    const m = location.pathname.match(/^\/(?:course|lesson|quiz)\/(.+)$/);
    if (!m) { setLessonForCrumb(null); return; }
    let cancelled = false;
    (async () => {
      const l = await getLessonById(m[1]);
      if (!cancelled) setLessonForCrumb(l);
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  const isTeacher = profile?.role === 'teacher';
  const crumbs = buildCrumbs(location.pathname, lessonForCrumb, isTeacher);

  return (
    <header className="lms-topbar">
      <button className="lms-iconbtn" type="button" onClick={onToggleNav} title="Menu">
        <Icon name="menu" size={20} />
      </button>
      <Link to="/" className="lms-topbar-brand">
        <BrandMark size={22} />
        <span className="lms-topbar-wordmark">OfflineFirst</span>
      </Link>
      <div className="lms-crumbs">
        {crumbs.slice(1).map((c, i) => (
          <span key={i} className="lms-crumb">
            <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
            {c.to && !c.current ? (
              <button type="button" className="lms-crumb-link" onClick={() => navigate(c.to)}>{c.label}</button>
            ) : (
              <button type="button" className="lms-crumb-link current">{c.label}</button>
            )}
          </span>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <SyncBadge status={sync.status} />
      <button className="lms-iconbtn" type="button" onClick={onOpenPair} title={t('pairDevice')}>
        <Icon name="qr" size={18} />
      </button>
      <button className="lms-iconbtn lms-lang-btn" type="button" onClick={onOpenLang} title="Language">
        <Icon name="globe" size={18} />
        <span className="lms-lang-code">{(lang || 'en').toUpperCase().slice(0, 2)}</span>
      </button>
      <button
        className="lms-iconbtn"
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title="Theme"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>
      <button className="lms-avatar-btn" type="button" onClick={() => navigate('/settings')} title={profile?.studentName}>
        <Avatar name={profile?.studentName} size={32} />
      </button>
    </header>
  );
}
