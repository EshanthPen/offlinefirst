import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { useT } from '../i18n';
import { useTheme } from '../theme';
import { LMS_LANGUAGES } from '../data/languages';
import { fetchAuthStatus, isLoggedIn, clearToken, authedFetch } from '../auth';
import { saveProfile } from '../db';
import { triggerSync } from '../sync';

export default function Settings({ profile, setProfile, a11y, setA11y, onRestartOnboarding, onOpenLang }) {
  const { t, lang } = useT();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [authEnabled, setAuthEnabled] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { fetchAuthStatus().then(s => setAuthEnabled(!!s.authEnabled)); }, []);

  const langName = (LMS_LANGUAGES.find(l => l.code === lang) || { native: 'English' }).native;
  const isTeacher = profile?.role === 'teacher';

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const exportData = async () => {
    setBusy(true);
    try {
      const res = await authedFetch('/api/admin/export');
      if (!res.ok) { flash(res.status === 401 ? 'Sign in as teacher first.' : 'Export failed.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offlinefirst-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      flash('Backup downloaded.');
    } finally { setBusy(false); }
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const dump = JSON.parse(text);
      const res = await authedFetch('/api/admin/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dump)
      });
      if (!res.ok) { flash(res.status === 401 ? 'Sign in as teacher first.' : 'Import failed.'); return; }
      const data = await res.json();
      flash(`Imported ${data.imported.lessons} lessons, ${data.imported.scores} scores`);
      triggerSync();
    } catch (err) {
      flash('Import failed: ' + err.message);
    } finally { setBusy(false); e.target.value = ''; }
  };

  const signOut = async () => {
    clearToken();
    await saveProfile({ role: 'student' });
    setProfile(p => ({ ...p, role: 'student' }));
    navigate('/');
  };

  return (
    <div className="lms-page" style={{ maxWidth: 720 }}>
      <h1 className="lms-page-title">Settings</h1>
      <p className="lms-page-sub">Local preferences for this device.</p>

      {msg && <div className="lms-toast"><Icon name="check-circle" size={14} /> {msg}</div>}

      <h2 className="lms-section-title" style={{ marginTop: 16, marginBottom: 12 }}>Account</h2>
      <div className="lms-card" style={{ marginBottom: 24 }}>
        <div className="lms-list-row" style={{ cursor: 'default' }}>
          <span className="lms-list-row-main">
            <Avatar name={profile?.studentName} size={40} />
            <span>
              <div style={{ fontWeight: 500 }}>{profile?.studentName || 'Student'}</div>
              <div className="lms-list-row-muted">
                {isTeacher ? 'Teacher' : 'Student'}
                {profile?.grade ? ' · ' + profile.grade : ''}
                {profile?.subjects?.length ? ' · ' + profile.subjects.join(', ') : ''}
              </div>
            </span>
          </span>
          {isTeacher && (
            <button type="button" className="lms-text-btn" onClick={signOut}>Sign out</button>
          )}
        </div>
      </div>

      <h2 className="lms-section-title" style={{ marginTop: 16, marginBottom: 12 }}>Preferences</h2>
      <div className="lms-card">
        <button type="button" className="lms-list-row" onClick={onOpenLang}>
          <span className="lms-list-row-main">
            <Icon name="globe" size={20} color="var(--lms-ink-muted)" />
            <span>
              <div style={{ fontWeight: 500 }}>Language</div>
              <div className="lms-list-row-muted">{langName} · {LMS_LANGUAGES.length} available</div>
            </span>
          </span>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
        </button>
        <button type="button" className="lms-list-row" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <span className="lms-list-row-main">
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={20} color="var(--lms-ink-muted)" />
            <span>
              <div style={{ fontWeight: 500 }}>Theme</div>
              <div className="lms-list-row-muted">{theme === 'dark' ? 'Dark' : 'Light'}</div>
            </span>
          </span>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
        </button>
        <button type="button" className="lms-list-row" onClick={() => setA11y(v => !v)}>
          <span className="lms-list-row-main">
            <Icon name="accessibility" size={20} color="var(--lms-ink-muted)" />
            <span>
              <div style={{ fontWeight: 500 }}>Larger text</div>
              <div className="lms-list-row-muted">{a11y ? 'On' : 'Off'}</div>
            </span>
          </span>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
        </button>
      </div>

      <h2 className="lms-section-title" style={{ marginTop: 32, marginBottom: 12 }}>Data and backups</h2>
      <div className="lms-card">
        <button type="button" className="lms-list-row" onClick={exportData} disabled={busy}>
          <span className="lms-list-row-main">
            <Icon name="download" size={20} color="var(--lms-ink-muted)" />
            <span>
              <div style={{ fontWeight: 500 }}>Export backup</div>
              <div className="lms-list-row-muted">Lessons, scores, devices. Saved as JSON.</div>
            </span>
          </span>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
        <button type="button" className="lms-list-row" onClick={() => fileRef.current?.click()} disabled={busy}>
          <span className="lms-list-row-main">
            <Icon name="upload" size={20} color="var(--lms-ink-muted)" />
            <span>
              <div style={{ fontWeight: 500 }}>Restore from backup</div>
              <div className="lms-list-row-muted">Imports the JSON file. Same-ID rows are replaced.</div>
            </span>
          </span>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
        </button>
      </div>

      <h2 className="lms-section-title" style={{ marginTop: 32, marginBottom: 12 }}>Device</h2>
      <div className="lms-card">
        <button type="button" className="lms-list-row" onClick={onRestartOnboarding}>
          <span className="lms-list-row-main">
            <Icon name="refresh" size={20} color="var(--lms-ink-muted)" />
            <span>
              <div style={{ fontWeight: 500 }}>Sign out and restart setup</div>
              <div className="lms-list-row-muted">Clears this device's profile and re-runs onboarding.</div>
            </span>
          </span>
          <Icon name="chevron-right" size={16} color="var(--lms-ink-faint)" />
        </button>
      </div>

      {!authEnabled && (
        <div className="lms-toast" style={{ background: 'var(--lms-warn-soft)', color: 'var(--lms-warn)', marginTop: 24 }}>
          <Icon name="alert-circle" size={14} />
          No TEACHER_PIN configured. Anyone on this server can edit lessons. Set it in your Render environment.
        </div>
      )}
    </div>
  );
}
