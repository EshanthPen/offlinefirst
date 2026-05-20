import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import SectionHeader from '../components/SectionHeader';
import { useT, LANGUAGES } from '../i18n';
import { useTheme } from '../theme';
import { fetchAuthStatus, isLoggedIn, clearToken, authedFetch } from '../auth';
import { saveProfile } from '../db';
import { triggerSync } from '../sync';

export default function Settings({ profile, setProfile, a11y, setA11y }) {
  const { t, lang, setLang } = useT();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [authEnabled, setAuthEnabled] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchAuthStatus().then(s => setAuthEnabled(!!s.authEnabled));
  }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  const exportData = async () => {
    setBusy(true);
    try {
      const res = await authedFetch('/api/admin/export');
      if (!res.ok) {
        flash(res.status === 401 ? t('mustSignInTeacher') : t('exportFailed'));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offlinefirst-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash(t('exportSaved'));
    } finally {
      setBusy(false);
    }
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const dump = JSON.parse(text);
      const res = await authedFetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dump)
      });
      if (!res.ok) {
        flash(res.status === 401 ? t('mustSignInTeacher') : t('importFailed'));
        return;
      }
      const data = await res.json();
      flash(`${t('importedCount')}: ${data.imported.lessons} lessons, ${data.imported.scores} scores`);
      triggerSync();
    } catch (err) {
      flash(t('importFailed') + ': ' + err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const signOut = async () => {
    clearToken();
    await saveProfile({ role: 'student' });
    setProfile(p => ({ ...p, role: 'student' }));
    navigate('/');
  };

  const isTeacher = profile?.role === 'teacher';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)' }}>
      <header>
        <h1 className="hero">{t('settings')}</h1>
        <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>{t('settingsSub')}</p>
      </header>

      {msg && (
        <div className="card card-pad" style={{ background: 'var(--brand-soft)', borderColor: 'var(--brand-soft)', color: 'var(--brand)', padding: '12px 16px' }}>
          {msg}
        </div>
      )}

      <section>
        <SectionHeader title={t('preferences')} />
        <div className="card" style={{ padding: 0 }}>
          <Row
            label={t('themeLabel')}
            sub={t('themeSub')}
            control={
              <div style={{ display: 'flex', gap: 6 }}>
                <ToggleBtn active={theme === 'light'} onClick={() => setTheme('light')}>
                  <Icon name="sun" size={14} /> {t('lightTheme')}
                </ToggleBtn>
                <ToggleBtn active={theme === 'dark'} onClick={() => setTheme('dark')}>
                  <Icon name="moon" size={14} /> {t('darkTheme')}
                </ToggleBtn>
              </div>
            }
          />
          <Row
            label={t('largerTextLabel')}
            sub={t('largerTextSub')}
            control={
              <ToggleBtn active={a11y} onClick={() => setA11y(v => !v)}>
                {a11y ? t('on') : t('off')}
              </ToggleBtn>
            }
          />
          <Row
            label={t('language')}
            sub={t('languageSub')}
            control={
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="text-input"
                style={{ minWidth: 140 }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label} — {l.name}</option>
                ))}
              </select>
            }
            last
          />
        </div>
      </section>

      <section>
        <SectionHeader title={t('dataAdmin')} subtitle={t('dataAdminSub')} />
        <div className="card" style={{ padding: 0 }}>
          <Row
            label={t('exportBackup')}
            sub={t('exportBackupSub')}
            control={
              <button className="btn btn-secondary" onClick={exportData} disabled={busy} type="button">
                <Icon name="download" size={14} /> {t('exportBtn')}
              </button>
            }
          />
          <Row
            label={t('importBackup')}
            sub={t('importBackupSub')}
            control={
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={importData}
                  style={{ display: 'none' }}
                />
                <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy} type="button">
                  <Icon name="upload" size={14} /> {t('importBtn')}
                </button>
              </>
            }
            last
          />
        </div>
      </section>

      <section>
        <SectionHeader title={t('account')} />
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--brand-soft)', color: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="user" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{profile?.studentName || 'Student'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              {isTeacher ? t('signedInTeacher') : t('signedInStudent')}
              {!authEnabled && ' · ' + t('noPinSet')}
              {isLoggedIn() && ' · ' + t('teacherTokenStored')}
            </div>
          </div>
          {isTeacher && (
            <button className="btn btn-ghost" onClick={signOut} type="button">
              {t('signOut')}
            </button>
          )}
        </div>
      </section>

      {!authEnabled && (
        <section>
          <div className="card card-pad" style={{ background: 'var(--warning-soft)', borderColor: 'var(--warning-soft)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Icon name="zap" size={18} color="var(--warning)" style={{ marginTop: 2 }} />
              <div style={{ fontSize: 14, color: 'var(--ink)' }}>
                <strong>{t('securityWarning')}</strong>
                <div style={{ marginTop: 4, color: 'var(--ink-muted)' }}>{t('securityWarningSub')}</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, sub, control, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '16px 20px',
      borderBottom: last ? 'none' : '1px solid var(--rule)'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 12px',
        borderRadius: 'var(--r-sm)',
        background: active ? 'var(--brand)' : 'var(--surface)',
        color: active ? 'var(--brand-on)' : 'var(--ink)',
        border: '1px solid ' + (active ? 'var(--brand)' : 'var(--rule-strong)'),
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit'
      }}
    >
      {children}
    </button>
  );
}
