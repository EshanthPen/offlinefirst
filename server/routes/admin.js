const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireTeacher } = require('../auth');

// Export everything as a JSON dump. Teacher token required.
router.get('/export', requireTeacher, (req, res) => {
  const lessons = db.prepare('SELECT * FROM lessons').all().map(l => ({
    ...l,
    content: safeParse(l.content),
    published: !!l.published
  }));
  const quizzes = db.prepare('SELECT * FROM quizzes').all().map(q => ({
    ...q,
    questions: safeParse(q.questions)
  }));
  const scores = db.prepare('SELECT * FROM scores').all().map(s => ({
    ...s,
    answers: safeParse(s.answers)
  }));
  const devices = db.prepare('SELECT * FROM devices').all().map(d => ({
    ...d,
    lesson_versions: safeParse(d.lesson_versions)
  }));

  const ts = new Date().toISOString();
  res.set('Content-Disposition', `attachment; filename="offlinefirst-backup-${ts.slice(0, 10)}.json"`);
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify({
    version: 1,
    exportedAt: ts,
    counts: {
      lessons: lessons.length,
      quizzes: quizzes.length,
      scores: scores.length,
      devices: devices.length
    },
    lessons, quizzes, scores, devices
  }, null, 2));
});

// merges by primary key; existing rows are replaced
router.post('/import', requireTeacher, (req, res) => {
  const dump = req.body;
  if (!dump || typeof dump !== 'object') {
    return res.status(400).json({ error: 'invalid_dump' });
  }

  const counts = { lessons: 0, quizzes: 0, scores: 0, devices: 0 };

  const insertLesson = db.prepare(`
    INSERT OR REPLACE INTO lessons (id, title, subject, grade_level, content, version, published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), COALESCE(?, datetime('now')))
  `);
  const insertQuiz = db.prepare(`INSERT OR REPLACE INTO quizzes (id, lesson_id, questions) VALUES (?, ?, ?)`);
  const insertScore = db.prepare(`
    INSERT OR REPLACE INTO scores
    (id, student_id, student_name, lesson_id, quiz_id, answers, score, total, completed_at, synced_at, device_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?)
  `);
  const insertDevice = db.prepare(`
    INSERT OR REPLACE INTO devices (id, name, last_seen, lesson_versions, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const importAll = db.transaction(() => {
    for (const l of dump.lessons || []) {
      insertLesson.run(
        l.id, l.title, l.subject, l.grade_level,
        typeof l.content === 'string' ? l.content : JSON.stringify(l.content),
        l.version || 1, l.published ? 1 : 0,
        l.created_at || null, l.updated_at || null
      );
      counts.lessons++;
    }
    for (const q of dump.quizzes || []) {
      insertQuiz.run(
        q.id, q.lesson_id,
        typeof q.questions === 'string' ? q.questions : JSON.stringify(q.questions)
      );
      counts.quizzes++;
    }
    for (const s of dump.scores || []) {
      insertScore.run(
        s.id, s.student_id, s.student_name || null, s.lesson_id, s.quiz_id,
        typeof s.answers === 'string' ? s.answers : JSON.stringify(s.answers),
        s.score, s.total, s.completed_at, s.synced_at || null, s.device_id || null
      );
      counts.scores++;
    }
    for (const d of dump.devices || []) {
      insertDevice.run(
        d.id, d.name || null, d.last_seen || null,
        typeof d.lesson_versions === 'string' ? d.lesson_versions : JSON.stringify(d.lesson_versions || {}),
        d.role || 'student'
      );
      counts.devices++;
    }
  });
  importAll();

  res.json({ success: true, imported: counts });
});

function safeParse(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return v; }
}

module.exports = router;
