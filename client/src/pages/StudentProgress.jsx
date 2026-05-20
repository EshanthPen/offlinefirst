import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLessons, getAllScores } from '../db';
import Icon from '../components/Icon';
import { metaForLesson } from '../data/lmsData';

function Stat({ label, value }) {
  return (
    <div className="lms-card lms-stat">
      <div className="lms-stat-value">{value}</div>
      <div className="lms-stat-label">{label}</div>
    </div>
  );
}

export default function StudentProgress() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    (async () => {
      setLessons(await getAllLessons());
      setScores(await getAllScores());
    })();
  }, []);

  const bestByLesson = useMemo(() => scores.reduce((acc, s) => {
    const pct = (s.score / s.total) * 100;
    if (!acc[s.lesson_id] || pct > acc[s.lesson_id].pct) acc[s.lesson_id] = { ...s, pct };
    return acc;
  }, {}), [scores]);

  const total = lessons.length;
  const done = new Set(scores.map(s => s.lesson_id)).size;
  const avg = scores.length
    ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length)
    : 0;
  const perfect = scores.filter(s => s.score === s.total).length;

  return (
    <div className="lms-page">
      <h1 className="lms-page-title">Grades</h1>
      <p className="lms-page-sub">A snapshot of your recent work. Everything is stored on this device.</p>

      <div className="lms-stat-grid">
        <Stat label="Completion" value={`${total ? Math.round((done / total) * 100) : 0}%`} />
        <Stat label="Average score" value={`${avg}%`} />
        <Stat label="Lessons done" value={`${done}/${total}`} />
        <Stat label="Perfect quizzes" value={perfect} />
      </div>

      <div className="lms-card">
        <div className="lms-list-head">
          <span style={{ flex: 1 }}>Course</span>
          <span style={{ width: 220 }}>Latest activity</span>
          <span style={{ width: 100, textAlign: 'right' }}>Best score</span>
          <span style={{ width: 32 }} />
        </div>
        {lessons.map(l => {
          const best = bestByLesson[l.id];
          const pct = best ? Math.round(best.pct) : 0;
          const meta = metaForLesson(l);
          return (
            <button
              key={l.id}
              type="button"
              className="lms-list-row"
              onClick={() => navigate(`/course/${l.id}`)}
            >
              <span className="lms-list-row-main">
                <span className="lms-course-pip" style={{ background: meta.letterColor }}>{l.subject[0]}</span>
                <span>
                  <span style={{ display: 'block', fontWeight: 500 }}>{l.title}</span>
                  <span className="lms-list-row-muted">{l.subject} · {meta.section || l.grade_level}</span>
                </span>
              </span>
              <span style={{ width: 220 }} className="lms-list-row-muted">
                {best ? new Date(best.completed_at).toLocaleString() : 'No attempts yet'}
              </span>
              <span style={{ width: 100, textAlign: 'right' }}>
                {best ? (
                  <strong style={{ color: pct >= 80 ? 'var(--lms-ok)' : 'var(--lms-ink)' }}>
                    {best.score}/{best.total}
                  </strong>
                ) : '-'}
              </span>
              <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
            </button>
          );
        })}
      </div>

      {scores.length > 0 && (
        <>
          <h2 className="lms-section-title" style={{ marginTop: 32, marginBottom: 12 }}>Best scores</h2>
          <div className="lms-card lms-bar-card">
            {lessons.map(l => {
              const best = bestByLesson[l.id];
              const pct = best ? Math.round(best.pct) : 0;
              const meta = metaForLesson(l);
              return (
                <div key={l.id} className="lms-bar-row">
                  <div className="lms-bar-label">
                    <span className="lms-course-pip small" style={{ background: meta.letterColor }}>{l.subject[0]}</span>
                    <span>{l.title}</span>
                  </div>
                  <div className="lms-bar-track">
                    <div className="lms-bar-fill" style={{ width: `${pct}%`, background: meta.letterColor }} />
                  </div>
                  <div className="lms-bar-value">{pct ? `${pct}%` : '-'}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
