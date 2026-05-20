import { useState } from 'react';
import Icon, { BrandMark } from '../components/Icon';

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
        <h1 className="lms-auth-title">Sign in to continue</h1>
        <p className="lms-auth-sub">Use your school account, or continue on this device without signing in.</p>

        <button type="button" className="lms-auth-sso">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.46-.8 5.95-2.18l-2.9-2.26c-.81.54-1.83.86-3.05.86a5.27 5.27 0 0 1-4.95-3.64H1.05v2.32A8.99 8.99 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M4.05 10.78a5.3 5.3 0 0 1 0-3.56V4.9H1.05a8.99 8.99 0 0 0 0 8.2l3-2.32z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A8.99 8.99 0 0 0 9 0 8.99 8.99 0 0 0 1.05 4.9l3 2.32A5.27 5.27 0 0 1 9 3.58z" />
          </svg>
          <span>Continue with school Google account</span>
        </button>
        <button type="button" className="lms-auth-sso outline">
          <Icon name="user" size={16} color="#5F6368" />
          <span>Use a class join code</span>
        </button>

        <div className="lms-auth-divider"><span>or</span></div>

        <button
          type="button"
          className="lms-pill-btn solid lg"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onContinue}
        >
          Continue without signing in
        </button>

        <div className="lms-auth-foot">
          Everything is stored on this device. No account required.
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

  const total = 3;
  const next = () => setStep(s => Math.min(total - 1, s + 1));
  const back = () => step === 0 ? onBack && onBack() : setStep(s => s - 1);

  const canAdvance = () => {
    if (step === 0) return !!role;
    if (step === 1) return name.trim().length >= 2 && (role === 'teacher' ? subjects.length > 0 : !!grade);
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
            <p className="lms-auth-sub">You can switch later from the sidebar.</p>
            <div className="lms-role-grid">
              <button
                type="button"
                className={`lms-role-card${role === 'student' ? ' selected' : ''}`}
                onClick={() => setRole('student')}
              >
                <span className="lms-role-icon" style={{ background: '#E8F0FE', color: '#1967D2' }}>
                  <Icon name="graduation" size={28} />
                </span>
                <div className="lms-role-title">I'm a student</div>
                <div className="lms-role-sub">Read lessons, take quizzes, track your progress.</div>
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
                <div className="lms-role-title">I'm a teacher</div>
                <div className="lms-role-sub">Author lessons, share via the local mesh, review results.</div>
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
              {role === 'teacher' ? 'About your classroom' : 'About you'}
            </h1>
            <p className="lms-auth-sub">
              {role === 'teacher'
                ? 'Students will see your display name and the subjects you teach.'
                : 'OfflineFirst will greet you and recommend lessons at your level.'}
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
              Welcome, {name.split(' ')[0] || 'friend'}.
            </h1>
            <p className="lms-auth-sub" style={{ textAlign: 'center' }}>
              {role === 'teacher'
                ? 'Your console is ready. Start authoring or share existing lessons over the mesh.'
                : 'Your sample lessons are cached and ready, online or offline.'}
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
            <button type="button" className="lms-pill-btn solid" disabled={!canAdvance()} onClick={next}>
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
