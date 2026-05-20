import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import Avatar from './Avatar';
import { metaForLesson } from '../data/lmsData';

export default function CourseCard({ course, completion }) {
  const navigate = useNavigate();
  const meta = metaForLesson(course);
  const pct = completion ? Math.round((completion.score / completion.total) * 100) : null;
  const open = () => navigate(`/course/${course.id}`);

  return (
    <article
      className="lms-course-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
    >
      <div className="lms-course-card-head" style={{ background: meta.bannerColor || '#1967D2' }}>
        <div className="lms-course-card-title">{course.title || course.subject}</div>
        <div className="lms-course-card-sub">{meta.section || course.grade_level}</div>
        <div className="lms-course-card-instructor">{meta.instructor}</div>
        <Avatar
          name={meta.instructor}
          initial={meta.instructorInitial}
          color="white"
          size={42}
          style={{ position: 'absolute', right: 16, bottom: -21, color: meta.bannerColor }}
        />
      </div>
      <div className="lms-course-card-body">
        <div className="lms-course-card-due">
          {pct != null ? (
            <span><Icon name="check-circle" size={14} color="var(--lms-ok)" /> Quiz complete · {pct}%</span>
          ) : (
            <span><Icon name="clock" size={14} /> Quiz available</span>
          )}
        </div>
      </div>
      <div className="lms-course-card-actions">
        <button
          type="button"
          className="lms-iconbtn small"
          title="Open class"
          onClick={(e) => { e.stopPropagation(); open(); }}
        >
          <Icon name="enrolled" size={18} />
        </button>
      </div>
    </article>
  );
}
