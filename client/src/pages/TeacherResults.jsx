import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { metaForLesson } from '../data/lmsData';

function Stat({ label, value }) {
  return (
    <div className="lms-card lms-stat">
      <div className="lms-stat-value">{value}</div>
      <div className="lms-stat-label">{label}</div>
    </div>
  );
}

export default function TeacherResults() {
  const [results, setResults] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const [r, l] = await Promise.all([fetch('/api/scores'), fetch('/api/lessons')]);
        if (r.ok) setResults(await r.json());
        if (l.ok) setLessons(await l.json());
      } catch {}
    })();
    const i = setInterval(async () => {
      const r = await fetch('/api/scores');
      if (r.ok) setResults(await r.json());
    }, 15000);
    return () => clearInterval(i);
  }, []);

  const subjects = ['all', ...new Set(results.map(r => r.subject).filter(Boolean))];
  const filtered = filter === 'all' ? results : results.filter(r => r.subject === filter);

  const avgs = useMemo(() => {
    const m = {};
    filtered.forEach(r => {
      if (!m[r.lesson_id]) {
        m[r.lesson_id] = { lesson: r.lesson_title || r.lesson_id, total: 0, count: 0, subject: r.subject };
      }
      m[r.lesson_id].total += (r.score / r.total) * 100;
      m[r.lesson_id].count++;
    });
    return Object.entries(m).map(([id, x]) => ({
      id,
      lesson: x.lesson,
      subject: x.subject,
      count: x.count,
      avg: Math.round(x.total / x.count)
    }));
  }, [filtered]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('OfflineFirst: Quiz Results', 14, 18);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Filter: ${filter === 'all' ? 'All subjects' : filter}`, 14, 32);
    doc.text(`Total attempts: ${filtered.length}`, 14, 38);
    let y = 50;
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(11);
    ['Student','Lesson','Score','%','Date'].forEach((h, idx) => doc.text(h, [14, 60, 130, 150, 170][idx], y));
    y += 4; doc.line(14, y, 196, y); y += 6;
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(9);
    for (const s of filtered) {
      if (y > 280) { doc.addPage(); y = 20; }
      const pct = Math.round((s.score / s.total) * 100);
      doc.text((s.student_name || 'Anonymous').slice(0, 22), 14, y);
      doc.text((s.lesson_title || s.lesson_id || '').slice(0, 32), 60, y);
      doc.text(`${s.score}/${s.total}`, 130, y);
      doc.text(`${pct}%`, 150, y);
      doc.text(s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '-', 170, y);
      y += 6;
    }
    doc.save(`offlinefirst-results-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="lms-page">
      <div className="lms-page-head-row">
        <div>
          <h1 className="lms-page-title">Quiz results</h1>
          <p className="lms-page-sub">Every attempt across the mesh, in one place.</p>
        </div>
        <button type="button" className="lms-pill-btn outline" onClick={exportPDF} disabled={filtered.length === 0}>
          <Icon name="download" size={14} /> Export PDF
        </button>
      </div>

      <div className="lms-stat-grid">
        <Stat label="Total attempts" value={filtered.length} />
        <Stat
          label="Avg score"
          value={`${
            filtered.length
              ? Math.round(filtered.reduce((a, r) => a + (r.score / r.total) * 100, 0) / filtered.length)
              : 0
          }%`}
        />
        <Stat label="Perfect scores" value={filtered.filter(r => r.score === r.total).length} />
        <Stat label="Students" value={new Set(filtered.map(r => r.student_name).filter(Boolean)).size} />
      </div>

      {avgs.length > 0 && (
        <div className="lms-card lms-bar-card">
          <div className="lms-card-head" style={{ borderBottom: 'none', padding: '4px 4px 16px' }}>
            <h2 className="lms-section-title">Average score by lesson</h2>
          </div>
          {avgs.map(a => {
            const lesson = lessons.find(l => l.id === a.id);
            const meta = lesson ? metaForLesson(lesson) : { letterColor: '#5F6368' };
            return (
              <div key={a.id} className="lms-bar-row">
                <div className="lms-bar-label">
                  <span className="lms-course-pip small" style={{ background: meta.letterColor }}>
                    {a.subject?.[0] || '·'}
                  </span>
                  <span>{a.lesson}</span>
                </div>
                <div className="lms-bar-track">
                  <div className="lms-bar-fill" style={{ width: `${a.avg}%`, background: meta.letterColor }} />
                </div>
                <div className="lms-bar-value">{a.avg}% · {a.count}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="lms-filter-row">
        {subjects.map(s => (
          <button
            key={s}
            type="button"
            className={`lms-filter-pill${filter === s ? ' on' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All subjects' : s}
          </button>
        ))}
      </div>

      <div className="lms-card">
        {filtered.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState title="No attempts yet" sub="As students take quizzes, results land here in real time." />
          </div>
        ) : (
          <table className="lms-table">
            <thead>
              <tr><th>Student</th><th>Lesson</th><th>Score</th><th>Percent</th><th>Submitted</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const pct = Math.round((r.score / r.total) * 100);
                const color = pct >= 80 ? 'var(--lms-ok)' : pct >= 60 ? 'var(--lms-info)' : 'var(--lms-warn)';
                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={r.student_name || 'Anonymous'} size={26} />
                        <span style={{ fontWeight: 500 }}>{r.student_name || 'Anonymous'}</span>
                      </span>
                    </td>
                    <td className="muted">{r.lesson_title || r.lesson_id}</td>
                    <td style={{ fontWeight: 600, color }}>{r.score}/{r.total}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 60, height: 6, background: 'var(--lms-rule)', borderRadius: 999, overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: color }} />
                        </span>
                        <span style={{ color, fontWeight: 600 }}>{pct}%</span>
                      </span>
                    </td>
                    <td className="muted">
                      {r.completed_at ? new Date(r.completed_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
