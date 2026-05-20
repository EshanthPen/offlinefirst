const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const scores = db.prepare(`
    SELECT s.*, l.title as lesson_title, l.subject
    FROM scores s
    LEFT JOIN lessons l ON s.lesson_id = l.id
    ORDER BY s.synced_at DESC
  `).all();
  res.json(scores);
});

router.post('/sync', (req, res) => {
  const { scores } = req.body;

  if (!Array.isArray(scores) || scores.length === 0) {
    return res.json({ success: true, synced: 0 });
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO scores
    (id, student_id, student_name, lesson_id, quiz_id, answers, score, total, completed_at, device_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const s of rows) {
      insert.run(
        s.id,
        s.student_id,
        s.student_name || null,
        s.lesson_id,
        s.quiz_id,
        typeof s.answers === 'string' ? s.answers : JSON.stringify(s.answers),
        s.score,
        s.total,
        s.completed_at,
        s.device_id || null
      );
    }
  });

  insertMany(scores);
  res.json({ success: true, synced: scores.length });
});

module.exports = router;
