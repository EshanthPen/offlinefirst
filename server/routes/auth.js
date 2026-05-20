const express = require('express');
const router = express.Router();
const { AUTH_ENABLED, checkPin, issueTeacherToken } = require('../auth');

router.get('/status', (req, res) => {
  res.json({ authEnabled: AUTH_ENABLED });
});

router.post('/teacher', (req, res) => {
  const { pin } = req.body || {};

  if (!AUTH_ENABLED) {
    // Back-compat: if no PIN configured, just hand out a token freely.
    return res.json({ token: issueTeacherToken(), authEnabled: false });
  }

  if (!checkPin(pin)) {
    return res.status(401).json({ error: 'incorrect_pin' });
  }

  res.json({ token: issueTeacherToken(), authEnabled: true });
});

module.exports = router;
