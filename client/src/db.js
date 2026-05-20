import { openDB } from 'idb';

const DB_NAME = 'offlinefirst';
const DB_VERSION = 1;

let dbPromise = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('lessons')) {
          const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' });
          lessonStore.createIndex('subject', 'subject');
          lessonStore.createIndex('version', 'version');
        }
        if (!db.objectStoreNames.contains('quizzes')) {
          db.createObjectStore('quizzes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('scores')) {
          const scoreStore = db.createObjectStore('scores', { keyPath: 'id' });
          scoreStore.createIndex('synced', 'synced');
          scoreStore.createIndex('lesson_id', 'lesson_id');
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'key' });
        }
      }
    });
  }
  return dbPromise;
};

// Lessons
export const saveLessons = async (lessons) => {
  const db = await initDB();
  const tx = db.transaction('lessons', 'readwrite');
  await Promise.all(lessons.map(l => tx.store.put(l)));
  await tx.done;
};

export const getAllLessons = async () => {
  const db = await initDB();
  return db.getAll('lessons');
};

export const getLessonById = async (id) => {
  const db = await initDB();
  return db.get('lessons', id);
};

// Quizzes
export const saveQuizzes = async (quizzes) => {
  const db = await initDB();
  const tx = db.transaction('quizzes', 'readwrite');
  await Promise.all(quizzes.map(q => tx.store.put(q)));
  await tx.done;
};

export const getAllQuizzes = async () => {
  const db = await initDB();
  return db.getAll('quizzes');
};

export const getQuizByLessonId = async (lessonId) => {
  const db = await initDB();
  const all = await db.getAll('quizzes');
  return all.find(q => q.lesson_id === lessonId);
};

// Scores
export const saveScore = async (score) => {
  const db = await initDB();
  return db.put('scores', { ...score, synced: false });
};

export const getUnsyncedScores = async () => {
  const db = await initDB();
  const all = await db.getAll('scores');
  return all.filter(s => !s.synced);
};

export const markScoresSynced = async (ids) => {
  const db = await initDB();
  const tx = db.transaction('scores', 'readwrite');
  for (const id of ids) {
    const score = await tx.store.get(id);
    if (score) await tx.store.put({ ...score, synced: true });
  }
  await tx.done;
};

export const getAllScores = async () => {
  const db = await initDB();
  return db.getAll('scores');
};

// Profile
const PROFILE_KEYS = [
  'studentId', 'studentName', 'role',
  'grade', 'subjects', 'lang', 'a11y', 'paired', 'onboardedAt',
  'school'
];

export const getProfile = async () => {
  const db = await initDB();
  const out = {};
  for (const k of PROFILE_KEYS) {
    const row = await db.get('profile', k);
    if (row?.value !== undefined) out[k] = row.value;
  }
  return {
    studentId: out.studentId || null,
    studentName: out.studentName || 'Student',
    role: out.role || 'student',
    grade: out.grade || null,
    subjects: out.subjects || [],
    lang: out.lang || null,
    a11y: !!out.a11y,
    paired: !!out.paired,
    onboardedAt: out.onboardedAt || null,
    school: out.school || null
  };
};

export const clearProfile = async () => {
  const db = await initDB();
  const tx = db.transaction('profile', 'readwrite');
  for (const k of PROFILE_KEYS) {
    await tx.store.delete(k);
  }
  await tx.done;
};

export const saveProfile = async (profile) => {
  const db = await initDB();
  const tx = db.transaction('profile', 'readwrite');
  for (const [key, value] of Object.entries(profile)) {
    await tx.store.put({ key, value });
  }
  await tx.done;
};

// Sync utility
export const getLessonVersionManifest = async () => {
  const lessons = await getAllLessons();
  return lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.version }), {});
};

// Seed-on-first-run helper (when offline and never synced)
export const seedFromStaticIfEmpty = async (sampleLessons) => {
  const existing = await getAllLessons();
  if (existing.length > 0) return false;

  const lessons = sampleLessons.map(l => ({
    id: l.id,
    title: l.title,
    subject: l.subject,
    grade_level: l.grade_level,
    content: l.content,
    version: l.version || 1,
    published: 1
  }));
  await saveLessons(lessons);

  const quizzes = sampleLessons
    .filter(l => l.quiz?.questions)
    .map(l => ({
      id: 'quiz_' + l.id,
      lesson_id: l.id,
      questions: l.quiz.questions
    }));
  await saveQuizzes(quizzes);

  return true;
};
