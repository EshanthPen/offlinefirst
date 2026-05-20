import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getLessonById, getQuizByLessonId, saveScore, getProfile } from '../db';
import Icon from '../components/Icon';
import { useT } from '../i18n';

const SUBJ_ACCENT = {
  Mathematics: 'var(--subj-math)',
  Science:     'var(--subj-science)',
  Literacy:    'var(--subj-literacy)'
};

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [q, setQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(null);

  useEffect(() => {
    (async () => {
      const [l, qz] = await Promise.all([getLessonById(id), getQuizByLessonId(id)]);
      setLesson(l);
      setQuiz(qz);
    })();
  }, [id]);

  if (!lesson || !quiz) {
    return <div style={{ color: 'var(--ink-muted)', textAlign: 'center', padding: 'var(--s-12)' }}>{t('initializing')}</div>;
  }

  const questions = quiz.questions || [];
  const question = questions[q];
  const accent = SUBJ_ACCENT[lesson.subject] || 'var(--brand)';

  const submit = async () => {
    const next = [...answers, selected];
    if (q < questions.length - 1) {
      setAnswers(next);
      setQ(q + 1);
      setSelected(null);
      setConfirmed(false);
      return;
    }
    const score = next.filter((a, i) => a === questions[i].correct).length;
    setDone({ score, total: questions.length, answers: next });
    const profile = await getProfile();
    await saveScore({
      id: uuidv4(),
      student_id: profile.studentId,
      student_name: profile.studentName,
      lesson_id: id,
      quiz_id: quiz.id,
      answers: next,
      score,
      total: questions.length,
      completed_at: new Date().toISOString(),
      device_id: localStorage.getItem('offlinefirst_device_id')
    });
  };

  if (done) {
    const pct = Math.round((done.score / done.total) * 100);
    const label = pct >= 80 ? t('excellentWork') : pct >= 60 ? t('goodProgress') : pct >= 40 ? t('keepGoingPhrase') : t('needsReviewPhrase');

    return (
      <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'var(--brand-soft)', color: 'var(--brand)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <Icon name="check-thin" size={48} strokeWidth={2.2} />
        </div>
        <div className="label" style={{ marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 64, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 8 }}>{pct}%</div>
        <div style={{ color: 'var(--ink-muted)', marginBottom: 32 }}>
          {done.score} {t('outOfCorrect')} {done.total} {t('correctSuffix')}
        </div>

        <div style={{ textAlign: 'left', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map((qq, i) => {
            const ok = done.answers[i] === qq.correct;
            return (
              <div key={i} className="card" style={{ display: 'flex', gap: 14, padding: 'var(--s-4) var(--s-5)' }}>
                <Icon name={ok ? 'check-circle' : 'x-circle'} size={20} color={ok ? 'var(--success)' : 'var(--danger)'} style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{qq.text}</div>
                  {!ok && (
                    <div style={{ fontSize: 13, color: 'var(--success)' }}>
                      {qq.options[qq.correct]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')} type="button">{t('backToHome')}</button>
        </div>
      </div>
    );
  }

  const isCorrect = confirmed && selected === question.correct;
  const progressPct = ((q + (confirmed ? 1 : 0)) / questions.length) * 100;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--s-4)', fontSize: 13, color: 'var(--ink-muted)', gap: 12
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {t('questionLabel')} {q + 1} {t('of')} {questions.length}
        </span>
      </div>
      <div style={{ marginBottom: 'var(--s-8)' }}>
        <div style={{ height: 6, background: 'var(--rule)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: accent, transition: 'width var(--t-med) var(--ease)' }} />
        </div>
      </div>

      <div className="card card-pad-lg" style={{ marginBottom: 'var(--s-5)' }}>
        <div className="label" style={{ color: accent, marginBottom: 12 }}>{t('questionLabel')} {q + 1}</div>
        <p style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.01em', margin: 0 }}>{question.text}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--s-6)' }}>
        {question.options.map((opt, idx) => {
          let border = 'var(--rule)';
          let bg = 'var(--surface)';
          let textColor = 'var(--ink)';
          let letterColor = 'var(--ink-faint)';
          let icon = null;
          if (!confirmed && selected === idx) { border = accent; bg = 'var(--brand-soft)'; letterColor = accent; }
          if (confirmed && idx === question.correct) {
            border = 'var(--success)'; bg = 'var(--success-soft)';
            textColor = 'var(--success)'; letterColor = 'var(--success)';
            icon = <Icon name="check-circle" size={18} color="var(--success)" />;
          }
          if (confirmed && selected === idx && idx !== question.correct) {
            border = 'var(--danger)'; bg = 'var(--danger-soft)';
            textColor = 'var(--danger)'; letterColor = 'var(--danger)';
            icon = <Icon name="x-circle" size={18} color="var(--danger)" />;
          }

          return (
            <button
              key={idx}
              onClick={() => !confirmed && setSelected(idx)}
              disabled={confirmed}
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px', textAlign: 'left',
                background: bg, border: `1px solid ${border}`,
                borderRadius: 'var(--r-md)', cursor: confirmed ? 'default' : 'pointer',
                transition: 'all var(--t-fast)', fontFamily: 'inherit', width: '100%'
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `1.5px solid ${letterColor}`, color: letterColor,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0
              }}>{String.fromCharCode(65 + idx)}</span>
              <span style={{ flex: 1, fontSize: 15, color: textColor, lineHeight: 1.5 }}>{opt}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {!confirmed ? (
        <button
          className="btn btn-primary btn-lg"
          onClick={() => selected !== null && setConfirmed(true)}
          disabled={selected === null}
          type="button"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {t('checkAnswer')}
        </button>
      ) : (
        <div>
          <div style={{
            padding: '14px 18px', borderRadius: 'var(--r-md)',
            background: isCorrect ? 'var(--success-soft)' : 'var(--danger-soft)',
            color: isCorrect ? 'var(--success)' : 'var(--danger)',
            fontSize: 14, fontWeight: 600, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <Icon name={isCorrect ? 'check-circle' : 'x-circle'} size={18} />
            {isCorrect ? t('correctSentence') : `${t('notQuitePrefix')} "${question.options[question.correct]}".`}
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={submit}
            type="button"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {q < questions.length - 1 ? t('nextQuestion') : t('seeResults')}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
