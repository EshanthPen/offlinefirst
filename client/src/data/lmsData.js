// Static LMS fixtures. Posts/events/people don't live in the real backend
// (it only stores lessons + quizzes + scores), so we derive these from lesson
// content for the LMS chrome.

export const LMS_COURSE_META = {
  'lesson-math-001': {
    bannerColor: '#1967D2',
    instructor: 'Ms. Adeyemi',
    instructorInitial: 'A',
    section: 'Period 3',
    letterColor: '#1967D2'
  },
  'lesson-sci-001': {
    bannerColor: '#1E8E3E',
    instructor: 'Mr. Okafor',
    instructorInitial: 'O',
    section: 'Period 5',
    letterColor: '#1E8E3E'
  },
  'lesson-lit-001': {
    bannerColor: '#E8710A',
    instructor: 'Mrs. Nwosu',
    instructorInitial: 'N',
    section: 'Period 2',
    letterColor: '#E8710A'
  }
};

const SUBJECT_COLOR = {
  Mathematics: '#1967D2',
  Science:     '#1E8E3E',
  Literacy:    '#E8710A',
  History:     '#9334E6',
  Geography:   '#12B5CB',
  Health:      '#D93025'
};

// Build a "meta" object for any lesson, including ones the teacher creates
// later that don't have an entry in LMS_COURSE_META above.
export function metaForLesson(lesson) {
  if (!lesson) return {};
  if (LMS_COURSE_META[lesson.id]) return LMS_COURSE_META[lesson.id];
  const color = SUBJECT_COLOR[lesson.subject] || '#5F6368';
  return {
    bannerColor: color,
    letterColor: color,
    instructor: 'Your teacher',
    instructorInitial: 'T',
    section: lesson.grade_level
  };
}

// Build a post for every lesson the teacher has published.
export function buildPosts(lessons) {
  return lessons.map(l => {
    const meta = metaForLesson(l);
    const firstText = l.content?.sections?.find(s => s.type === 'text');
    const body = firstText
      ? (firstText.content.length > 180 ? firstText.content.slice(0, 180).trim() + '…' : firstText.content)
      : '';
    return {
      id: 'p_' + l.id,
      author: meta.instructor,
      author_initial: meta.instructorInitial,
      author_color: meta.bannerColor,
      course_id: l.id,
      course_name: l.subject + ' · ' + (meta.section || l.grade_level),
      kind: 'lesson_posted',
      kind_label: 'Posted a lesson',
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

// Build "to-do" from lessons that have a quiz the student hasn't taken yet.
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

// Calendar events derived from the same set.
export function buildEvents(lessons, scores) {
  const todo = buildTodo(lessons, scores);
  return todo.upcoming.map(u => ({
    date: 'Anytime',
    items: [{ label: u.title + ' available', kind: 'quiz', sub: u.course }]
  }));
}

// Recently completed quizzes (student side).
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

// People — placeholder per course since the backend doesn't track enrollment.
export const LMS_PEOPLE_BY_SUBJECT = {
  Mathematics: ['Aminata Diallo', 'Kwame Owusu', 'Asha Mensah', 'Daniel Khoza', 'Fatima Bello'],
  Science:     ['Aminata Diallo', 'Kwame Owusu', 'Sara Ibrahim'],
  Literacy:    ['Aminata Diallo', 'Daniel Khoza', 'Layla Ahmed']
};

export function buildPeople(lesson) {
  if (!lesson) return { teacher: { name: 'Teacher' }, classmates: [] };
  const meta = metaForLesson(lesson);
  const names = LMS_PEOPLE_BY_SUBJECT[lesson.subject] || ['Aminata Diallo', 'Kwame Owusu'];
  return {
    teacher: { name: meta.instructor, initial: meta.instructorInitial, color: meta.bannerColor },
    classmates: names.map(n => ({
      name: n,
      initial: n.split(' ').map(s => s[0]).join('').slice(0, 2)
    }))
  };
}

export const LMS_SUBJECTS = ['Mathematics', 'Science', 'Literacy', 'History', 'Geography', 'Health'];
