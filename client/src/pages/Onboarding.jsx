import { useState, useEffect } from 'react';
import Icon, { BrandMark } from '../components/Icon';
import { fetchAuthStatus, submitTeacherPin } from '../auth';

const GRADE_LEVELS = [
  { id: 'g1-3',   label: 'Grades 1–3',  hint: 'Early primary' },
  { id: 'g4-6',   label: 'Grades 4–6',  hint: 'Upper primary' },
  { id: 'g7-9',   label: 'Grades 7–9',  hint: 'Lower secondary' },
  { id: 'g10-12', label: 'Grades 10–12', hint: 'Upper secondary' }
];

const SUBJECTS = ['Mathematics', 'Science', 'Literacy', 'History', 'Languages', 'Other'];

function SignIn({ onContinue }) {
  return (
    <div className="lms-auth-shell">
      <div className="lms-auth-brand">
        <BrandMark size={28} />
        <span className="lms-auth-brand-name">OfflineFirst</span>
      </div>
      <div className="lms-auth-card">
        <h1 className="lms-auth-title">Welcome</h1>
        <p className="lms-auth-sub">
          About a minute to set up. No account.
        </p>

        <button
          type="button"
          className="lms-pill-btn solid lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={onContinue}
        >
          Get started <Icon name="arrow-right" size={16} />
        </button>

        <div className="lms-auth-foot">
          Saves to this device. Syncs to nearby devices over WiFi.
        </div>
      </div>
    </div>
  );
}

function OnboardingFlow({ onComplete, onBack, initialLang = 'en' }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [pin, setPin] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => { fetchAuthStatus().then(s => setAuthEnabled(!!s.authEnabled)); }, []);

  const needsPin = role === 'teacher' && authEnabled;
  const total = 3;
  const next = () => setStep(s => Math.min(total - 1, s + 1));
  const back = () => step === 0 ? onBack && onBack() : setStep(s => s - 1);

  const canAdvance = () => {
    if (step === 0) return !!role;
    if (step === 1) {
      const base = name.trim().length >= 2 && (role === 'teacher' ? subjects.length > 0 : !!grade);
      if (!base) return false;
      if (needsPin) return pin.length >= 4;
      return true;
    }
    return true;
  };

  const finish = () => {
    onComplete({
      role,
      studentName: name.trim() || 'Student',
      grade,
      subjects,
      lang: initialLang,
      a11y: false,
      onboardedAt: new Date().toISOString()
    });
  };

  // Validate PIN on continue from step 1 if teacher role + auth on
  const onContinue = async () => {
    if (step === 1 && needsPin) {
      setPinErr('');
      const res = await submitTeacherPin(pin);
      if (!res.ok) {
        setPinErr(res.reason === 'incorrect_pin' ? 'Incorrect PIN. Try again.' : 'Sign-in failed.');
        return;
      }
    }
    next();
  };

  return (
    <div className="lms-auth-shell">
      <div className="lms-auth-brand">
        <BrandMark size={28} />
        <span className="lms-auth-brand-name">OfflineFirst</span>
      </div>

      <div className="lms-auth-card wide">
        <div className="lms-auth-progress">
          <div className="lms-auth-progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>

        {step === 0 && (
          <>
            <h1 className="lms-auth-title">Who's using this device?</h1>
            <p className="lms-auth-sub">You can change this later in Settings.</p>
            <div className="lms-role-grid">
              <button
                type="button"
                className={`lms-role-card${role === 'student' ? ' selected' : ''}`}
                onClick={() => setRole('student')}
              >
                <span className="lms-role-icon" style={{ background: '#E8F0FE', color: '#1967D2' }}>
                  <Icon name="graduation" size={28} />
                </span>
                <div className="lms-role-title">Student</div>
                <div className="lms-role-sub">Read lessons and take quizzes.</div>
                {role === 'student' && (
                  <Icon name="check-circle" size={20} color="#1967D2" style={{ position: 'absolute', top: 14, right: 14 }} />
                )}
              </button>
              <button
                type="button"
                className={`lms-role-card${role === 'teacher' ? ' selected' : ''}`}
                onClick={() => setRole('teacher')}
              >
                <span className="lms-role-icon" style={{ background: '#E6F4EA', color: '#1E8E3E' }}>
                  <Icon name="teacher" size={28} />
                </span>
                <div className="lms-role-title">Teacher</div>
                <div className="lms-role-sub">Write lessons and see student scores.</div>
                {role === 'teacher' && (
                  <Icon name="check-circle" size={20} color="#1E8E3E" style={{ position: 'absolute', top: 14, right: 14 }} />
                )}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="lms-auth-title">
              {role === 'teacher' ? 'About you' : 'About you'}
            </h1>
            <p className="lms-auth-sub">
              {role === 'teacher'
                ? 'Students see this name on lessons you share.'
                : 'Used to greet you and pick lessons for your level.'}
            </p>

            <label className="lms-field-label">{role === 'teacher' ? 'Display name' : 'Your name'}</label>
            <input
              className="lms-text-field"
              autoFocus
              placeholder={role === 'teacher' ? 'Ms. Adeyemi' : 'Aminata'}
              value={name}
              onChange={e => setName(e.target.value)}
            />

            {role === 'student' && (
              <>
                <label className="lms-field-label" style={{ marginTop: 20 }}>Your grade</label>
                <div className="lms-pill-row">
                  {GRADE_LEVELS.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      className={`lms-choose-pill${grade === g.id ? ' selected' : ''}`}
                      onClick={() => setGrade(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {role === 'teacher' && (
              <>
                <label className="lms-field-label" style={{ marginTop: 20 }}>Subjects you teach</label>
                <div className="lms-pill-row">
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`lms-choose-pill${subjects.includes(s) ? ' selected' : ''}`}
                      onClick={() => setSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {needsPin && (
                  <>
                    <label className="lms-field-label" style={{ marginTop: 20 }}>Teacher PIN</label>
                    <input
                      className="lms-text-field"
                      type="password"
                      inputMode="numeric"
                      placeholder="••••••"
                      value={pin}
                      onChange={e => { setPin(e.target.value); setPinErr(''); }}
                      style={{ maxWidth: 200, letterSpacing: '0.2em', textAlign: 'center' }}
                    />
                    {pinErr && (
                      <div style={{ marginTop: 8, color: 'var(--lms-bad)', fontSize: 13 }}>{pinErr}</div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--lms-ink-faint)' }}>
                      Set by the administrator of this OfflineFirst server.
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="lms-onb-done-mark">
              <Icon name="check" size={36} strokeWidth={2.5} color="white" />
            </div>
            <h1 className="lms-auth-title" style={{ textAlign: 'center' }}>
              All set, {name.split(' ')[0] || 'friend'}.
            </h1>
            <p className="lms-auth-sub" style={{ textAlign: 'center' }}>
              {role === 'teacher' ? 'Your console is ready.' : 'Sample lessons are ready.'}
            </p>
            <div className="lms-onb-summary">
              <div className="lms-onb-summary-row">
                <Icon name={role === 'teacher' ? 'teacher' : 'graduation'} size={16} color="var(--lms-ink-muted)" />
                <span className="lms-onb-summary-label">{role === 'teacher' ? 'Teacher' : 'Student'}</span>
                <span className="lms-onb-summary-value">{name}</span>
              </div>
              {role === 'student' && grade && (
                <div className="lms-onb-summary-row">
                  <Icon name="layers" size={16} color="var(--lms-ink-muted)" />
                  <span className="lms-onb-summary-label">Grade</span>
                  <span className="lms-onb-summary-value">{GRADE_LEVELS.find(g => g.id === grade)?.label}</span>
                </div>
              )}
              {role === 'teacher' && subjects.length > 0 && (
                <div className="lms-onb-summary-row">
                  <Icon name="book" size={16} color="var(--lms-ink-muted)" />
                  <span className="lms-onb-summary-label">Subjects</span>
                  <span className="lms-onb-summary-value">{subjects.join(', ')}</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="lms-auth-actions">
          {step < total - 1 && (
            <button type="button" className="lms-text-btn" onClick={back}>
              <Icon name="chevron-left" size={16} /> {step === 0 ? 'Back to sign-in' : 'Back'}
            </button>
          )}
          <span style={{ flex: 1 }} />
          {step < total - 1 && (
            <button type="button" className="lms-pill-btn solid" disabled={!canAdvance()} onClick={onContinue}>
              Continue <Icon name="arrow-right" size={16} />
            </button>
          )}
          {step === total - 1 && (
            <button type="button" className="lms-pill-btn solid" onClick={finish}>
              Enter classroom <Icon name="arrow-right" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding({ onComplete, initialLang = 'en' }) {
  const [stage, setStage] = useState('signin');
  if (stage === 'signin') return <SignIn onContinue={() => setStage('onboarding')} />;
  return <OnboardingFlow onComplete={onComplete} onBack={() => setStage('signin')} initialLang={initialLang} />;
}
