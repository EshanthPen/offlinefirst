import { Link } from 'react-router-dom';
import Icon from './Icon';
import { useT } from '../i18n';

const SUBJ_ACCENT = {
  Mathematics: 'var(--subj-math)',
  Science:     'var(--subj-science)',
  Literacy:    'var(--subj-literacy)'
};

export default function LessonRow({ lesson, completion }) {
  const { t } = useT();
  const pct = completion ? Math.round((completion.score / completion.total) * 100) : null;
  const subjAccent = SUBJ_ACCENT[lesson.subject] || 'var(--brand)';

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s-4)',
        padding: '14px 16px', width: '100%',
        background: 'var(--surface)', border: '1px solid var(--rule)',
        borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left',
        transition: 'all var(--t-fast)',
        textDecoration: 'none', color: 'inherit'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--rule-strong)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--rule)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ width: 8, height: 40, borderRadius: 4, background: subjAccent, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, whiteSpace: 'nowrap' }}>
          <span className="eyebrow" style={{ color: subjAccent }}>{lesson.subject}</span>
          <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>·</span>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{lesson.grade_level}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{lesson.title}</div>
      </div>
      {pct !== null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <Icon name="check-circle" size={16} /> {pct}%
        </div>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
          {lesson.content?.sections?.length || 0} {t('sectionsCount')}
        </span>
      )}
      <Icon name="chevron-right" size={16} color="var(--ink-faint)" />
    </Link>
  );
}
