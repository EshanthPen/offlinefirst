import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProfile, saveProfile, seedFromStaticIfEmpty, clearProfile, getAllLessons, getAllScores, getAllQuizzes } from './db';
import { startAutoSync } from './sync';
import { clearToken } from './auth';
import { sampleLessons } from './data/sampleLessons';
import { I18nProvider, useT } from './i18n';
import { ThemeProvider } from './theme';
import { AppDataProvider } from './data/AppData';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LanguageModal from './components/LanguageModal';
import PairDevice from './components/PairDevice';
import InstallPrompt from './components/InstallPrompt';
import StudentHome from './pages/StudentHome';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonReader from './pages/LessonReader';
import QuizPage from './pages/QuizPage';
import StudentProgress from './pages/StudentProgress';
import CalendarPage from './pages/Calendar';
import ToDoPage from './pages/ToDo';
import Archived from './pages/Archived';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherContent from './pages/TeacherContent';
import TeacherResults from './pages/TeacherResults';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

const A11Y_KEY = 'offlinefirst_a11y';

function Shell({ profile, setProfile, a11y, setA11y, onRestartOnboarding, lessons, scores }) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const { setLang } = useT();
  const isTeacher = profile?.role === 'teacher';

  // count of quizzes the student hasn't taken yet
  const todoBadge = (() => {
    if (isTeacher) return 0;
    const taken = new Set(scores.map(s => s.lesson_id));
    return lessons.filter(l => l.quiz?.questions?.length && !taken.has(l.id)).length;
  })();

  return (
    <>
      <Topbar
        profile={profile}
        onToggleNav={() => setNavCollapsed(c => !c)}
        onOpenLang={() => setLangOpen(true)}
        onOpenPair={() => setPairOpen(true)}
      />
      <div className={`lms-app${navCollapsed ? ' nav-collapsed' : ''}`}>
        <Sidebar role={profile?.role} courses={lessons} collapsed={navCollapsed} todoBadge={todoBadge} />
        <div className="lms-main">
          <div className="lms-content">
            <Routes>
              {isTeacher ? (
                <>
                  <Route path="/" element={<TeacherDashboard />} />
                  <Route path="/content" element={<TeacherContent />} />
                  <Route path="/results" element={<TeacherResults />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/archived" element={<Archived />} />
                  <Route path="/course/:id" element={<CourseDetail />} />
                  <Route path="/lesson/:id" element={<LessonReader />} />
                  <Route path="/quiz/:id" element={<QuizPage />} />
                  <Route
                    path="/settings"
                    element={
                      <Settings
                        profile={profile}
                        setProfile={setProfile}
                        a11y={a11y}
                        setA11y={setA11y}
                        onRestartOnboarding={onRestartOnboarding}
                        onOpenLang={() => setLangOpen(true)}
                      />
                    }
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<StudentHome />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/todo" element={<ToDoPage />} />
                  <Route path="/progress" element={<StudentProgress />} />
                  <Route path="/archived" element={<Archived />} />
                  <Route path="/course/:id" element={<CourseDetail />} />
                  <Route path="/lesson/:id" element={<LessonReader />} />
                  <Route path="/quiz/:id" element={<QuizPage />} />
                  <Route
                    path="/settings"
                    element={
                      <Settings
                        profile={profile}
                        setProfile={setProfile}
                        a11y={a11y}
                        setA11y={setA11y}
                        onRestartOnboarding={onRestartOnboarding}
                        onOpenLang={() => setLangOpen(true)}
                      />
                    }
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </div>
        </div>
      </div>
      {langOpen && (
        <LanguageModal
          lang={localStorage.getItem('offlinefirst_lang') || 'en'}
          onPick={(c) => { setLang(c); setLangOpen(false); }}
          onClose={() => setLangOpen(false)}
        />
      )}
      {pairOpen && <PairDevice onClose={() => setPairOpen(false)} />}
      <InstallPrompt />
    </>
  );
}

function AppContent() {
  const { setLang } = useT();
  const [profile, setProfile] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [a11y, setA11y] = useState(() => localStorage.getItem(A11Y_KEY) === '1');

  const refreshData = async () => {
    const [rawLessons, quizzes, s] = await Promise.all([getAllLessons(), getAllQuizzes(), getAllScores()]);
    // enrich each lesson with its quiz so UI code can just read l.quiz
    const quizByLesson = new Map(quizzes.map(q => [q.lesson_id, q]));
    const enriched = rawLessons.map(l => {
      const q = quizByLesson.get(l.id);
      return q ? { ...l, quiz: q } : l;
    });
    setLessons(enriched);
    setScores(s);
  };

  useEffect(() => {
    let interval = null;
    let scoreInterval = null;
    (async () => {
      const p = await getProfile();
      setProfile(p);
      await seedFromStaticIfEmpty(sampleLessons);
      await refreshData();
      setLoading(false);
      // sync also refreshes data when new content arrives
      interval = startAutoSync(refreshData);
      // local scores can change between syncs (quiz completion), so poll lightly
      scoreInterval = setInterval(refreshData, 5000);
    })();
    return () => {
      if (interval) clearInterval(interval);
      if (scoreInterval) clearInterval(scoreInterval);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-a11y', a11y ? 'large' : 'normal');
    localStorage.setItem(A11Y_KEY, a11y ? '1' : '0');
  }, [a11y]);

  const completeOnboarding = async (payload) => {
    const next = payload || {
      role: 'student', studentName: 'Student', lang: 'en', a11y: false,
      grade: 'g4-6', subjects: [], onboardedAt: new Date().toISOString()
    };
    const studentId = profile?.studentId
      || 'student_' + Math.random().toString(36).substring(2, 11);
    await saveProfile({
      studentId,
      studentName: next.studentName,
      role: next.role,
      grade: next.grade || null,
      subjects: next.subjects || [],
      lang: next.lang || 'en',
      a11y: !!next.a11y,
      paired: false,
      onboardedAt: next.onboardedAt
    });
    setProfile({ ...next, studentId });
    if (next.lang) setLang(next.lang);
    setA11y(!!next.a11y);
  };

  const restartOnboarding = async () => {
    clearToken();
    await clearProfile();
    setProfile({ studentId: null, studentName: 'Student', role: 'student', onboardedAt: null });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: 'var(--lms-ink-muted)', fontSize: 14
      }}>
        Loading…
      </div>
    );
  }

  if (!profile?.onboardedAt) {
    return <Onboarding onComplete={completeOnboarding} initialLang={profile?.lang || 'en'} />;
  }

  return (
    <BrowserRouter>
      <AppDataProvider value={{ lessons, scores, refresh: refreshData }}>
        <Shell
          profile={profile}
          setProfile={setProfile}
          a11y={a11y}
          setA11y={setA11y}
          onRestartOnboarding={restartOnboarding}
          lessons={lessons}
          scores={scores}
        />
      </AppDataProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}
