import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllLessons, getAllScores, getProfile, saveProfile } from '../db';
import Icon from '../components/Icon';
import ProgressRing from '../components/ProgressRing';
import SectionHeader from '../components/SectionHeader';
import { useT } from '../i18n';

const SUBJ_ACCENT = {
  Mathematics: 'var(--subj-math)',
  Science:     'var(--subj-science)',
  Literacy:    'var(--subj-literacy)'
};

function Stat({ label, value, icon }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--brand-soft)', color: 'var(--brand)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon name={icon} size={17} />
      </span>
      <div>
        <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6 }}>{label}</div>
      </div>
    </div>
  );
}

function BestScoresChart({ items, t }) {
  if (!items.length) return <div style={{ color: 'var(--ink-muted)', fontSize: 14 }}>{t('noAttempts')}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((it, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: SUBJ_ACCENT[it.subject] || 'var(--brand)', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: it.pct === 0 ? 'var(--ink-faint)' : 'var(--ink)' }}>
              {it.pct ? `${it.pct}%` : '—'}
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--rule)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${it.pct}%`,
              background: SUBJ_ACCENT[it.subject] || 'var(--brand)',
              borderRadius: 999,
              transition: 'width var(--t-med) var(--ease)'
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentProgress() {
  const { t } = useT();
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);
  const [profile, setProfile] = useState({ studentName: 'Student' });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      const [l, s, p] = await Promise.all([getAllLessons(), getAllScores(), getProfile()]);
      setLessons(l);
      setScores(s);
      setProfile(p);
      setName(p.studentName);
    })();
  }, []);

  const bestByLesson = scores.reduce((acc, s) => {
    const pct = (s.score / s.total) * 100;
    if (!acc[s.lesson_id] || pct > acc[s.lesson_id].pct) acc[s.lesson_id] = { ...s, pct };
    return acc;
  }, {});

  const completed = new Set(scores.map(s => s.lesson_id)).size;
  const total = lessons.length;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const avg = scores.length ? Math.round(scores.reduce((s, x) => s + (x.score / x.total) * 100, 0) / scores.length) : 0;
  const perfect = scores.filter(s => s.score === s.total).length;

  const subjectStats = lessons.reduce((acc, l) => {
    if (!acc[l.subject]) acc[l.subject] = { total: 0, done: 0 };
    acc[l.subject].total++;
    if (bestByLesson[l.id]) acc[l.subject].done++;
    return acc;
  }, {});

  const bestScores = lessons.map(l => ({
    title: l.title,
    subject: l.subject,
    pct: bestByLesson[l.id] ? Math.round(bestByLesson[l.id].pct) : 0
  }));

  const commitName = async () => {
    const trimmed = (name || '').trim() || 'Student';
    await saveProfile({ studentName: trimmed });
    setProfile(p => ({ ...p, studentName: trimmed }));
    setName(trimmed);
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-10)' }}>
      <header>
        <h1 className="hero">{t('yourProgressTitle')}</h1>
        <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>{t('progressSub')}</p>
      </header>

      <section>
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--brand-soft)', color: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon name="user" size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="label" style={{ marginBottom: 4 }}>{t('studentName')}</div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="text-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitName();
                    if (e.key === 'Escape') { setName(profile.studentName); setEditing(false); }
                  }}
                  autoFocus
                  style={{ fontSize: 17, fontWeight: 600, flex: 1, maxWidth: 320 }}
                />
                <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={commitName} type="button">
                  {t('saveBtn') || t('save')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{profile.studentName}</span>
                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditing(true)} type="button">
                  <Icon name="edit" size={13} /> {t('edit')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'var(--s-4)' }}>
        <Stat label={t('completion')} value={`${completionPct}%`} icon="target" />
        <Stat label={t('averageScore')} value={`${avg}%`} icon="trend" />
        <Stat label={t('lessonsDone')} value={`${completed}/${total}`} icon="book" />
        <Stat label={t('perfectQuizzes')} value={perfect} icon="trophy" />
      </section>

      {Object.keys(subjectStats).length > 0 && (
        <section>
          <SectionHeader title={t('bySubject')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s-4)' }}>
            {Object.entries(subjectStats).map(([subject, st]) => {
              const pct = st.total > 0 ? Math.round((st.done / st.total) * 100) : 0;
              return (
                <div key={subject} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <ProgressRing progress={pct} color={SUBJ_ACCENT[subject]} size={56} stroke={4} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="eyebrow" style={{ color: SUBJ_ACCENT[subject], marginBottom: 4 }}>{subject}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{st.done} {t('lessonsCompleteOf')} {st.total} {t('doneWord')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title={t('yourBestScores')} subtitle={t('yourBestScoresSub')} />
        <div className="card card-pad-lg">
          <BestScoresChart items={bestScores} t={t} />
        </div>
      </section>

      {scores.length > 0 ? (
        <section>
          <SectionHeader title={t('recentActivity')} />
          <div className="card" style={{ padding: 0 }}>
            {scores.slice().sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)).slice(0, 8).map((s, i, arr) => {
              const lesson = lessons.find(l => l.id === s.lesson_id);
              const pct = Math.round((s.score / s.total) * 100);
              return (
                <div
                  key={s.id || i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--rule)' : 'none'
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: SUBJ_ACCENT[lesson?.subject] || 'var(--brand)'
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{lesson?.title || s.lesson_id}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                      {new Date(s.completed_at).toLocaleString()}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: pct >= 80 ? 'var(--success)' : 'var(--ink-muted)' }}>
                    {s.score}/{s.total}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
            {t('noAttempts')} <Link to="/" style={{ color: 'var(--brand)' }}>{t('startALesson')}</Link>
          </div>
        </section>
      )}
    </div>
  );
}
