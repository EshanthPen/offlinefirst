const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const devices = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
  res.json(devices);
});

// list of recently-active device IDs (last 5 min), excluding the caller.
// clients call this to auto-discover peers without manual pairing.
router.get('/peers', (req, res) => {
  const self = req.query.self || '';
  const rows = db.prepare(`
    SELECT id, name, role, last_seen FROM devices
    WHERE last_seen > datetime('now', '-5 minutes')
      AND id != ?
    ORDER BY last_seen DESC
    LIMIT 50
  `).all(self);
  res.json({ peers: rows });
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

  // also return active peers so heartbeat doubles as a discovery call.
  const peers = db.prepare(`
    SELECT id, name, role FROM devices
    WHERE last_seen > datetime('now', '-5 minutes') AND id != ?
    ORDER BY last_seen DESC LIMIT 50
  `).all(id);

  res.json({ success: true, peers });
});

module.exports = router;
