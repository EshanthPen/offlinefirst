const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { requireTeacher } = require('../auth');

router.get('/', (req, res) => {
  const lessons = db.prepare('SELECT * FROM lessons WHERE published = 1 ORDER BY subject, grade_level').all();
  const quizzes = db.prepare('SELECT * FROM quizzes').all();

  const result = lessons.map(l => {
    const quiz = quizzes.find(q => q.lesson_id === l.id);
    return {
      ...l,
      content: JSON.parse(l.content),
      quiz: quiz ? { ...quiz, questions: JSON.parse(quiz.questions) } : null
    };
  });

  res.json(result);
});

router.post('/', requireTeacher, (req, res) => {
  const { title, subject, grade_level, content, quiz } = req.body;
  const lessonId = uuidv4();

  db.prepare(`
    INSERT INTO lessons (id, title, subject, grade_level, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(lessonId, title, subject, grade_level, JSON.stringify(content));

  if (quiz && quiz.questions) {
    db.prepare(`
      INSERT INTO quizzes (id, lesson_id, questions) VALUES (?, ?, ?)
    `).run(uuidv4(), lessonId, JSON.stringify(quiz.questions));
  }

  res.json({ success: true, id: lessonId });
});

router.put('/:id', requireTeacher, (req, res) => {
  const { title, subject, grade_level, content, published, quiz } = req.body;

  db.prepare(`
    UPDATE lessons
    SET title=?, subject=?, grade_level=?, content=?, published=?,
        version=version+1, updated_at=datetime('now')
    WHERE id=?
  `).run(title, subject, grade_level, JSON.stringify(content), published ? 1 : 0, req.params.id);

  if (quiz && quiz.questions) {
    const existing = db.prepare('SELECT id FROM quizzes WHERE lesson_id=?').get(req.params.id);
    if (existing) {
      db.prepare('UPDATE quizzes SET questions=? WHERE lesson_id=?')
        .run(JSON.stringify(quiz.questions), req.params.id);
    } else {
      db.prepare('INSERT INTO quizzes (id, lesson_id, questions) VALUES (?, ?, ?)')
        .run(uuidv4(), req.params.id, JSON.stringify(quiz.questions));
    }
  }

  res.json({ success: true });
});

router.delete('/:id', requireTeacher, (req, res) => {
  db.prepare('DELETE FROM lessons WHERE id=?').run(req.params.id);
  db.prepare('DELETE FROM quizzes WHERE lesson_id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
