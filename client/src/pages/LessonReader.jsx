import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLessonById, getAllScores, getQuizByLessonId } from '../db';
import Icon from '../components/Icon';
import FileGlyph from '../components/FileGlyph';
import { metaForLesson } from '../data/lmsData';

export default function LessonReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);

  useEffect(() => {
    (async () => {
      const [l, q, scores] = await Promise.all([getLessonById(id), getQuizByLessonId(id), getAllScores()]);
      setLesson(l ? (q ? { ...l, quiz: q } : l) : null);
      setCompleted(!!scores.find(s => s.lesson_id === id));
    })();
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [id]);

  if (!lesson) {
    return <div style={{ padding: 24, color: 'var(--lms-ink-muted)' }}>Loading…</div>;
  }

  const sections = lesson.content?.sections || [];
  const meta = metaForLesson(lesson);
  const tts = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = (text, idx) => {
    if (!tts) return;
    window.speechSynthesis.cancel();
    if (speakingIdx === idx) { setSpeakingIdx(null); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => setSpeakingIdx(null);
    u.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(u);
  };
  const readWhole = () => {
    const t = sections.filter(s => s.type === 'text' || s.type === 'heading' || s.type === 'example')
      .map(s => s.content).join('. ');
    speak(t, -1);
  };

  return (
    <div className="lms-page lms-lesson">
      <div className="lms-lesson-head">
        <button type="button" className="lms-text-btn" onClick={() => navigate(`/course/${lesson.id}`)}>
          <Icon name="chevron-left" size={16} /> Back
        </button>
        <span className="lms-lesson-eyebrow" style={{ color: meta.letterColor }}>
          {lesson.subject} · {lesson.grade_level}
        </span>
        {completed && (
          <span className="lms-chip ok">
            <Icon name="check-circle" size={14} /> Quiz completed
          </span>
        )}
        <span style={{ flex: 1 }} />
        {tts && (
          <button
            type="button"
            className={`lms-pill-btn outline${speakingIdx === -1 ? ' on' : ''}`}
            onClick={readWhole}
          >
            <Icon name={speakingIdx === -1 ? 'stop' : 'volume'} size={14} />
            {speakingIdx === -1 ? 'Stop' : 'Listen'}
          </button>
        )}
      </div>
      <h1 className="lms-lesson-title">{lesson.title}</h1>
      <div className="lms-lesson-body">
        {sections.map((s, i) => {
          if (s.type === 'heading') return <h2 key={i} className="lms-lesson-heading">{s.content}</h2>;
          if (s.type === 'text') return (
            <div key={i} className="lms-lesson-para">
              {tts && (
                <button
                  type="button"
                  className={`lms-listen-mini${speakingIdx === i ? ' on' : ''}`}
                  onClick={() => speak(s.content, i)}
                >
                  <Icon name={speakingIdx === i ? 'stop' : 'volume'} size={12} />
                  {speakingIdx === i ? 'Stop' : 'Listen'}
                </button>
              )}
              <p>{s.content}</p>
            </div>
          );
          if (s.type === 'example') return (
            <aside key={i} className="lms-callout">
              <div className="lms-callout-head">
                <span className="lms-callout-eyebrow">Example</span>
                {tts && (
                  <button
                    type="button"
                    className={`lms-listen-mini${speakingIdx === i ? ' on' : ''}`}
                    onClick={() => speak(s.content, i)}
                  >
                    <Icon name={speakingIdx === i ? 'stop' : 'volume'} size={12} />
                    {speakingIdx === i ? 'Stop' : 'Listen'}
                  </button>
                )}
              </div>
              <pre>{s.content}</pre>
            </aside>
          );
          if (s.type === 'diagram') return (
            <figure key={i} className="lms-figure" style={{ color: meta.letterColor || '#1967D2' }}>
              <div dangerouslySetInnerHTML={{ __html: s.svg }} />
              {s.label && <figcaption>{s.label}</figcaption>}
            </figure>
          );
          return null;
        })}
      </div>

      <div className="lms-lesson-cta">
        <FileGlyph type="quiz" size={36} />
        <div style={{ flex: 1 }}>
          <div className="lms-cta-title">{completed ? 'Retake the quiz' : 'Ready for the quiz?'}</div>
          <div className="lms-cta-sub">
            {completed
              ? 'Try again to improve your score. It saves locally.'
              : `${lesson.quiz?.questions?.length || 3} short questions. Unlimited attempts.`}
          </div>
        </div>
        <button type="button" className="lms-pill-btn solid" onClick={() => navigate(`/quiz/${id}`)}>
          {completed ? 'Retake quiz' : 'Start quiz'}
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
