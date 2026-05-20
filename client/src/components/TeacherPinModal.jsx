import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { submitTeacherPin, fetchAuthStatus } from '../auth';
import { useT } from '../i18n';

export default function TeacherPinModal({ onSuccess, onClose }) {
  const { t } = useT();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchAuthStatus().then(s => {
      setAuthEnabled(!!s.authEnabled);
      // If the server didn't actually set a PIN, just succeed silently —
      // back-compat with deploys that don't enforce auth.
      if (!s.authEnabled) {
        submit(null);
      }
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const submit = async (overridePin) => {
    setBusy(true);
    setErr('');
    const res = await submitTeacherPin(overridePin ?? pin);
    setBusy(false);
    if (res.ok) {
      onSuccess(res.token);
    } else if (res.reason === 'incorrect_pin') {
      setErr(t('pinIncorrect'));
      setPin('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setErr(t('pinError'));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <button
          className="iconbtn"
          style={{ position: 'absolute', top: 12, right: 12 }}
          onClick={onClose}
          type="button"
        >
          <Icon name="x" size={14} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Icon name="user" size={18} color="var(--brand)" />
          <h2 className="h2" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t('teacherSignIn')}</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('teacherSignInBlurb')}
        </p>

        {authEnabled ? (
          <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="label" style={{ marginBottom: 6 }}>{t('teacherPinLabel')}</div>
            <input
              ref={inputRef}
              className="text-input"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••••"
              style={{ width: '100%', fontSize: 18, letterSpacing: '0.3em', textAlign: 'center', marginBottom: 12 }}
            />
            {err && (
              <div style={{
                fontSize: 13, color: 'var(--danger)',
                background: 'var(--danger-soft)',
                padding: '8px 12px', borderRadius: 'var(--r-sm)',
                marginBottom: 12
              }}>
                {err}
              </div>
            )}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={busy || !pin}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {busy ? t('checkingPin') : t('unlockTeacher')}
            </button>
          </form>
        ) : (
          <div style={{ color: 'var(--ink-muted)', fontSize: 14 }}>{t('loadingShort')}</div>
        )}
      </div>
    </div>
  );
}
