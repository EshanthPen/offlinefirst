import CourseCard from '../components/CourseCard';
import EmptyState from '../components/EmptyState';
import { useAppData } from '../data/AppData';

export default function Courses() {
  const { lessons, scores } = useAppData();

  const bestByLesson = scores.reduce((acc, s) => {
    if (!acc[s.lesson_id] || s.score / s.total > acc[s.lesson_id].score / acc[s.lesson_id].total) acc[s.lesson_id] = s;
    return acc;
  }, {});

  return (
    <div className="lms-page">
      <h1 className="lms-page-title">Enrolled</h1>
      <p className="lms-page-sub">Every class on this device.</p>
      {lessons.length === 0 ? (
        <EmptyState title="No classes yet" sub="Lessons sync to this device when a teacher publishes them." />
      ) : (
        <div className="lms-course-grid">
          {lessons.map(l => (
            <CourseCard key={l.id} course={l} completion={bestByLesson[l.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
