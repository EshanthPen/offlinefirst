import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Icon, { BrandMark } from './Icon';
import TeacherPinModal from './TeacherPinModal';
import { useT } from '../i18n';
import { saveProfile } from '../db';
import { clearToken } from '../auth';

const STUDENT_NAV = [
  { to: '/',         icon: 'home',  labelKey: 'home' },
  { to: '/courses',  icon: 'book',  labelKey: 'courses' },
  { to: '/progress', icon: 'chart', labelKey: 'progress' }
];

const TEACHER_NAV = [
  { to: '/',        icon: 'home',    labelKey: 'dashboard' },
  { to: '/content', icon: 'library', labelKey: 'content' },
  { to: '/results', icon: 'chart',   labelKey: 'results' }
];

function pathIsActive(currentPath, target) {
  if (target === '/') return currentPath === '/';
  return currentPath === target || currentPath.startsWith(target + '/');
}

export default function Sidebar({ profile, setProfile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useT();
  const [pinOpen, setPinOpen] = useState(false);
  const isTeacher = profile?.role === 'teacher';
  const links = isTeacher ? TEACHER_NAV : STUDENT_NAV;

  const lessonish = location.pathname.startsWith('/lesson') || location.pathname.startsWith('/quiz');

  const flipToTeacher = async () => {
    await saveProfile({ role: 'teacher' });
    setProfile(p => ({ ...p, role: 'teacher' }));
    navigate('/');
  };

  const flipToStudent = async () => {
    clearToken();
    await saveProfile({ role: 'student' });
    setProfile(p => ({ ...p, role: 'student' }));
    navigate('/');
  };

  const onRoleSwitchClick = () => {
    if (isTeacher) {
      flipToStudent();
    } else {
      setPinOpen(true);
    }
  };

  const name = profile?.studentName || 'Student';
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'S';

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo">
          <BrandMark size={26} />
          <span className="wordmark">offlinefirst</span>
        </Link>

        <nav className="nav-group">
          {links.map(link => {
            let active = pathIsActive(location.pathname, link.to);
            if (link.to === '/courses' && lessonish && !isTeacher) active = true;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <Icon name={link.icon} size={17} />
                <span>{t(link.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {!isTeacher && (
          <>
            <div className="nav-divider" />
            <div className="nav-group">
              <div className="nav-group-title">{t('saved')}</div>
              <button className="nav-item" type="button">
                <Icon name="bookmark" size={17} />
                <span>{t('bookmarks')}</span>
              </button>
              <button className="nav-item" type="button">
                <Icon name="download" size={17} />
                <span>{t('downloads')}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>3</span>
              </button>
            </div>
          </>
        )}

        <div className="nav-spacer" />
        <div className="nav-divider" />

        <button className="role-switch" onClick={onRoleSwitchClick} title="Switch role" type="button">
          <Icon name="users" size={15} />
          <span>{isTeacher ? t('teacherView') : t('studentView')}</span>
          <span className="role-switch-flip">{isTeacher ? t('signOut') : t('switch')}</span>
        </button>

        <Link to="/settings" className="nav-item">
          <Icon name="settings" size={17} />
          <span>{t('settings')}</span>
        </Link>

        <div className="userpill">
          <div className="avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="name">{name}</div>
            <div className="role-meta">{isTeacher ? 'Teacher' : 'Grade 5'}</div>
          </div>
        </div>
      </aside>

      {pinOpen && (
        <TeacherPinModal
          onSuccess={() => { setPinOpen(false); flipToTeacher(); }}
          onClose={() => setPinOpen(false)}
        />
      )}
    </>
  );
}
