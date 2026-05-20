import { useState, useEffect, useMemo } from 'react';
import Icon, { BrandMark } from '../components/Icon';
import { useT, LANGUAGES } from '../i18n';

const GRADE_LEVELS = [
  { id: 'g1-3',   labelKey: 'gradesEarly',   hintKey: 'gradesEarlyHint' },
  { id: 'g4-6',   labelKey: 'gradesUpper',   hintKey: 'gradesUpperHint' },
  { id: 'g7-9',   labelKey: 'gradesLower',   hintKey: 'gradesLowerHint' },
  { id: 'g10-12', labelKey: 'gradesSenior',  hintKey: 'gradesSeniorHint' }
];

const SUBJECTS = ['Mathematics', 'Science', 'Literacy', 'History', 'Languages', 'Other'];

// 0 welcome  1 role  2 school  3 name  4 lang  5 a11y  6 grade/subjects  7 pair  8 done
const TOTAL = 9;
const TOTAL_STEPS_SHOWN = 7; // step counter goes 1..7 (excludes welcome + done)

function StepDots({ count, current }) {
  return (
    <div className="onb-dots">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`onb-dot${i === current ? ' active' : ''}${i < current ? ' done' : ''}`} />
      ))}
    </div>
  );
}

function StepHeading({ eyebrow, title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 'var(--s-8)' }}>
      {eyebrow && <div className="label" style={{ marginBottom: 6, color: 'var(--brand)' }}>{eyebrow}</div>}
      <h1 className="hero" style={{ fontSize: 30, marginBottom: 8 }}>{title}</h1>
      {sub && <p style={{ fontSize: 15, color: 'var(--ink-muted)', maxWidth: 520, margin: '0 auto' }}>{sub}</p>}
    </div>
  );
}

function FeatureChip({ icon, title, sub }) {
  return (
    <div className="onb-feature">
      <span className="onb-feature-icon"><Icon name={icon} size={18} /></span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{sub}</div>
      </div>
    </div>
  );
}

function ChoiceCard({ icon, title, sub, selected, onClick, accent, compact }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`choice-card${selected ? ' selected' : ''}${compact ? ' compact' : ''}`}
      style={accent ? { '--choice-accent': accent } : undefined}
    >
      {icon && (
        <span className="choice-icon">
          <Icon name={icon} size={compact ? 18 : 22} />
        </span>
      )}
      <span className="choice-body">
        <span className="choice-title">{title}</span>
        {sub && <span className="choice-sub">{sub}</span>}
      </span>
      {selected && <Icon name="check-circle" size={18} color="var(--choice-accent, var(--brand))" />}
    </button>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="onb-summary-row">
      <span className="onb-summary-icon"><Icon name={icon} size={15} /></span>
      <span className="onb-summary-label">{label}</span>
      <span className="onb-summary-value">{value}</span>
    </div>
  );
}

function StepWelcome({ t }) {
  return (
    <div className="onb-step">
      <div className="onb-hero-mark">
        <BrandMark size={72} />
      </div>
      <h1 className="hero" style={{ fontSize: 36, marginBottom: 12 }}>{t('onbWelcomeTitle')}</h1>
      <p style={{ fontSize: 16, color: 'var(--ink-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
        {t('onbWelcomeSub')}
      </p>
      <div className="onb-feature-grid">
        <FeatureChip icon="wifi" title={t('onbFeatMeshTitle')} sub={t('onbFeatMeshSub')} />
        <FeatureChip icon="download" title={t('onbFeatOfflineTitle')} sub={t('onbFeatOfflineSub')} />
        <FeatureChip icon="users" title={t('onbFeatRolesTitle')} sub={t('onbFeatRolesSub')} />
      </div>
    </div>
  );
}

function StepRole({ role, onPick, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading eyebrow={stepLabel(1)} title={t('onbRoleTitle')} sub={t('onbRoleSub')} />
      <div className="role-grid">
        <button
          type="button"
          className={`role-card${role === 'student' ? ' selected' : ''}`}
          onClick={() => onPick('student')}
          style={{ '--role-accent': 'var(--subj-math)' }}
        >
          <span className="role-card-icon"><Icon name="graduation" size={28} /></span>
          <div className="role-card-title">{t('onbRoleStudent')}</div>
          <div className="role-card-sub">{t('onbRoleStudentSub')}</div>
          <ul className="role-card-list">
            <li><Icon name="check" size={14} /> {t('onbStudentBullet1')}</li>
            <li><Icon name="check" size={14} /> {t('onbStudentBullet2')}</li>
            <li><Icon name="check" size={14} /> {t('onbStudentBullet3')}</li>
          </ul>
          {role === 'student' && (
            <Icon name="check-circle" size={20} color="var(--role-accent)"
              style={{ position: 'absolute', top: 16, right: 16 }} />
          )}
        </button>

        <button
          type="button"
          className={`role-card${role === 'teacher' ? ' selected' : ''}`}
          onClick={() => onPick('teacher')}
          style={{ '--role-accent': 'var(--subj-science)' }}
        >
          <span className="role-card-icon"><Icon name="presenter" size={28} /></span>
          <div className="role-card-title">{t('onbRoleTeacher')}</div>
          <div className="role-card-sub">{t('onbRoleTeacherSub')}</div>
          <ul className="role-card-list">
            <li><Icon name="check" size={14} /> {t('onbTeacherBullet1')}</li>
            <li><Icon name="check" size={14} /> {t('onbTeacherBullet2')}</li>
            <li><Icon name="check" size={14} /> {t('onbTeacherBullet3')}</li>
          </ul>
          {role === 'teacher' && (
            <Icon name="check-circle" size={20} color="var(--role-accent)"
              style={{ position: 'absolute', top: 16, right: 16 }} />
          )}
        </button>
      </div>
    </div>
  );
}

function StepSchool({ school, onChange, serverSchool, serverLocked, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading
        eyebrow={stepLabel(2)}
        title={t('onbSchoolTitle')}
        sub={serverLocked ? t('onbSchoolLockedSub') : t('onbSchoolSub')}
      />
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <label className="label" style={{ display: 'block', marginBottom: 8 }}>
          {t('onbSchoolLabel')}
        </label>
        <input
          className="text-input onb-name-input"
          value={school}
          onChange={e => !serverLocked && onChange(e.target.value)}
          placeholder={t('onbSchoolPh')}
          autoFocus={!serverLocked}
          readOnly={serverLocked}
          style={serverLocked ? { background: 'var(--surface-2)', cursor: 'not-allowed' } : null}
        />
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8 }}>
          {serverLocked
            ? t('onbSchoolLockedHint').replace('{name}', serverSchool)
            : t('onbSchoolHint')}
        </div>
      </div>
    </div>
  );
}

function StepName({ role, name, onChange, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading
        eyebrow={stepLabel(3)}
        title={role === 'teacher' ? t('onbNameTeacherTitle') : t('onbNameStudentTitle')}
        sub={role === 'teacher' ? t('onbNameTeacherSub') : t('onbNameStudentSub')}
      />
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <label className="label" style={{ display: 'block', marginBottom: 8 }}>
          {role === 'teacher' ? t('onbDisplayName') : t('onbYourName')}
        </label>
        <input
          className="text-input onb-name-input"
          value={name}
          onChange={e => onChange(e.target.value)}
          placeholder={role === 'teacher' ? t('onbNamePhTeacher') : t('onbNamePhStudent')}
          autoFocus
        />
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8 }}>{t('onbNameHint')}</div>
      </div>
    </div>
  );
}

function StepLanguage({ lang, onPick, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading eyebrow={stepLabel(4)} title={t('onbLangTitle')} sub={t('onbLangSub')} />
      <div className="lang-grid">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            type="button"
            className={`lang-card${lang === l.code ? ' selected' : ''}`}
            onClick={() => onPick(l.code)}
          >
            <div className="lang-card-code">{l.label}</div>
            <div className="lang-card-name">{l.name}</div>
            {lang === l.code && (
              <Icon name="check-circle" size={18} color="var(--brand)"
                style={{ position: 'absolute', top: 12, right: 12 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepA11y({ a11y, onPick, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading eyebrow={stepLabel(5)} title={t('onbA11yTitle')} sub={t('onbA11ySub')} />
      <div className="a11y-grid">
        <button type="button" className={`a11y-card${!a11y ? ' selected' : ''}`} onClick={() => onPick(false)}>
          <div className="a11y-sample" style={{ fontSize: 14 }}>{t('onbA11ySample')}</div>
          <div className="a11y-card-title">{t('onbA11yNormal')}</div>
          <div className="a11y-card-sub">{t('onbA11yNormalSub')}</div>
          {!a11y && <Icon name="check-circle" size={18} color="var(--brand)" style={{ position: 'absolute', top: 12, right: 12 }} />}
        </button>
        <button type="button" className={`a11y-card${a11y ? ' selected' : ''}`} onClick={() => onPick(true)}>
          <div className="a11y-sample" style={{ fontSize: 18 }}>{t('onbA11ySample')}</div>
          <div className="a11y-card-title">{t('onbA11yLarge')}</div>
          <div className="a11y-card-sub">{t('onbA11yLargeSub')}</div>
          {a11y && <Icon name="check-circle" size={18} color="var(--brand)" style={{ position: 'absolute', top: 12, right: 12 }} />}
        </button>
      </div>
    </div>
  );
}

function StepGrade({ grade, onPick, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading eyebrow={stepLabel(6)} title={t('onbGradeTitle')} sub={t('onbGradeSub')} />
      <div className="choice-grid">
        {GRADE_LEVELS.map(g => (
          <ChoiceCard
            key={g.id}
            icon="layers"
            title={t(g.labelKey)}
            sub={t(g.hintKey)}
            selected={grade === g.id}
            onClick={() => onPick(g.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StepSubjects({ subjects, onToggle, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading eyebrow={stepLabel(6)} title={t('onbSubjectsTitle')} sub={t('onbSubjectsSub')} />
      <div className="choice-grid choice-grid-3">
        {SUBJECTS.map(s => (
          <ChoiceCard
            key={s}
            icon="book"
            title={s}
            selected={subjects.includes(s)}
            onClick={() => onToggle(s)}
            compact
          />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--ink-faint)' }}>
        {subjects.length} {t('onbSelected')}
      </div>
    </div>
  );
}

function StepStudentPair({ paired, onMark, t, stepLabel }) {
  return (
    <div className="onb-step">
      <StepHeading eyebrow={stepLabel(7)} title={t('onbPairStudentTitle')} sub={t('onbPairStudentSub')} />
      <div className="pair-row">
        <div className="pair-col">
          <div className="pair-col-eyebrow">{t('onbPairOption1')}</div>
          <div className="pair-col-title">{t('onbScanTeacherTitle')}</div>
          <div className="pair-col-body">{t('onbScanTeacherBody')}</div>
          <button
            type="button"
            className={`btn ${paired ? 'btn-secondary' : 'btn-primary'}`}
            onClick={onMark}
            style={{ marginTop: 12 }}
          >
            <Icon name="qr" size={15} />
            {paired ? t('onbScanned') : t('onbOpenScanner')}
          </button>
          {paired && (
            <div className="pair-confirm">
              <Icon name="check-circle" size={14} color="var(--success)" />
              {t('onbPairedDemo')}
            </div>
          )}
        </div>

        <div className="pair-divider"><span>{t('onbOr')}</span></div>

        <div className="pair-col">
          <div className="pair-col-eyebrow">{t('onbPairOption2')}</div>
          <div className="pair-col-title">{t('onbSkipPairTitle')}</div>
          <div className="pair-col-body">{t('onbSkipPairBody')}</div>
          <button type="button" className="btn btn-ghost" style={{ marginTop: 12, padding: '8px 14px' }}>
            <Icon name="signal" size={15} /> {t('onbPairLater')}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepTeacherPair({ deviceId, paired, onMark, t, stepLabel }) {
  const cells = useMemo(() => {
    const N = 9;
    const seed = [...deviceId].reduce((a, c) => a + c.charCodeAt(0), 17);
    const out = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const corner = (r < 3 && c < 3) || (r < 3 && c > N - 4) || (r > N - 4 && c < 3);
        let on;
        if (corner) {
          const lr = r < 3 ? r : N - 1 - r;
          const lc = c < 3 ? c : N - 1 - c;
          on = lr === 0 || lr === 2 || lc === 0 || lc === 2;
        } else {
          on = ((seed * (r * 7 + c * 3 + 11)) % 7) < 3;
        }
        out.push(on);
      }
    }
    return out;
  }, [deviceId]);

  return (
    <div className="onb-step">
      <StepHeading eyebrow={stepLabel(7)} title={t('onbPairTeacherTitle')} sub={t('onbPairTeacherSub')} />
      <div className="pair-teacher">
        <div className="qr-card" style={{ marginBottom: 0 }}>
          <div className="qr-grid" style={{ gridTemplateColumns: 'repeat(9, 18px)', gridTemplateRows: 'repeat(9, 18px)' }}>
            {cells.map((on, i) => (
              <span key={i} className="qr-cell" style={{ background: on ? 'var(--ink)' : 'transparent' }} />
            ))}
          </div>
        </div>
        <div className="pair-teacher-meta">
          <div className="label">{t('onbDeviceId')}</div>
          <div className="mono" style={{ color: 'var(--brand)', fontSize: 14 }}>{deviceId}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 12, lineHeight: 1.6 }}>
            {t('onbTeacherPairHint')}
          </div>
          <button
            type="button"
            className={`btn ${paired ? 'btn-secondary' : 'btn-primary'}`}
            style={{ marginTop: 12 }}
            onClick={onMark}
          >
            <Icon name="link" size={15} />
            {paired ? t('onbStudentPaired') : t('onbMarkReady')}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepDone({ role, name, school, lang, a11y, grade, subjects, paired, t }) {
  const langName = (LANGUAGES.find(l => l.code === lang) || {}).name || lang;
  const gradeDef = GRADE_LEVELS.find(g => g.id === grade);
  const gradeName = gradeDef ? t(gradeDef.labelKey) : null;
  const firstName = (name || 'Student').split(/\s+/)[0];
  return (
    <div className="onb-step">
      <div className="onb-hero-mark">
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--brand-soft)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto', color: 'var(--brand)'
        }}>
          <Icon name="check-thin" size={42} strokeWidth={2.2} />
        </div>
      </div>
      <h1 className="hero" style={{ fontSize: 32, marginBottom: 10 }}>
        {t('onbDoneTitle').replace('{name}', firstName)}
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-muted)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
        {role === 'teacher' ? t('onbDoneTeacherSub') : t('onbDoneStudentSub')}
      </p>

      <div className="onb-summary">
        <SummaryRow
          icon={role === 'teacher' ? 'presenter' : 'graduation'}
          label={t('onbSummaryRole')}
          value={role === 'teacher' ? t('onbRoleTeacher') : t('onbRoleStudent')}
        />
        <SummaryRow icon="user" label={t('onbSummaryName')} value={name} />
        {school && <SummaryRow icon="library" label={t('onbSummarySchool')} value={school} />}
        <SummaryRow icon="globe" label={t('onbSummaryLang')} value={langName} />
        <SummaryRow icon="type" label={t('onbSummaryText')} value={a11y ? t('onbA11yLarge') : t('onbA11yNormal')} />
        {role === 'student' && gradeName && <SummaryRow icon="layers" label={t('onbSummaryGrade')} value={gradeName} />}
        {role === 'teacher' && subjects.length > 0 && <SummaryRow icon="book" label={t('onbSummarySubjects')} value={subjects.join(', ')} />}
        <SummaryRow
          icon={paired ? 'link' : 'signal'}
          label={t('onbSummaryPair')}
          value={paired
            ? (role === 'teacher' ? t('onbStudentPaired') : t('onbPairedDemo'))
            : t('onbSkipped')}
        />
      </div>
    </div>
  );
}

export default function Onboarding({ onComplete, initialLang = 'en' }) {
  const { t, setLang: setI18nLang } = useT();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);
  const [school, setSchool] = useState('');
  const [serverSchool, setServerSchool] = useState(null);
  const [serverLocked, setServerLocked] = useState(false);
  const [name, setName] = useState('');
  const [lang, setLang] = useState(initialLang);
  const [a11y, setA11y] = useState(false);
  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [paired, setPaired] = useState(false);
  const deviceId = useMemo(
    () => 'of_' + Math.random().toString(36).slice(2, 10),
    []
  );

  // Fetch server-side school name (set via SCHOOL_NAME env var). If present,
  // prefill + lock the field so per-school deploys don't ask users to retype.
  useEffect(() => {
    fetch('/api/school')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.name) {
          setServerSchool(data.name);
          setServerLocked(!!data.locked);
          setSchool(prev => prev || data.name);
        }
      })
      .catch(() => {});
  }, []);

  const stepLabel = (n) => `${t('onbStepWord')} ${n} ${t('onbOfWord')} ${TOTAL_STEPS_SHOWN}`;

  const canAdvance = () => {
    if (step === 1) return !!role;
    if (step === 2) return true; // school is optional
    if (step === 3) return name.trim().length >= 2;
    if (step === 6) return role === 'student' ? !!grade : subjects.length > 0;
    return true;
  };

  const next = () => setStep(s => Math.min(TOTAL - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const toggleSubject = (s) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // Live-apply accessibility + language so the preview reflects choices
  useEffect(() => {
    document.documentElement.setAttribute('data-a11y', a11y ? 'large' : 'normal');
  }, [a11y]);

  useEffect(() => {
    setI18nLang(lang);
  }, [lang, setI18nLang]);

  const finish = () => {
    onComplete({
      role,
      studentName: name.trim() || 'Student',
      school: school.trim() || null,
      lang,
      a11y,
      grade,
      subjects,
      paired,
      deviceId,
      onboardedAt: new Date().toISOString()
    });
  };

  return (
    <div className="onb-root">
      <div className="onb-card">
        <div className="onb-header">
          <div className="onb-brand">
            <BrandMark size={22} />
            <span className="wordmark" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>offlinefirst</span>
          </div>
          {step > 0 && step < TOTAL - 1 && (
            <StepDots count={TOTAL - 2} current={step - 1} />
          )}
          {step > 0 && step < TOTAL - 1 && (
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={() => onComplete(null)}
              type="button"
            >
              {t('onbSkip')}
            </button>
          )}
        </div>

        <div className="onb-body">
          {step === 0 && <StepWelcome t={t} />}
          {step === 1 && <StepRole role={role} onPick={setRole} t={t} stepLabel={stepLabel} />}
          {step === 2 && <StepSchool school={school} onChange={setSchool} serverSchool={serverSchool} serverLocked={serverLocked} t={t} stepLabel={stepLabel} />}
          {step === 3 && <StepName role={role} name={name} onChange={setName} t={t} stepLabel={stepLabel} />}
          {step === 4 && <StepLanguage lang={lang} onPick={setLang} t={t} stepLabel={stepLabel} />}
          {step === 5 && <StepA11y a11y={a11y} onPick={setA11y} t={t} stepLabel={stepLabel} />}
          {step === 6 && (role === 'teacher'
            ? <StepSubjects subjects={subjects} onToggle={toggleSubject} t={t} stepLabel={stepLabel} />
            : <StepGrade grade={grade} onPick={setGrade} t={t} stepLabel={stepLabel} />)}
          {step === 7 && (role === 'teacher'
            ? <StepTeacherPair deviceId={deviceId} paired={paired} onMark={() => setPaired(true)} t={t} stepLabel={stepLabel} />
            : <StepStudentPair paired={paired} onMark={() => setPaired(true)} t={t} stepLabel={stepLabel} />)}
          {step === 8 && (
            <StepDone
              role={role}
              name={name.trim() || 'Student'}
              school={school.trim()}
              lang={lang}
              a11y={a11y}
              grade={grade}
              subjects={subjects}
              paired={paired}
              t={t}
            />
          )}
        </div>

        <div className="onb-footer">
          {step > 0 && step < TOTAL - 1 && (
            <button className="btn btn-ghost" onClick={back} type="button">
              <Icon name="arrow-left" size={15} /> {t('onbBack')}
            </button>
          )}
          <span style={{ flex: 1 }} />
          {step === 0 && (
            <button className="btn btn-primary btn-lg" onClick={next} type="button">
              {t('onbGetStarted')} <Icon name="arrow-right" size={16} />
            </button>
          )}
          {step > 0 && step < TOTAL - 1 && (
            <button
              className="btn btn-primary btn-lg"
              onClick={next}
              disabled={!canAdvance()}
              type="button"
              style={canAdvance() ? null : { opacity: 0.5, cursor: 'not-allowed' }}
            >
              {t('onbContinue')} <Icon name="arrow-right" size={16} />
            </button>
          )}
          {step === TOTAL - 1 && (
            <button className="btn btn-primary btn-lg" onClick={finish} type="button">
              {t('onbEnterApp')} <Icon name="arrow-right" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="onb-foot-note">{t('onbFootNote')}</div>
    </div>
  );
}
