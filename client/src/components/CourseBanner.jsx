import Icon from './Icon';
import Avatar from './Avatar';
import { metaForLesson } from '../data/lmsData';

export default function CourseBanner({ course, onPrimary, primaryLabel = 'Open lesson' }) {
  const meta = metaForLesson(course);
  return (
    <div className="lms-banner" style={{ background: meta.bannerColor || '#1967D2' }}>
      <div className="lms-banner-pattern" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="lms-banner-stripe"
            style={{ left: `${10 + i * 16}%`, transform: `translateY(${i % 2 ? 10 : -10}px)` }}
          />
        ))}
      </div>
      <div className="lms-banner-inner">
        <div className="lms-banner-eyebrow">{meta.section || course.grade_level}</div>
        <h1 className="lms-banner-title">{course.title || course.subject}</h1>
        <div className="lms-banner-instructor">
          <Avatar
            name={meta.instructor}
            initial={meta.instructorInitial}
            color="rgba(255,255,255,0.22)"
            size={28}
          />
          <span>{meta.instructor}</span>
        </div>
        {onPrimary && (
          <button type="button" className="lms-pill-btn light" onClick={onPrimary} style={{ marginTop: 16 }}>
            <Icon name="book" size={16} /> {primaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
