import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLessons, getAllScores } from '../db';
import Icon from '../components/Icon';
import FileGlyph from '../components/FileGlyph';
import EmptyState from '../components/EmptyState';
import { buildTodo } from '../data/lmsData';

export default function ToDoPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    (async () => {
      setLessons(await getAllLessons());
      setScores(await getAllScores());
    })();
  }, []);

  const todo = useMemo(() => buildTodo(lessons, scores), [lessons, scores]);
  const all = [
    ...todo.overdue.map(x => ({ ...x, status: 'overdue' })),
    ...todo.upcoming.map(x => ({ ...x, status: 'upcoming' }))
  ];

  return (
    <div className="lms-page">
      <h1 className="lms-page-title">To-do</h1>
      <p className="lms-page-sub">Every quiz assigned to you.</p>
      {all.length === 0 ? (
        <EmptyState title="No quizzes assigned" sub="Quizzes appear here when a teacher publishes one." />
      ) : (
        <div className="lms-card">
          <div className="lms-list-head">
            <span style={{ flex: 1 }}>Quiz</span>
            <span style={{ width: 160 }}>Course</span>
            <span style={{ width: 160 }}>Due</span>
            <span style={{ width: 32 }} />
          </div>
          {all.map(a => (
            <button
              key={a.id}
              type="button"
              className="lms-list-row"
              onClick={() => navigate(`/quiz/${a.lesson_id}`)}
            >
              <span className="lms-list-row-main">
                <FileGlyph type="quiz" size={20} />
                <span>{a.title}</span>
              </span>
              <span style={{ width: 160, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="lms-course-pip small" style={{ background: a.course_color }}>{a.course[0]}</span>
                <span className="lms-list-row-muted">{a.course}</span>
              </span>
              <span style={{ width: 160 }} className={a.status === 'overdue' ? 'lms-bad' : 'lms-list-row-muted'}>
                {a.status === 'overdue' ? a.due : `Due ${a.due}`}
              </span>
              <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
