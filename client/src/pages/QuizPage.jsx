import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getLessonById, getQuizByLessonId, saveScore, getProfile } from '../db';
import Icon from '../components/Icon';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    return <div style={{ padding: 24, color: 'var(--lms-ink-muted)' }}>Loading…</div>;
  }

  const questions = quiz.questions || [];
  const question = questions[q];

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
    const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good progress' : 'Keep going';
    const tone = pct >= 80 ? 'ok' : pct >= 60 ? 'info' : 'warn';
    return (
      <div className="lms-page lms-quiz-result">
        <div className={`lms-result-hero ${tone}`}>
          <div className="lms-result-pct">{pct}%</div>
          <div className="lms-result-label">{label}</div>
          <div className="lms-result-sub">{done.score} out of {done.total} correct</div>
        </div>
        <div className="lms-card" style={{ marginTop: 24 }}>
          <div className="lms-card-head"><h2 className="lms-section-title">Answer review</h2></div>
          <ul className="lms-review-list">
            {questions.map((qq, i) => {
              const ok = done.answers[i] === qq.correct;
              return (
                <li key={i}>
                  <Icon name={ok ? 'check-circle' : 'x-circle'} size={20} color={ok ? 'var(--lms-ok)' : 'var(--lms-bad)'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lms-review-q">{qq.text}</div>
                    {!ok && (
                      <div className="lms-review-a">
                        Correct answer: <strong>{qq.options[qq.correct]}</strong>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="lms-result-actions">
          <button type="button" className="lms-pill-btn outline" onClick={() => navigate('/')}>
            Back to home
          </button>
          <button type="button" className="lms-pill-btn solid" onClick={() => navigate(`/lesson/${id}`)}>
            Review lesson
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = confirmed && selected === question.correct;
  const progressPct = ((q + (confirmed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="lms-page lms-quiz">
      <div className="lms-quiz-head">
        <span className="lms-lesson-eyebrow">{lesson.subject} · {lesson.title}</span>
        <span style={{ flex: 1 }} />
        <span className="lms-quiz-counter">Question {q + 1} of {questions.length}</span>
      </div>
      <div className="lms-quiz-progress"><div style={{ width: `${progressPct}%` }} /></div>
      <div className="lms-card lms-quiz-card">
        <div className="lms-quiz-q-eyebrow">QUESTION {q + 1}</div>
        <div className="lms-quiz-q">{question.text}</div>
        <div className="lms-quiz-options">
          {question.options.map((opt, idx) => {
            let cls = '';
            if (!confirmed && selected === idx) cls += ' selected';
            if (confirmed && idx === question.correct) cls += ' correct';
            if (confirmed && selected === idx && idx !== question.correct) cls += ' wrong';
            return (
              <button
                key={idx}
                type="button"
                className={`lms-quiz-option${cls}`}
                onClick={() => !confirmed && setSelected(idx)}
                disabled={confirmed}
              >
                <span className="lms-quiz-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="lms-quiz-opt-text">{opt}</span>
                {confirmed && idx === question.correct && (
                  <Icon name="check-circle" size={20} color="var(--lms-ok)" />
                )}
                {confirmed && selected === idx && idx !== question.correct && (
                  <Icon name="x-circle" size={20} color="var(--lms-bad)" />
                )}
              </button>
            );
          })}
        </div>
        {!confirmed ? (
          <button
            type="button"
            className="lms-pill-btn solid lg"
            disabled={selected === null}
            onClick={() => selected !== null && setConfirmed(true)}
          >
            Check answer
          </button>
        ) : (
          <>
            <div className={`lms-feedback ${isCorrect ? 'ok' : 'bad'}`}>
              <Icon name={isCorrect ? 'check-circle' : 'x-circle'} size={18} />
              {isCorrect ? 'Correct.' : `Not quite. The answer is "${question.options[question.correct]}".`}
            </div>
            <button type="button" className="lms-pill-btn solid lg" onClick={submit}>
              {q < questions.length - 1 ? 'Next question' : 'See results'} <Icon name="arrow-right" size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
