import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import FileGlyph from './FileGlyph';

export function AssistantCard() {
  return (
    <div className="lms-rail-card">
      <h3 className="lms-rail-card-title" style={{ marginBottom: 8 }}>Study buddy</h3>
      <button type="button" className="lms-pill-btn outline" style={{ width: '100%', justifyContent: 'center' }}>
        <Icon name="comment" size={14} /> Open chat history
      </button>
    </div>
  );
}

export function ToDoCard({ todo, onOpenAll }) {
  const navigate = useNavigate();
  const overdueCount = todo.overdue.length;
  const upcomingCount = todo.upcoming.length;

  return (
    <div className="lms-rail-card">
      <div className="lms-rail-card-head">
        <h3 className="lms-rail-card-title">To-do</h3>
        <button type="button" className="lms-link" onClick={onOpenAll}>View all</button>
      </div>
      {overdueCount > 0 && (
        <div className="lms-rail-section">
          <div className="lms-rail-section-label">OVERDUE</div>
          {todo.overdue.map(item => (
            <button
              key={item.id}
              type="button"
              className="lms-rail-item"
              onClick={() => navigate(`/quiz/${item.lesson_id}`)}
            >
              <FileGlyph type="quiz" size={22} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div className="lms-rail-item-title">{item.title}</div>
                <div className="lms-rail-item-sub" style={{ color: 'var(--lms-bad)' }}>
                  {item.due} · {item.course}
                </div>
              </div>
              <Icon name="alert-circle" size={18} color="var(--lms-bad)" />
            </button>
          ))}
        </div>
      )}
      {upcomingCount > 0 && (
        <div className="lms-rail-section">
          <div className="lms-rail-section-label">UPCOMING</div>
          {todo.upcoming.map(item => (
            <button
              key={item.id}
              type="button"
              className="lms-rail-item"
              onClick={() => navigate(`/quiz/${item.lesson_id}`)}
            >
              <FileGlyph type="quiz" size={22} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div className="lms-rail-item-title">{item.title}</div>
                <div className="lms-rail-item-sub">Due {item.due} · {item.course}</div>
              </div>
              <Icon name="clock" size={16} color="var(--lms-ink-faint)" />
            </button>
          ))}
        </div>
      )}
      {overdueCount === 0 && upcomingCount === 0 && (
        <div className="lms-rail-empty">No work due. Nice.</div>
      )}
    </div>
  );
}

export function UpcomingCard({ events }) {
  const navigate = useNavigate();
  return (
    <div className="lms-rail-card">
      <div className="lms-rail-card-head">
        <h3 className="lms-rail-card-title">Upcoming events</h3>
        <button type="button" className="lms-link" onClick={() => navigate('/calendar')}>Calendar</button>
      </div>
      {events.length === 0 && <div className="lms-rail-empty">Nothing scheduled.</div>}
      {events.map((day, i) => {
        const dayNum = day.date.match(/\d+/)?.[0] || '·';
        return (
          <div key={i} className="lms-event-day">
            <div className="lms-event-day-label">{day.date}</div>
            {day.items.map((it, j) => (
              <div key={j} className="lms-event-item">
                <span className={`lms-event-pip ${it.kind || 'event'}`}>
                  <span className="lms-event-pip-day">{dayNum}</span>
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="lms-event-title">{it.label}</div>
                  {it.sub && <div className="lms-event-sub">{it.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function RecentlyCompletedCard({ items, expanded, onExpand }) {
  return (
    <div className="lms-rail-card">
      <h3 className="lms-rail-card-title" style={{ marginBottom: 8 }}>Recently completed</h3>
      {!expanded && (
        <>
          <div className="lms-rail-empty" style={{ marginBottom: 8 }}>Collapsed by default.</div>
          <button type="button" className="lms-text-btn" onClick={onExpand}>
            <Icon name="refresh" size={14} /> Load recently completed
          </button>
        </>
      )}
      {expanded && items.map((it, i) => (
        <div key={i} className="lms-rail-item static">
          <Icon name="check-circle" size={18} color="var(--lms-ok)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lms-rail-item-title">{it.title}</div>
            <div className="lms-rail-item-sub">{it.course} · {it.when}{it.score ? ` · ${it.score}` : ''}</div>
          </div>
        </div>
      ))}
      {expanded && items.length === 0 && (
        <div className="lms-rail-empty">No completed quizzes yet.</div>
      )}
    </div>
  );
}
