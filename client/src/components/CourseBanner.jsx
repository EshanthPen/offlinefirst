import Icon from './Icon';
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
        <div className="lms-banner-eyebrow">{course.subject} · {course.grade_level}</div>
        <h1 className="lms-banner-title">{course.title || course.subject}</h1>
        {onPrimary && (
          <button type="button" className="lms-pill-btn light" onClick={onPrimary} style={{ marginTop: 16 }}>
            <Icon name="book" size={16} /> {primaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
