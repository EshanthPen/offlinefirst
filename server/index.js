const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { sampleLessons } = require('./seedData');
const { AUTH_ENABLED } = require('./auth');
const { startScheduledBackups } = require('./backup');
const lessonsRouter = require('./routes/lessons');
const scoresRouter = require('./routes/scores');
const devicesRouter = require('./routes/devices');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const seedDB = () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM lessons').get();
  if (count.c === 0) {
    console.log('Seeding sample lessons...');
    const insertLesson = db.prepare(`
      INSERT INTO lessons (id, title, subject, grade_level, content, version, published)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `);
    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (id, lesson_id, questions) VALUES (?, ?, ?)
    `);
    const seed = db.transaction(() => {
      for (const lesson of sampleLessons) {
        insertLesson.run(
          lesson.id, lesson.title, lesson.subject,
          lesson.grade_level, JSON.stringify(lesson.content)
        );
        if (lesson.quiz) {
          insertQuiz.run('quiz_' + lesson.id, lesson.id, JSON.stringify(lesson.quiz.questions));
        }
      }
    });
    seed();
    console.log(`Seeded ${sampleLessons.length} lessons.`);
  }
};

seedDB();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS allowlist via env var ---------------------------------------
// ALLOWED_ORIGINS = comma-separated list of allowed origins.
// If unset, allow all origins (back-compat).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length > 0
  ? {
      origin(origin, cb) {
        // allow same-origin requests (no Origin header) and listed origins
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Origin not allowed by CORS'));
      },
      credentials: false
    }
  : {};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// --- Lightweight rate limiter for score sync --------------------------
// Prevents a malicious peer from spamming hundreds of fake scores.
// 60 sync calls / minute / IP is plenty for legitimate use.
const SYNC_WINDOW_MS = 60_000;
const SYNC_MAX = 60;
const syncHits = new Map(); // ip -> array of timestamps

function rateLimitSync(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const hits = (syncHits.get(ip) || []).filter(t => now - t < SYNC_WINDOW_MS);
  hits.push(now);
  syncHits.set(ip, hits);
  if (hits.length > SYNC_MAX) {
    return res.status(429).json({ error: 'rate_limited', retryAfterMs: SYNC_WINDOW_MS });
  }
  next();
}

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/scores', (req, res, next) => {
  if (req.method === 'POST') return rateLimitSync(req, res, next);
  next();
}, scoresRouter);
app.use('/api/devices', devicesRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    authEnabled: AUTH_ENABLED,
    corsAllowlist: allowedOrigins.length > 0 ? allowedOrigins : 'all'
  });
});

app.get('/api/sync/bundle', (req, res) => {
  const { versions } = req.query;
  let knownVersions = {};
  try { knownVersions = versions ? JSON.parse(versions) : {}; } catch { knownVersions = {}; }

  const allLessons = db.prepare('SELECT * FROM lessons WHERE published = 1').all();
  const allQuizzes = db.prepare('SELECT * FROM quizzes').all();

  const newLessons = allLessons.filter(l =>
    !knownVersions[l.id] || knownVersions[l.id] < l.version
  );

  res.json({
    lessons: newLessons,
    quizzes: allQuizzes.filter(q => newLessons.find(l => l.id === q.lesson_id)),
    timestamp: new Date().toISOString()
  });
});

const distPath = process.env.CLIENT_DIST || path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`Serving static frontend from ${distPath}`);
}

startScheduledBackups();

app.listen(PORT, () => {
  console.log(`OfflineFirst server running on port ${PORT}`);
  if (AUTH_ENABLED) {
    console.log('Teacher auth: ENABLED (TEACHER_PIN required for /admin and lesson writes)');
  } else {
    console.warn('Teacher auth: DISABLED (no TEACHER_PIN env var set — anyone can edit lessons).');
    console.warn('  Set TEACHER_PIN in production to lock down the Teacher view.');
  }
  if (allowedOrigins.length > 0) {
    console.log(`CORS: restricted to ${allowedOrigins.join(', ')}`);
  } else {
    console.warn('CORS: open to all origins (set ALLOWED_ORIGINS to restrict).');
  }
});
