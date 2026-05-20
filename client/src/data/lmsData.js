// LMS UI helpers. All data comes from the real IndexedDB lessons + scores;
// only the subject-color mapping is fixed.

const SUBJECT_COLOR = {
  Mathematics: '#1967D2',
  Science:     '#1E8E3E',
  Literacy:    '#E8710A',
  History:     '#9334E6',
  Geography:   '#12B5CB',
  Health:      '#D93025'
};

export const LMS_SUBJECTS = ['Mathematics', 'Science', 'Literacy', 'History', 'Geography', 'Health'];

// Per-lesson display meta. Color is derived from subject. No fake instructor
// names: the server doesn't track authorship.
export function metaForLesson(lesson) {
  if (!lesson) return {};
  const color = SUBJECT_COLOR[lesson.subject] || '#5F6368';
  return {
    bannerColor: color,
    letterColor: color
  };
}

// Activity post per real lesson in IDB.
export function buildPosts(lessons) {
  return lessons.map(l => {
    const meta = metaForLesson(l);
    const firstText = l.content?.sections?.find(s => s.type === 'text');
    const body = firstText
      ? (firstText.content.length > 180 ? firstText.content.slice(0, 180).trim() + '…' : firstText.content)
      : '';
    return {
      id: 'p_' + l.id,
      author_color: meta.bannerColor,
      course_id: l.id,
      course_name: `${l.subject} · ${l.grade_level}`,
      kind: 'lesson_posted',
      kind_label: 'Lesson available',
      time: new Date(l.updated_at || l.created_at || Date.now()).toLocaleString(),
      body,
      attachment: {
        type: 'lesson',
        name: l.title,
        sub: `Lesson · ${l.content?.sections?.length || 0} sections`,
        lesson_id: l.id
      }
    };
  });
}

// To-do from real quizzes the student hasn't taken yet.
export function buildTodo(lessons, scores) {
  const takenIds = new Set(scores.map(s => s.lesson_id));
  const upcoming = lessons
    .filter(l => l.quiz?.questions?.length && !takenIds.has(l.id))
    .map(l => {
      const meta = metaForLesson(l);
      return {
        id: 'u_' + l.id,
        course: l.subject,
        course_color: meta.letterColor,
        title: `${l.title} — Quiz`,
        due: 'Anytime',
        lesson_id: l.id
      };
    });
  return { overdue: [], upcoming };
}

// Calendar events from the same set.
export function buildEvents(lessons, scores) {
  const todo = buildTodo(lessons, scores);
  return todo.upcoming.map(u => ({
    date: 'Anytime',
    items: [{ label: u.title + ' available', kind: 'quiz', sub: u.course }]
  }));
}

// Recently completed quizzes.
export function buildRecent(lessons, scores) {
  return scores
    .slice()
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 5)
    .map(s => {
      const l = lessons.find(x => x.id === s.lesson_id);
      return {
        course: l?.subject || s.lesson_id,
        title: (l?.title || 'Quiz') + ' — Quiz',
        when: new Date(s.completed_at).toLocaleDateString(),
        score: `${s.score}/${s.total}`
      };
    });
}
