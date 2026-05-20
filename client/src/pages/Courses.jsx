import { useState, useEffect } from 'react';
import { getAllLessons, getAllScores } from '../db';
import LessonRow from '../components/LessonRow';
import { useT } from '../i18n';

const SUBJ_ACCENT = {
  Mathematics: 'var(--subj-math)',
  Science:     'var(--subj-science)',
  Literacy:    'var(--subj-literacy)'
};

export default function Courses() {
  const { t } = useT();
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    (async () => {
      setLessons(await getAllLessons());
      setScores(await getAllScores());
    })();
  }, []);

  const bestByLesson = scores.reduce((acc, s) => {
    const pct = s.score / s.total;
    const cur = acc[s.lesson_id];
    if (!cur || pct > cur.score / cur.total) acc[s.lesson_id] = s;
    return acc;
  }, {});

  const grouped = lessons.reduce((acc, l) => {
    (acc[l.subject] = acc[l.subject] || []).push(l);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-10)' }}>
      <header>
        <h1 className="hero">{t('courses')}</h1>
        <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>{t('coursesSub')}</p>
      </header>

      {Object.entries(grouped).map(([subject, subjLessons]) => (
        <section key={subject}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--s-4)' }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: SUBJ_ACCENT[subject] || 'var(--brand)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13
            }}>{subject[0]}</span>
            <h2 className="h2" style={{ fontSize: 22 }}>{subject}</h2>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-faint)' }}>
              {subjLessons.length} {t('lessonsWord')}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subjLessons.map(l => (
              <LessonRow key={l.id} lesson={l} completion={bestByLesson[l.id]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
