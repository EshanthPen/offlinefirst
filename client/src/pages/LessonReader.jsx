import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById, getAllScores } from '../db';
import Icon from '../components/Icon';
import ListenButton from '../components/ListenButton';
import { useT } from '../i18n';

const SUBJ_ACCENT = {
  Mathematics: 'var(--subj-math)',
  Science:     'var(--subj-science)',
  Literacy:    'var(--subj-literacy)'
};

export default function LessonReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useT();
  const [lesson, setLesson] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const articleRef = useRef(null);

  useEffect(() => {
    (async () => {
      const l = await getLessonById(id);
      setLesson(l);
      const scores = await getAllScores();
      setCompleted(!!scores.find(s => s.lesson_id === id));
    })();
  }, [id]);

  useEffect(() => {
    const scroller = document.querySelector('.app-content');
    const onScroll = () => {
      if (!scroller || !articleRef.current) return;
      const a = articleRef.current;
      const aTop = a.offsetTop;
      const aH = a.offsetHeight;
      const winH = scroller.clientHeight;
      const pos = scroller.scrollTop - aTop + winH;
      setProgress(Math.max(0, Math.min(100, (pos / aH) * 100)));
    };
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller?.removeEventListener('scroll', onScroll);
  }, [lesson?.id]);

  useEffect(() => () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); }, []);

  const speak = (text, idx) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speakingIdx === idx) { setSpeakingIdx(null); return; }
    const u = new SpeechSynthesisUtterance(text);
    const langMap = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', sw: 'sw-KE' };
    u.lang = langMap[lang] || 'en-US';
    u.rate = 0.95;
    u.onend = () => setSpeakingIdx(null);
    u.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(u);
  };

  if (!lesson) {
    return (
      <div style={{ color: 'var(--ink-muted)', textAlign: 'center', padding: 'var(--s-12)' }}>
        {t('initializing')}
      </div>
    );
  }

  const sections = lesson.content?.sections || [];
  const accent = SUBJ_ACCENT[lesson.subject] || 'var(--brand)';
  const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const readWhole = () => {
    const text = sections
      .filter(s => s.type === 'text' || s.type === 'heading' || s.type === 'example')
      .map(s => s.content)
      .join('. ');
    speak(text, -1);
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 240, right: 0, height: 3,
        background: 'transparent', zIndex: 11, pointerEvents: 'none'
      }}>
        <div style={{ height: '100%', width: `${progress}%`, background: accent, transition: 'width 80ms linear' }} />
      </div>

      <article ref={articleRef} style={{ maxWidth: 720, margin: '0 auto' }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/courses')}
          style={{ padding: '6px 10px', marginBottom: 'var(--s-6)' }}
          type="button"
        >
          <Icon name="arrow-left" size={15} />
          {t('backToCourses')}
        </button>

        <div style={{ marginBottom: 'var(--s-8)' }}>
          <div className="eyebrow" style={{ color: accent, marginBottom: 10 }}>
            {lesson.subject} · {lesson.grade_level}
          </div>
          <h1 className="hero" style={{ marginBottom: 'var(--s-4)' }}>{lesson.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--ink-muted)', fontSize: 14, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={14} /> ~6 {t('minRead')}
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="layers" size={14} /> {sections.length} {t('sectionsLabel')}
            </span>
            {completed && (
              <>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontWeight: 600 }}>
                  <Icon name="check-circle" size={14} /> {t('quizCompletedLabel')}
                </span>
              </>
            )}
            <span style={{ marginLeft: 'auto' }}>
              {ttsAvailable && <ListenButton size="lg" active={speakingIdx === -1} onClick={readWhole} />}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--s-12)' }}>
          {sections.map((s, i) => {
            if (s.type === 'heading') {
              return (
                <h2
                  key={i}
                  style={{
                    fontSize: 26, fontWeight: 500,
                    marginTop: 'var(--s-10)', marginBottom: 'var(--s-3)',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {s.content}
                </h2>
              );
            }
            if (s.type === 'text') {
              return (
                <div key={i} style={{ marginBottom: 'var(--s-4)' }}>
                  {ttsAvailable && (
                    <div style={{ marginBottom: 6 }}>
                      <ListenButton active={speakingIdx === i} onClick={() => speak(s.content, i)} />
                    </div>
                  )}
                  <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink)', margin: 0 }}>{s.content}</p>
                </div>
              );
            }
            if (s.type === 'example') {
              return (
                <aside
                  key={i}
                  style={{
                    background: 'var(--brand-soft)',
                    borderRadius: 'var(--r-md)',
                    padding: 'var(--s-5) var(--s-6)',
                    marginBottom: 'var(--s-5)',
                    borderLeft: `3px solid ${accent}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="eyebrow" style={{ color: accent }}>{t('exampleEyebrow')}</div>
                    {ttsAvailable && <ListenButton active={speakingIdx === i} onClick={() => speak(s.content, i)} />}
                  </div>
                  <pre style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.7, color: 'var(--ink)', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {s.content}
                  </pre>
                </aside>
              );
            }
            if (s.type === 'diagram') {
              return (
                <figure
                  key={i}
                  style={{
                    margin: '0 0 var(--s-5)', padding: 'var(--s-5) var(--s-6)',
                    background: 'var(--surface-2)', border: '1px solid var(--rule)',
                    borderRadius: 'var(--r-md)', color: accent
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: s.svg }} />
                  {s.label && (
                    <figcaption style={{
                      marginTop: 10, fontSize: 12, color: 'var(--ink-muted)',
                      textAlign: 'center', letterSpacing: '0.04em',
                      textTransform: 'uppercase', fontWeight: 600
                    }}>
                      {s.label}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return null;
          })}
        </div>

        <div className="card card-pad-lg" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-6)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--r-md)',
            background: 'var(--brand-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent, flexShrink: 0
          }}>
            <Icon name="check-thin" size={28} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{completed ? t('retakeTheQuiz') : t('readyForQuiz')}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
              {completed
                ? t('retakeBlurb')
                : `${lesson.quiz?.questions?.length || 3} ${t('quizPromptCount')}`}
            </div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/quiz/${id}`)}
            type="button"
          >
            {completed ? t('retakeQuiz') : t('startQuiz')}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </article>
    </>
  );
}
