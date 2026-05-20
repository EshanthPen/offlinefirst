import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import Icon from '../components/Icon';
import { triggerSync } from '../sync';
import { authedFetch } from '../auth';
import { useT } from '../i18n';

const SUBJECTS = ['Mathematics', 'Science', 'Literacy', 'History', 'Geography', 'Health'];

const SUBJ_ACCENT = {
  Mathematics: 'var(--subj-math)',
  Science:     'var(--subj-science)',
  Literacy:    'var(--subj-literacy)'
};

const EMPTY = {
  title: '',
  subject: 'Mathematics',
  grade_level: 'Grade 5-6',
  content: { sections: [{ type: 'text', content: '' }] },
  quiz: { questions: [{ id: 'q1', text: '', options: ['', '', '', ''], correct: 0 }] },
  published: true
};

function Field({ label, children }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

export default function TeacherContent() {
  const { t } = useT();
  const [lessons, setLessons] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      const res = await fetch('/api/lessons');
      if (res.ok) setLessons(await res.json());
    } catch (err) {}
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => { setCreating(true); setEditing(null); setDraft(JSON.parse(JSON.stringify(EMPTY))); };
  const startEdit = (l) => {
    setEditing(l.id); setCreating(false);
    setDraft({
      title: l.title, subject: l.subject, grade_level: l.grade_level,
      content: l.content || { sections: [] },
      quiz: l.quiz || { questions: [] },
      published: !!l.published
    });
  };
  const cancel = () => { setCreating(false); setEditing(null); setDraft(EMPTY); };

  const save = async () => {
    setBusy(true);
    try {
      const url = editing ? `/api/lessons/${editing}` : '/api/lessons';
      const method = editing ? 'PUT' : 'POST';
      const res = await authedFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      if (res.ok) {
        setMsg(editing ? t('lessonSaved') : t('lessonCreated'));
        await load();
        cancel();
        triggerSync();
      } else {
        setMsg('Save failed');
      }
    } catch (err) {
      setMsg('Save failed: ' + err.message);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('deleteConfirm'))) return;
    setBusy(true);
    try {
      const res = await authedFetch(`/api/lessons/${id}`, { method: 'DELETE' });
      if (res.ok) { setMsg(t('lessonDeleted')); await load(); }
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const exportAll = () => {
    const data = lessons.map(l => ({
      title: l.title, subject: l.subject, grade_level: l.grade_level,
      content: l.content, quiz: l.quiz
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offlinefirst-lessons-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      let imported = [];
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        imported = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.endsWith('.csv')) {
        const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
        imported = data.map(row => parseCsvRow(row));
      }
      let n = 0;
      for (const l of imported) {
        if (!l?.title) continue;
        const res = await authedFetch('/api/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: l.title,
            subject: l.subject || 'Mathematics',
            grade_level: l.grade_level || 'Grade 5-6',
            content: l.content || { sections: [{ type: 'text', content: '' }] },
            quiz: l.quiz || { questions: [] }
          })
        });
        if (res.ok) n++;
      }
      setMsg(`Imported ${n} lesson${n !== 1 ? 's' : ''}`);
      await load();
      triggerSync();
    } catch (err) {
      setMsg('Import failed: ' + err.message);
    } finally {
      setBusy(false);
      event.target.value = '';
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const parseCsvRow = (row) => {
    const sections = [];
    if (row.content) sections.push({ type: 'text', content: row.content });
    const questions = [];
    for (let i = 1; i <= 10; i++) {
      const qText = row[`q${i}`];
      if (!qText) continue;
      const opts = [row[`q${i}_a`], row[`q${i}_b`], row[`q${i}_c`], row[`q${i}_d`]].filter(Boolean);
      const correctIdx = ['A','B','C','D'].indexOf((row[`q${i}_correct`] || '').toString().toUpperCase());
      questions.push({
        id: `q${i}`,
        text: qText,
        options: opts.length === 4 ? opts : ['', '', '', ''],
        correct: correctIdx >= 0 ? correctIdx : 0
      });
    }
    return {
      title: row.title,
      subject: row.subject || 'Mathematics',
      grade_level: row.grade_level || 'Grade 5-6',
      content: { sections },
      quiz: { questions }
    };
  };

  const addSection = (type) => setDraft(d => ({ ...d, content: { sections: [...d.content.sections, { type, content: '' }] } }));
  const updateSection = (i, content) => setDraft(d => ({ ...d, content: { sections: d.content.sections.map((s, idx) => idx === i ? { ...s, content } : s) } }));
  const removeSection = (i) => setDraft(d => ({ ...d, content: { sections: d.content.sections.filter((_, idx) => idx !== i) } }));

  const addQuestion = () => setDraft(d => ({
    ...d,
    quiz: { questions: [...d.quiz.questions, { id: 'q' + (d.quiz.questions.length + 1), text: '', options: ['', '', '', ''], correct: 0 }] }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="hero">{t('contentLibrary')}</h1>
          <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>Author lessons and quizzes. Changes sync to all connected devices.</p>
        </div>
        {!isEditing && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleImport} style={{ display: 'none' }} />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} type="button">
              <Icon name="upload" size={15} /> {t('importLabel')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={exportAll}
              disabled={lessons.length === 0}
              type="button"
            >
              <Icon name="download" size={15} /> {t('exportLabel')}
            </button>
            <button className="btn btn-primary" onClick={startCreate} type="button">
              <Icon name="plus" size={15} /> {t('newLesson')}
            </button>
          </div>
        )}
      </header>

      {msg && (
        <div className="card card-pad" style={{ background: 'var(--brand-soft)', borderColor: 'var(--brand-soft)', color: 'var(--brand)', padding: '12px 16px' }}>
          {msg}
        </div>
      )}

      {isEditing ? (
        <div className="card card-pad-lg" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 className="h2">{creating ? t('newLesson') : t('saveChanges')}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Field label={t('titleField')}>
              <input className="text-input" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={{ width: '100%' }} />
            </Field>
            <Field label={t('subjectField')}>
              <select className="text-input" value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} style={{ width: '100%' }}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={t('gradeLevelField')}>
              <input className="text-input" value={draft.grade_level} onChange={e => setDraft(d => ({ ...d, grade_level: e.target.value }))} style={{ width: '100%' }} />
            </Field>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 12 }}>{t('contentSections')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {draft.content.sections.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                    color: s.type === 'heading' ? 'var(--brand)' : s.type === 'example' ? 'var(--warning)' : 'var(--ink-muted)',
                    background: 'var(--surface-2)', border: '1px solid var(--rule)',
                    padding: '6px 10px', borderRadius: 'var(--r-sm)',
                    flexShrink: 0, textTransform: 'uppercase', marginTop: 4
                  }}>{s.type}</span>
                  <textarea
                    className="text-input"
                    value={s.content}
                    onChange={e => updateSection(i, e.target.value)}
                    rows={s.type === 'heading' ? 1 : 3}
                    style={{ flex: 1, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  />
                  <button className="iconbtn" onClick={() => removeSection(i)} type="button">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => addSection('heading')} type="button">
                <Icon name="plus" size={13} /> {t('addHeading')}
              </button>
              <button className="btn btn-ghost" onClick={() => addSection('text')} type="button">
                <Icon name="plus" size={13} /> {t('addText')}
              </button>
              <button className="btn btn-ghost" onClick={() => addSection('example')} type="button">
                <Icon name="plus" size={13} /> {t('addExample')}
              </button>
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 12 }}>{t('quizQuestions')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {draft.quiz.questions.map((q, qi) => (
                <div key={qi} style={{ background: 'var(--surface-2)', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span className="label" style={{ color: 'var(--brand)' }}>Q{qi + 1}</span>
                    <input className="text-input" value={q.text} onChange={e => updateQuestion(qi, { text: e.target.value })} style={{ flex: 1 }} />
                    <button className="iconbtn" onClick={() => removeQuestion(qi)} type="button">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <input
                        type="radio"
                        name={`q-${qi}-correct`}
                        checked={q.correct === oi}
                        onChange={() => updateQuestion(qi, { correct: oi })}
                        style={{ accentColor: 'var(--brand)' }}
                      />
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: q.correct === oi ? 'var(--brand)' : 'var(--ink-faint)',
                        minWidth: 14
                      }}>{String.fromCharCode(65 + oi)}</span>
                      <input className="text-input" value={opt} onChange={e => updateOption(qi, oi, e.target.value)} style={{ flex: 1 }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={addQuestion} style={{ marginTop: 12 }} type="button">
              <Icon name="plus" size={13} /> {t('addQuestion')}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="published-cb"
              checked={draft.published}
              onChange={e => setDraft(d => ({ ...d, published: e.target.checked }))}
              style={{ accentColor: 'var(--brand)' }}
            />
            <label htmlFor="published-cb" className="label">{t('publishedLabel')}</label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={save} disabled={busy || !draft.title.trim()} type="button">
              <Icon name="save" size={15} /> {creating ? t('create') : t('saveChanges')}
            </button>
            <button className="btn btn-secondary" onClick={cancel} type="button">
              <Icon name="x" size={15} /> {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {lessons.length === 0 ? (
            <div style={{ padding: 'var(--s-12)', textAlign: 'center', color: 'var(--ink-muted)' }}>
              {t('noLessonsYet')}
            </div>
          ) : (
            lessons.map((l, i) => {
              const accent = SUBJ_ACCENT[l.subject] || 'var(--brand)';
              return (
                <div key={l.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < lessons.length - 1 ? '1px solid var(--rule)' : 'none'
                }}>
                  <div style={{ width: 6, height: 36, borderRadius: 3, background: accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>
                      <span className="eyebrow" style={{ color: accent }}>{l.subject}</span>
                      <span style={{ margin: '0 6px' }}>·</span>
                      {l.grade_level} · v{l.version} · {(l.content?.sections || []).length} {t('sectionsCount')} · {(l.quiz?.questions || []).length} Q
                    </div>
                  </div>
                  <button className="iconbtn" title={t('edit')} onClick={() => startEdit(l)} type="button">
                    <Icon name="edit" size={14} />
                  </button>
                  <button className="iconbtn" title="Delete" onClick={() => remove(l.id)} type="button">
                    <Icon name="trash" size={14} />
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
