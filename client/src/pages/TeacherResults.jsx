import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import Icon from '../components/Icon';
import { useT } from '../i18n';

export default function TeacherResults() {
  const { t } = useT();
  const [scores, setScores] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/scores');
        if (res.ok) setScores(await res.json());
      } catch (err) {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const subjects = [...new Set(scores.map(s => s.subject).filter(Boolean))];
  const filtered = filter === 'all' ? scores : scores.filter(s => s.subject === filter);

  const chartData = Object.entries(
    filtered.reduce((acc, s) => {
      const key = s.lesson_title || s.lesson_id;
      if (!acc[key]) acc[key] = { scores: [], total: s.total };
      acc[key].scores.push(s.score);
      return acc;
    }, {})
  ).map(([name, data]) => ({
    name: name.length > 15 ? name.slice(0, 15) + '…' : name,
    avg: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
    count: data.scores.length,
    maxScore: data.total
  }));

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
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Student', 14, y);
    doc.text('Lesson', 60, y);
    doc.text('Score', 130, y);
    doc.text('%', 150, y);
    doc.text('Date', 170, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="hero">{t('quizResults')}</h1>
          <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>Every quiz attempt across the mesh, in one place.</p>
        </div>
        <button className="btn btn-secondary" onClick={exportPDF} disabled={filtered.length === 0} type="button">
          <Icon name="download" size={15} /> {t('exportPDF')}
        </button>
      </header>

      {chartData.length > 0 && (
        <div className="card card-pad-lg">
          <h3 className="h2" style={{ fontSize: 16, marginBottom: 16 }}>{t('averageByLesson')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
              <XAxis dataKey="name" tick={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: 'var(--ink-muted)' }} />
              <YAxis tick={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: 'var(--ink-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--rule-strong)', borderRadius: 6, fontFamily: 'Inter, sans-serif' }}
                labelStyle={{ color: 'var(--ink)' }}
                formatter={(v, n, p) => [`${v.toFixed(1)} / ${p.payload.maxScore} (${p.payload.count} attempts)`, 'Avg']}
              />
              <Bar dataKey="avg" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['all', ...subjects].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            type="button"
            style={{
              background: filter === s ? 'var(--brand)' : 'var(--surface)',
              color: filter === s ? 'var(--brand-on)' : 'var(--ink-muted)',
              border: '1px solid ' + (filter === s ? 'var(--brand)' : 'var(--rule)'),
              borderRadius: 'var(--r-pill)',
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            {s === 'all' ? t('allFilter') : s}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--rule)' }}>
              {[t('studentCol'), t('lessonCol'), t('scoreCol'), t('pctCol'), t('dateCol')].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)',
                  letterSpacing: '0.04em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--s-12)', textAlign: 'center', color: 'var(--ink-muted)' }}>
                  {t('noResultsYet')}
                </td>
              </tr>
            ) : (
              filtered.map((s, i, arr) => {
                const pct = Math.round((s.score / s.total) * 100);
                const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--info)' : 'var(--warning)';
                return (
                  <tr key={s.id || i} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--rule)' : 'none' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{s.student_name || 'Anonymous'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--ink-muted)' }}>{s.lesson_title || s.lesson_id}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color }}>{s.score}/{s.total}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: 'var(--rule)', borderRadius: 999 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, color, fontWeight: 600 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--ink-faint)' }}>
                      {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
