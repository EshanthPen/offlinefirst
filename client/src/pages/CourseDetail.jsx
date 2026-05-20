import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLessonById, getAllScores, getQuizByLessonId } from '../db';
import Tabs from '../components/Tabs';
import CourseBanner from '../components/CourseBanner';
import ActivityPost from '../components/ActivityPost';
import MaterialRow from '../components/MaterialRow';
import FileGlyph from '../components/FileGlyph';
import EmptyState from '../components/EmptyState';
import { buildPosts, buildTodo } from '../data/lmsData';

function Classwork({ course }) {
  const items = [
    {
      type: 'lesson',
      name: course.title,
      sub: `Lesson · ${course.content?.sections?.length || 0} sections`,
      lesson_id: course.id
    },
    {
      type: 'quiz',
      name: `${course.title} — Quiz`,
      sub: `${course.quiz?.questions?.length || 0} questions`,
      lesson_id: course.id
    }
  ];
  return (
    <div className="lms-classwork">
      <div className="lms-classwork-bar">
        <h2 className="lms-section-title">{course.title} · classwork</h2>
        <div style={{ flex: 1 }} />
        <span className="lms-chip">{items.length} items</span>
      </div>
      <div style={{ padding: '6px 0 12px' }}>
        {items.map((item, i) => <MaterialRow key={i} item={item} />)}
      </div>
    </div>
  );
}

function CourseGrades({ course, scores }) {
  const courseScores = scores.filter(s => s.lesson_id === course.id);
  const best = courseScores.reduce((b, s) => (!b || s.score / s.total > b.score / b.total ? s : b), null);
  return (
    <div className="lms-card" style={{ marginTop: 24 }}>
      <div className="lms-card-head">
        <h2 className="lms-section-title">{course.title} · Grades</h2>
      </div>
      {courseScores.length === 0 ? (
        <div style={{ padding: 24 }}>
          <EmptyState title="No grades yet" sub="When you complete a quiz, your score lands here." />
        </div>
      ) : (
        <table className="lms-table">
          <thead><tr><th>Item</th><th>Date</th><th style={{ textAlign: 'right' }}>Score</th></tr></thead>
          <tbody>
            {courseScores.map((s, i) => {
              const pct = Math.round((s.score / s.total) * 100);
              return (
                <tr key={s.id || i}>
                  <td><FileGlyph type="quiz" size={18} /> Quiz attempt</td>
                  <td className="muted">{new Date(s.completed_at).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <strong style={{ color: pct >= 80 ? 'var(--lms-ok)' : 'var(--lms-ink)' }}>
                      {s.score}/{s.total}
                    </strong> · {pct}%
                  </td>
                </tr>
              );
            })}
            {best && (
              <tr className="lms-table-foot">
                <td colSpan={2}><strong>Best score</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{best.score}/{best.total}</strong></td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stream');
  const [course, setCourse] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    (async () => {
      const [l, q, s] = await Promise.all([getLessonById(id), getQuizByLessonId(id), getAllScores()]);
      setCourse(l ? (q ? { ...l, quiz: q } : l) : null);
      setScores(s);
    })();
  }, [id]);

  const courseTodo = useMemo(
    () => course ? buildTodo([course], scores) : { overdue: [], upcoming: [] },
    [course, scores]
  );
  const coursePosts = useMemo(() => course ? buildPosts([course]) : [], [course]);

  if (!course) return <div style={{ padding: 24, color: 'var(--lms-ink-muted)' }}>Loading…</div>;

  return (
    <div className="lms-page lms-course-detail">
      <CourseBanner course={course} primaryLabel="Open lesson" onPrimary={() => navigate(`/lesson/${course.id}`)} />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'stream',    label: 'Stream' },
          { id: 'classwork', label: 'Classwork' },
          { id: 'grades',    label: 'Grades' }
        ]}
      />

      {tab === 'stream' && (
        <div className="lms-two-col" style={{ marginTop: 24 }}>
          <div className="lms-main-col">
            {coursePosts.length === 0 ? (
              <EmptyState title="Nothing in the stream yet" sub="When your teacher posts a lesson or quiz, it shows up here." />
            ) : coursePosts.map(p => <ActivityPost key={p.id} post={p} />)}
          </div>
          <aside className="lms-side-col">
            <div className="lms-rail-card">
              <h3 className="lms-rail-card-title" style={{ marginBottom: 8 }}>Upcoming</h3>
              {courseTodo.upcoming.length === 0 && courseTodo.overdue.length === 0 ? (
                <div className="lms-rail-empty">No work due soon.</div>
              ) : (
                <>
                  {[...courseTodo.overdue, ...courseTodo.upcoming].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className="lms-rail-item"
                      onClick={() => navigate(`/quiz/${course.id}`)}
                    >
                      <FileGlyph type="quiz" size={20} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="lms-rail-item-title">{t.title}</div>
                        <div className="lms-rail-item-sub">Due {t.due}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
              <button type="button" className="lms-link" style={{ marginTop: 10 }} onClick={() => setTab('classwork')}>
                View all
              </button>
            </div>
          </aside>
        </div>
      )}

      {tab === 'classwork' && <Classwork course={course} />}
      {tab === 'grades'    && <CourseGrades course={course} scores={scores} />}
    </div>
  );
}
