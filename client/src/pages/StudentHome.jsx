import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tabs from '../components/Tabs';
import ActivityPost from '../components/ActivityPost';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import FileGlyph from '../components/FileGlyph';
import CourseCard from '../components/CourseCard';
import { ToDoCard, UpcomingCard, RecentlyCompletedCard } from '../components/RightRail';
import { buildPosts, buildTodo, buildEvents, buildRecent } from '../data/lmsData';
import { useAppData } from '../data/AppData';

function AssignmentList({ todo }) {
  const navigate = useNavigate();
  const all = [
    ...todo.overdue.map(x => ({ ...x, status: 'overdue' })),
    ...todo.upcoming.map(x => ({ ...x, status: 'upcoming' }))
  ];
  if (all.length === 0) {
    return <EmptyState title="Nothing assigned" sub="Quizzes show up after a teacher posts one." />;
  }
  return (
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
          <span
            style={{ width: 160 }}
            className={a.status === 'overdue' ? 'lms-bad' : 'lms-list-row-muted'}
          >
            {a.status === 'overdue' ? a.due : `Due ${a.due}`}
          </span>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
        </button>
      ))}
    </div>
  );
}

function InlineEnrolled({ lessons, scores }) {
  const bestByLesson = scores.reduce((acc, s) => {
    if (!acc[s.lesson_id] || s.score / s.total > acc[s.lesson_id].score / acc[s.lesson_id].total) acc[s.lesson_id] = s;
    return acc;
  }, {});
  if (lessons.length === 0) {
    return <EmptyState title="No classes" sub="Lessons show up after a teacher publishes them." />;
  }
  return (
    <div className="lms-course-grid">
      {lessons.map(l => (
        <CourseCard key={l.id} course={l} completion={bestByLesson[l.id]} />
      ))}
    </div>
  );
}

export default function StudentHome() {
  const [tab, setTab] = useState('activity');
  const { lessons, scores } = useAppData();

  const posts = useMemo(() => buildPosts(lessons), [lessons]);
  const todo = useMemo(() => buildTodo(lessons, scores), [lessons, scores]);
  const events = useMemo(() => buildEvents(lessons, scores), [lessons, scores]);
  const recent = useMemo(() => buildRecent(lessons, scores), [lessons, scores]);

  return (
    <div className="lms-page lms-home">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'activity',  label: 'Recent activity' },
          { id: 'dashboard', label: 'Course dashboard' },
          { id: 'assigned',  label: 'Assignments' }
        ]}
      />

      <div className="lms-two-col">
        <div className="lms-main-col">
          {tab === 'activity' && (
            <>
              <div className="lms-feed-controls">
                <span className="lms-feed-controls-label">{posts.length} recent updates</span>
                <span style={{ flex: 1 }} />
              </div>
              <div className="lms-feed">
                {posts.length === 0 ? (
                  <EmptyState title="Nothing yet" sub="Posts show up here when a teacher publishes work." />
                ) : posts.map(p => <ActivityPost key={p.id} post={p} />)}
              </div>
            </>
          )}
          {tab === 'dashboard' && <InlineEnrolled lessons={lessons} scores={scores} />}
          {tab === 'assigned' && <AssignmentList todo={todo} />}
        </div>
        <aside className="lms-side-col">
          <ToDoCard todo={todo} onOpenAll={() => setTab('assigned')} />
          <UpcomingCard events={events} />
          <RecentlyCompletedCard items={recent} />
        </aside>
      </div>
    </div>
  );
}
