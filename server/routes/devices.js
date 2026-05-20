const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const devices = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
  res.json(devices);
});

router.post('/heartbeat', (req, res) => {
  const { id, name, role, lessonVersions } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'device id required' });
  }

  const versionsStr = JSON.stringify(lessonVersions || {});

  db.prepare(`
    INSERT INTO devices (id, name, role, last_seen, lesson_versions)
    VALUES (?, ?, ?, datetime('now'), ?)
    ON CONFLICT(id) DO UPDATE SET
      last_seen=datetime('now'),
      lesson_versions=excluded.lesson_versions,
      name=excluded.name,
      role=excluded.role
  `).run(id, name || null, role || 'student', versionsStr);

  res.json({ success: true });
});

module.exports = router;
