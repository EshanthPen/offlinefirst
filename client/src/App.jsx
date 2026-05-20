import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProfile, saveProfile, seedFromStaticIfEmpty, getLessonById } from './db';
import { startAutoSync, getSyncState, onSyncStateChange } from './sync';
import { sampleLessons } from './data/sampleLessons';
import { I18nProvider, useT } from './i18n';
import { ThemeProvider } from './theme';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SyncCard from './components/SyncCard';
import NewContentBanner from './components/NewContentBanner';
import PairDevice from './components/PairDevice';
import InstallPrompt from './components/InstallPrompt';
import StudentHome from './pages/StudentHome';
import Courses from './pages/Courses';
import LessonReader from './pages/LessonReader';
import QuizPage from './pages/QuizPage';
import StudentProgress from './pages/StudentProgress';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherContent from './pages/TeacherContent';
import TeacherResults from './pages/TeacherResults';

const A11Y_KEY = 'offlinefirst_a11y';

function LessonTitleWatcher({ setLessonTitle }) {
  const location = useLocation();
  useEffect(() => {
    const m = location.pathname.match(/^\/(?:lesson|quiz)\/(.+)$/);
    if (!m) { setLessonTitle(null); return; }
    let cancelled = false;
    (async () => {
      const l = await getLessonById(m[1]);
      if (!cancelled) setLessonTitle(l?.title || null);
    })();
    return () => { cancelled = true; };
  }, [location.pathname, setLessonTitle]);
  return null;
}

function Shell({ profile, setProfile, a11y, setA11y, newContent, setNewContent }) {
  const [pairOpen, setPairOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [sync, setSync] = useState(getSyncState());
  const [lessonTitle, setLessonTitle] = useState(null);

  useEffect(() => onSyncStateChange(setSync), []);

  const isTeacher = profile?.role === 'teacher';

  return (
    <div className="app">
      <Sidebar profile={profile} setProfile={setProfile} />
      <div className="app-main">
        <Topbar
          isTeacher={isTeacher}
          lessonTitle={lessonTitle}
          a11y={a11y}
          onToggleA11y={() => setA11y(a => !a)}
          onOpenPair={() => setPairOpen(true)}
          onSyncChipClick={() => setSyncOpen(o => !o)}
          newContent={newContent}
          onDismissNewContent={() => setNewContent(0)}
        />
        <div className="app-content">
          <LessonTitleWatcher setLessonTitle={setLessonTitle} />
          {syncOpen && (
            <div style={{ marginBottom: 'var(--s-6)' }}>
              <SyncCard
                status={sync.status}
                peers={sync.connectedPeers?.length || 0}
                pending={sync.pendingScores || 0}
                onClose={() => setSyncOpen(false)}
              />
            </div>
          )}
          {newContent > 0 && (
            <NewContentBanner count={newContent} onDismiss={() => setNewContent(0)} />
          )}
          <Routes>
            {isTeacher ? (
              <>
                <Route path="/" element={<TeacherDashboard />} />
                <Route path="/content" element={<TeacherContent />} />
                <Route path="/results" element={<TeacherResults />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<StudentHome />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/lesson/:id" element={<LessonReader />} />
                <Route path="/quiz/:id" element={<QuizPage />} />
                <Route path="/progress" element={<StudentProgress />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </div>
      </div>

      {pairOpen && <PairDevice onClose={() => setPairOpen(false)} />}
      <InstallPrompt />
    </div>
  );
}

function AppContent() {
  const { t } = useT();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState(0);
  const [a11y, setA11y] = useState(() => localStorage.getItem(A11Y_KEY) === '1');

  useEffect(() => {
    let interval = null;
    const init = async () => {
      let p = await getProfile();
      if (!p.studentId) {
        const np = {
          studentId: 'student_' + Math.random().toString(36).substring(2, 11),
          studentName: 'Aminata Diallo',
          role: 'student'
        };
        await saveProfile(np);
        p = np;
      }
      setProfile(p);
      await seedFromStaticIfEmpty(sampleLessons);
      setLoading(false);

      interval = startAutoSync((count) => {
        if (count > 0) {
          setNewContent(c => c + count);
          setTimeout(() => setNewContent(0), 12000);
        }
      });
    };
    init();
    return () => { if (interval) clearInterval(interval); };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-a11y', a11y ? 'large' : 'normal');
    localStorage.setItem(A11Y_KEY, a11y ? '1' : '0');
  }, [a11y]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: 'var(--ink-muted)',
        fontSize: 14
      }}>
        {t('initializing')}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Shell
        profile={profile}
        setProfile={setProfile}
        a11y={a11y}
        setA11y={setA11y}
        newContent={newContent}
        setNewContent={setNewContent}
      />
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
