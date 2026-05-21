import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import { authedFetch } from '../auth';
import { triggerSync } from '../sync';
import { LMS_SUBJECTS, metaForLesson } from '../data/lmsData';

const EMPTY_LESSON = {
  title: '',
  subject: 'Mathematics',
  grade_level: 'Grade 5-6',
  content: { sections: [{ type: 'text', content: '' }] },
  quiz: { questions: [{ id: 'q1', text: '', options: ['', '', '', ''], correct: 0 }] },
  published: true
};

export default function TeacherContent() {
  const [lessons, setLessons] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_LESSON);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/lessons');
      if (res.ok) setLessons(await res.json());
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const startCreate = () => { setCreating(true); setEditing(null); setDraft(JSON.parse(JSON.stringify(EMPTY_LESSON))); };
  const startEdit = (l) => {
    setEditing(l.id); setCreating(false);
    setDraft({
      title: l.title,
      subject: l.subject,
      grade_level: l.grade_level,
      content: l.content || { sections: [] },
      quiz: l.quiz || { questions: [] },
      published: !!l.published
    });
  };
  const cancel = () => { setCreating(false); setEditing(null); setDraft(EMPTY_LESSON); };

  const save = async () => {
    if (!draft.title.trim()) return;
    setBusy(true);
    try {
      const url = editing ? `/api/lessons/${editing}` : '/api/lessons';
      const method = editing ? 'PUT' : 'POST';
      const res = await authedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      if (res.ok) {
        flash(editing ? 'Saved' : 'Created');
        await load();
        cancel();
        triggerSync();
      } else {
        flash('Save failed');
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    const res = await authedFetch(`/api/lessons/${id}`, { method: 'DELETE' });
    if (res.ok) { flash('Lesson deleted'); await load(); }
  };

  const addSection = (type) => setDraft(d => ({ ...d, content: { sections: [...d.content.sections, { type, content: '' }] } }));
  const updateSection = (i, content) => setDraft(d => ({ ...d, content: { sections: d.content.sections.map((s, idx) => idx === i ? { ...s, content } : s) } }));
  const removeSection = (i) => setDraft(d => ({ ...d, content: { sections: d.content.sections.filter((_, idx) => idx !== i) } }));

  const addQuestion = () => setDraft(d => ({
    ...d,
    quiz: {
      questions: [...d.quiz.questions, { id: 'q' + (d.quiz.questions.length + 1), text: '', options: ['', '', '', ''], correct: 0 }]
    }
  }));
  const updateQuestion = (i, patch) => setDraft(d => ({
    ...d,
    quiz: { questions: d.quiz.questions.map((q, idx) => idx === i ? { ...q, ...patch } : q) }
  }));
  const updateOption = (qi, oi, val) => setDraft(d => ({
    ...d,
    quiz: { questions: d.quiz.questions.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q) }
  }));
  const removeQuestion = (i) => setDraft(d => ({ ...d, quiz: { questions: d.quiz.questions.filter((_, idx) => idx !== i) } }));

  const isEditing = creating || editing;

  return (
    <div className="lms-page">
      <div className="lms-page-head-row">
        <div>
          <h1 className="lms-page-title">Content</h1>
          <p className="lms-page-sub">Lessons and quizzes. Edits sync to nearby devices.</p>
        </div>
        {!isEditing && (
          <button type="button" className="lms-pill-btn solid" onClick={startCreate}>
            <Icon name="plus" size={14} /> New lesson
          </button>
        )}
      </div>

      {msg && <div className="lms-toast"><Icon name="check-circle" size={14} /> {msg}</div>}

      {isEditing ? (
        <div className="lms-editor lms-card">
          <div className="lms-card-head">
            <h2 className="lms-section-title">{creating ? 'New lesson' : 'Edit lesson'}</h2>
            <span style={{ flex: 1 }} />
            <button type="button" className="lms-text-btn" onClick={cancel}>
              <Icon name="x" size={14} /> Cancel
            </button>
            <button type="button" className="lms-pill-btn solid" onClick={save} disabled={busy || !draft.title.trim()}>
              <Icon name="check" size={14} /> {creating ? 'Create lesson' : 'Save changes'}
            </button>
          </div>

          <div className="lms-editor-body">
            <div className="lms-editor-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
              <div>
                <label className="lms-field-label">Title</label>
                <input className="lms-text-field" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Lesson title" />
              </div>
              <div>
                <label className="lms-field-label">Subject</label>
                <select className="lms-text-field" value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}>
                  {LMS_SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="lms-field-label">Grade level</label>
                <input className="lms-text-field" value={draft.grade_level} onChange={e => setDraft(d => ({ ...d, grade_level: e.target.value }))} />
              </div>
            </div>

            <div className="lms-editor-section">
              <div className="lms-editor-section-head">
                <h3 className="lms-section-title" style={{ fontSize: 16 }}>Content sections</h3>
                <span style={{ flex: 1 }} />
                <button type="button" className="lms-text-btn" onClick={() => addSection('heading')}>
                  <Icon name="plus" size={14} /> Heading
                </button>
                <button type="button" className="lms-text-btn" onClick={() => addSection('text')}>
                  <Icon name="plus" size={14} /> Text
                </button>
                <button type="button" className="lms-text-btn" onClick={() => addSection('example')}>
                  <Icon name="plus" size={14} /> Example
                </button>
              </div>
              <div className="lms-section-list">
                {draft.content.sections.map((s, i) => (
                  <div key={i} className="lms-section-row">
                    <span className={`lms-section-tag ${s.type}`}>{s.type}</span>
                    <textarea
                      className="lms-text-field"
                      rows={s.type === 'heading' ? 1 : 3}
                      value={s.content}
                      onChange={e => updateSection(i, e.target.value)}
                      placeholder={s.type === 'heading' ? 'Section heading…' : s.type === 'example' ? 'Worked example…' : 'Paragraph…'}
                    />
                    <button type="button" className="lms-iconbtn small" onClick={() => removeSection(i)} title="Remove">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lms-editor-section">
              <div className="lms-editor-section-head">
                <h3 className="lms-section-title" style={{ fontSize: 16 }}>Quiz questions</h3>
                <span style={{ flex: 1 }} />
                <button type="button" className="lms-text-btn" onClick={addQuestion}>
                  <Icon name="plus" size={14} /> Add question
                </button>
              </div>
              <div className="lms-question-list">
                {draft.quiz.questions.map((q, qi) => (
                  <div key={qi} className="lms-question-card">
                    <div className="lms-question-head">
                      <span className="lms-question-num">Q{qi + 1}</span>
                      <input className="lms-text-field" value={q.text} onChange={e => updateQuestion(qi, { text: e.target.value })} placeholder="Question text" />
                      <button type="button" className="lms-iconbtn small" onClick={() => removeQuestion(qi)} title="Remove">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                    <div className="lms-option-list">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className={`lms-option-row${q.correct === oi ? ' correct' : ''}`}>
                          <input type="radio" name={`q-${qi}`} checked={q.correct === oi} onChange={() => updateQuestion(qi, { correct: oi })} />
                          <span className="lms-option-letter">{String.fromCharCode(65 + oi)}</span>
                          <input className="lms-text-field" value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lms-editor-section">
              <label className="lms-checkbox-row">
                <input type="checkbox" checked={draft.published} onChange={e => setDraft(d => ({ ...d, published: e.target.checked }))} />
                <span>
                  <strong>Publish to students</strong>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--lms-ink-muted)' }}>
                    Off = draft, only visible to you.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="lms-card">
          {lessons.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState title="No lessons" sub="Make one to share it with nearby devices." action="New lesson" onAction={startCreate} />
            </div>
          ) : (
            lessons.map((l, i, arr) => {
              const meta = metaForLesson(l);
              return (
                <div
                  key={l.id}
                  className="lms-lesson-row"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--lms-rule)' : 'none' }}
                >
                  <span className="lms-course-pip" style={{ background: meta.letterColor || '#5F6368' }}>
                    {l.subject[0]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{l.title}</div>
                    <div className="lms-list-row-muted">
                      {l.subject} · {l.grade_level} · {l.content?.sections?.length || 0} sections · {l.quiz?.questions?.length || 0} Q
                      {l.published ? '' : ' · DRAFT'}
                    </div>
                  </div>
                  <button type="button" className="lms-iconbtn small" onClick={() => startEdit(l)} title="Edit">
                    <Icon name="edit" size={16} />
                  </button>
                  <button type="button" className="lms-iconbtn small" onClick={() => remove(l.id)} title="Delete">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
