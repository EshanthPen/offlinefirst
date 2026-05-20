import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { metaForLesson } from '../data/lmsData';

const STUDENT_NAV = [
  { to: '/',         icon: 'home',     label: 'Home' },
  { to: '/calendar', icon: 'calendar', label: 'Calendar' },
  { to: '/todo',     icon: 'todo',     label: 'To-do' },
  { to: '/progress', icon: 'grades',   label: 'Grades' }
];

const TEACHER_NAV = [
  { to: '/',         icon: 'home',     label: 'Dashboard' },
  { to: '/content',  icon: 'book',     label: 'Content' },
  { to: '/results',  icon: 'grades',   label: 'Results' },
  { to: '/calendar', icon: 'calendar', label: 'Calendar' }
];

export default function Sidebar({ collapsed, role, courses = [], todoBadge = 0 }) {
  const location = useLocation();
  const isTeacher = role === 'teacher';
  const primary = isTeacher ? TEACHER_NAV : STUDENT_NAV;

  const activeCourseId = (() => {
    const m = location.pathname.match(/^\/(?:course|lesson|quiz)\/(.+)$/);
    return m ? m[1] : null;
  })();

  return (
    <aside className={`lms-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="lms-sidebar-scroll">
        <nav className="lms-nav-group">
          {primary.map(n => {
            const isHome = n.to === '/';
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={isHome}
                className={({ isActive }) => `lms-nav-item${isActive ? ' active' : ''}`}
                title={collapsed ? n.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={isActive && n.icon === 'home' ? 'home-fill' : n.icon} size={20} />
                    {!collapsed && <span className="lms-nav-label">{n.label}</span>}
                    {!collapsed && n.to === '/todo' && todoBadge > 0 && (
                      <span className="lms-nav-badge">{todoBadge}</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="lms-nav-divider" />

        {!collapsed && (
          <div className="lms-nav-section">
            <Icon name="enrolled" size={18} />
            <span className="lms-nav-label">{isTeacher ? 'Teaching' : 'Enrolled'}</span>
          </div>
        )}

        <div className="lms-course-list">
          {courses.map(c => {
            const meta = metaForLesson(c);
            const active = activeCourseId === c.id;
            return (
              <NavLink
                key={c.id}
                to={`/course/${c.id}`}
                className={`lms-course-item${active ? ' active' : ''}`}
                title={collapsed ? c.subject : undefined}
              >
                <span className="lms-course-pip" style={{ background: meta.letterColor || '#5F6368' }}>
                  {c.subject[0]}
                </span>
                {!collapsed && (
                  <div className="lms-course-meta">
                    <div className="lms-course-name">{c.subject}</div>
                    <div className="lms-course-sub">{meta.section || c.grade_level}</div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="lms-nav-divider" />

        <nav className="lms-nav-group">
          <NavLink
            to="/archived"
            className={({ isActive }) => `lms-nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? 'Archived' : undefined}
          >
            <Icon name="archive" size={20} />
            {!collapsed && <span className="lms-nav-label">Archived</span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `lms-nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Icon name="settings" size={20} />
            {!collapsed && <span className="lms-nav-label">Settings</span>}
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
