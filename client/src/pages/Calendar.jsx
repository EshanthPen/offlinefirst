import { useEffect, useMemo, useState } from 'react';
import { getAllLessons, getAllScores } from '../db';
import FileGlyph from '../components/FileGlyph';
import EmptyState from '../components/EmptyState';
import { buildEvents } from '../data/lmsData';

export default function CalendarPage() {
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    (async () => {
      setLessons(await getAllLessons());
      setScores(await getAllScores());
    })();
  }, []);

  const events = useMemo(() => buildEvents(lessons, scores), [lessons, scores]);

  return (
    <div className="lms-page">
      <h1 className="lms-page-title">Calendar</h1>
      <p className="lms-page-sub">Upcoming quizzes from all your courses.</p>
      <div className="lms-card">
        {events.length === 0 ? (
          <div style={{ padding: 32 }}>
            <EmptyState title="Nothing scheduled" sub="Quizzes from your courses will appear here." />
          </div>
        ) : events.map((day, i) => (
          <div key={i} className="lms-cal-day">
            <div className="lms-cal-day-label">{day.date}</div>
            {day.items.map((it, j) => (
              <div key={j} className="lms-cal-event">
                <FileGlyph type="quiz" size={20} />
                <div>
                  <div style={{ fontWeight: 500 }}>{it.label}</div>
                  {it.sub && <div className="lms-list-row-muted">{it.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
