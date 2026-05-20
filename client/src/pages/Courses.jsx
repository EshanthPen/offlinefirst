import { useEffect, useState } from 'react';
import { getAllLessons, getAllScores } from '../db';
import CourseCard from '../components/CourseCard';
import EmptyState from '../components/EmptyState';

export default function Courses() {
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    (async () => {
      setLessons(await getAllLessons());
      setScores(await getAllScores());
    })();
  }, []);

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
