import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllLessons, getAllScores, getProfile } from '../db';
import SectionHeader from '../components/SectionHeader';
import Cover from '../components/Cover';
import LessonRow from '../components/LessonRow';
import Icon from '../components/Icon';
import { useT } from '../i18n';

const SUBJ_ACCENT = {
  Mathematics: 'var(--subj-math)',
  Science:     'var(--subj-science)',
  Literacy:    'var(--subj-literacy)'
};

function ProgressBar({ value, color = 'var(--brand)', track = 'var(--rule)', height = 6 }) {
  return (
    <div style={{ height, background: track, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${Math.max(0, Math.min(100, value))}%`,
        background: color,
        borderRadius: 999,
        transition: 'width var(--t-med) var(--ease)'
      }} />
    </div>
  );
}

function CourseCard({ subject, done, total, lessons }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const { t } = useT();
  const firstLesson = lessons[0];

  return (
    <Link
      to={firstLesson ? `/lesson/${firstLesson.id}` : '/courses'}
      style={{
        display: 'flex', flexDirection: 'column', textAlign: 'left',
        background: 'var(--surface)', border: '1px solid var(--rule)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', cursor: 'pointer',
        transition: 'all var(--t-fast)', textDecoration: 'none', color: 'inherit'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-2)';
        e.currentTarget.style.borderColor = 'var(--rule-strong)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--rule)';
      }}
    >
      <Cover subject={subject} height={120} />
      <div style={{ padding: 'var(--s-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{subject}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
            {done} {t('lessonsCompleteOf')} {total} {t('lessonsComplete')}
          </div>
        </div>
        <ProgressBar value={pct} color={SUBJ_ACCENT[subject] || 'var(--brand)'} />
      </div>
    </Link>
  );
}

export default function StudentHome() {
  const { t } = useT();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);
  const [profile, setProfile] = useState({ studentName: 'Student' });

  useEffect(() => {
    const load = async () => {
      const [l, s, p] = await Promise.all([getAllLessons(), getAllScores(), getProfile()]);
      setLessons(l);
      setScores(s);
      setProfile(p);
    };
    load();
  }, []);

  const bestByLesson = useMemo(() => {
    return scores.reduce((acc, s) => {
      const pct = s.score / s.total;
      const cur = acc[s.lesson_id];
      if (!cur || pct > cur.score / cur.total) acc[s.lesson_id] = s;
      return acc;
    }, {});
  }, [scores]);

  const courses = useMemo(() => {
    const grouped = lessons.reduce((acc, l) => {
      (acc[l.subject] = acc[l.subject] || []).push(l);
      return acc;
    }, {});
    return Object.entries(grouped).map(([subject, ls]) => ({
      subject,
      lessons: ls,
      done: ls.filter(l => bestByLesson[l.id]).length,
      total: ls.length
    }));
  }, [lessons, bestByLesson]);

  const continueLesson = lessons.find(l => !bestByLesson[l.id]) || lessons[0];
  const upNext = continueLesson ? lessons.filter(l => l.id !== continueLesson.id).slice(0, 3) : [];

  const inProgressCount = lessons.length - Object.keys(bestByLesson).length;
  const firstName = (profile.studentName || 'Student').split(/\s+/)[0];

  if (lessons.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-10)' }}>
        <header>
          <div className="label" style={{ marginBottom: 6 }}>{t('welcomeBack')}</div>
          <h1 className="hero">{t('greeting')}, {firstName}.</h1>
        </header>
        <div className="card card-pad-lg" style={{ textAlign: 'center', padding: 'var(--s-12)' }}>
          <div style={{
            display: 'inline-flex', width: 56, height: 56,
            borderRadius: 'var(--r-md)', background: 'var(--brand-soft)',
            color: 'var(--brand)', alignItems: 'center', justifyContent: 'center', marginBottom: 16
          }}>
            <Icon name="download" size={26} />
          </div>
          <h2 className="h2" style={{ marginBottom: 8 }}>{t('waiting')}</h2>
          <p style={{ color: 'var(--ink-muted)', margin: 0 }}>{t('waitingHint')}</p>
        </div>
      </div>
    );
  }

  const firstText = continueLesson?.content?.sections?.find(s => s.type === 'text')?.content || '';
  const blurb = firstText.length > 140 ? firstText.slice(0, 140) + '…' : firstText;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-10)' }}>
      <header>
        <div className="label" style={{ marginBottom: 6 }}>{t('welcomeBack')}</div>
        <h1 className="hero">{t('greeting')}, {firstName}.</h1>
        <p style={{ marginTop: 12, color: 'var(--ink-muted)', maxWidth: 540 }}>
          {t('homeBlurbPrefix')} <strong style={{ color: 'var(--ink)' }}>{inProgressCount} {t('homeBlurbMiddle')}</strong>{t('homeBlurbSuffix')}
        </p>
      </header>

      {continueLesson && (
        <section>
          <SectionHeader title={t('continueLearning')} />
          <div className="card" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
            <div style={{ borderRight: '1px solid var(--rule)' }}>
              <Cover subject={continueLesson.subject} height={220} big />
            </div>
            <div className="card-pad-lg" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ color: SUBJ_ACCENT[continueLesson.subject] || 'var(--brand)', marginBottom: 8 }}>
                  {continueLesson.subject} · {continueLesson.grade_level}
                </div>
                <h2 style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 8, margin: 0 }}>
                  {continueLesson.title}
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: 15, margin: '8px 0 0' }}>{blurb}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{t('readingProgress')} · 40%</span>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={40} color={SUBJ_ACCENT[continueLesson.subject] || 'var(--brand)'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate(`/lesson/${continueLesson.id}`)}
                  type="button"
                >
                  {t('continueLesson')}
                  <Icon name="arrow-right" size={16} />
                </button>
                <button className="btn btn-ghost" type="button">
                  <Icon name="bookmark" size={16} />
                  {t('save')}
                </button>
                <div style={{
                  marginLeft: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: 'var(--ink-faint)'
                }}>
                  <Icon name="download" size={14} /> {t('offlineReady')}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <SectionHeader title={t('yourCourses')} cta={t('seeAll')} onCta={() => navigate('/courses')} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--s-4)'
        }}>
          {courses.map(c => <CourseCard key={c.subject} {...c} />)}
        </div>
      </section>

      {upNext.length > 0 && (
        <section>
          <SectionHeader title={t('upNext')} subtitle={t('upNextSub')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upNext.map(l => (
              <LessonRow key={l.id} lesson={l} completion={bestByLesson[l.id]} />
            ))}
          </div>
        </section>
      )}

      <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {t('sdgList').map(sdg => (
          <span key={sdg} style={{
            fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 'var(--r-pill)',
            background: 'var(--brand-soft)', color: 'var(--brand)'
          }}>
            {sdg}
          </span>
        ))}
      </section>
    </div>
  );
}
