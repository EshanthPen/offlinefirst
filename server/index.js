const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { sampleLessons } = require('./seedData');
const lessonsRouter = require('./routes/lessons');
const scoresRouter = require('./routes/scores');
const devicesRouter = require('./routes/devices');

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
          lesson.id,
          lesson.title,
          lesson.subject,
          lesson.grade_level,
          JSON.stringify(lesson.content)
        );
        if (lesson.quiz) {
          insertQuiz.run(
            'quiz_' + lesson.id,
            lesson.id,
            JSON.stringify(lesson.quiz.questions)
          );
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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/lessons', lessonsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/devices', devicesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/sync/bundle', (req, res) => {
  const { versions } = req.query;
  let knownVersions = {};
  try {
    knownVersions = versions ? JSON.parse(versions) : {};
  } catch (err) {
    knownVersions = {};
  }

  const allLessons = db.prepare('SELECT * FROM lessons WHERE published = 1').all();
  const allQuizzes = db.prepare('SELECT * FROM quizzes').all();

  const newLessons = allLessons.filter(l =>
    !knownVersions[l.id] || knownVersions[l.id] < l.version
  );

  res.json({
    lessons: newLessons,
    quizzes: allQuizzes.filter(q =>
      newLessons.find(l => l.id === q.lesson_id)
    ),
    timestamp: new Date().toISOString()
  });
});

// Serve built frontend if it exists (single-deployment mode)
const distPath = process.env.CLIENT_DIST || path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`Serving static frontend from ${distPath}`);
}

app.listen(PORT, () => {
  console.log(`OfflineFirst server running on port ${PORT}`);
});
