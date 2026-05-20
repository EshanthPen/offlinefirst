import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import SectionHeader from '../components/SectionHeader';
import { getSyncState, onSyncStateChange, triggerSync, getDeviceId } from '../sync';
import { useT } from '../i18n';

function Stat({ label, value, icon, color }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--brand-soft)', color: color || 'var(--brand)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon name={icon} size={17} />
      </span>
      <div>
        <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6 }}>{label}</div>
      </div>
    </div>
  );
}

function DeviceCard({ device, lessons, isRecent }) {
  let versions = {};
  try { versions = device.lesson_versions ? JSON.parse(device.lesson_versions) : {}; } catch (e) {}
  const synced = Object.keys(versions).length;
  const total = lessons.length;
  const pct = total > 0 ? (synced / total) * 100 : 0;
  const initials = (device.name || 'D').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'D';

  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="avatar" style={{ background: isRecent ? 'var(--brand)' : 'var(--surface-3)', color: isRecent ? 'var(--brand-on)' : 'var(--ink-muted)' }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{device.name || 'Unknown device'}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{(device.role || 'student')[0].toUpperCase() + (device.role || 'student').slice(1)}</div>
        </div>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isRecent ? 'var(--success)' : 'var(--ink-faint)'
        }} />
      </div>
      <div style={{ height: 6, background: 'var(--rule)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct === 100 ? 'var(--success)' : 'var(--warning)',
          borderRadius: 999,
          transition: 'width var(--t-med) var(--ease)'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)' }}>
        <span>{synced} / {total} lessons</span>
        <span>{device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}</span>
      </div>
    </div>
  );
}

function MeshGraph({ devices, t }) {
  const [myId, setMyId] = useState(null);
  const [state, setState] = useState(getSyncState());

  useEffect(() => {
    (async () => setMyId(await getDeviceId()))();
    return onSyncStateChange(setState);
  }, []);

  const recent = devices.filter(d => d.last_seen && new Date(d.last_seen) > new Date(Date.now() - 5 * 60 * 1000));
  const peers = recent.filter(d => d.id !== myId).slice(0, 8);
  const connectedSet = new Set(state.connectedPeers || []);

  const cx = 220, cy = 140;
  const radius = 100;
  const step = peers.length > 0 ? (2 * Math.PI) / peers.length : 0;

  return (
    <div className="card card-pad-lg" style={{ marginBottom: 'var(--s-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h3 className="h2" style={{ fontSize: 16, margin: 0 }}>{t('meshNetworkTitle')}</h3>
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 'var(--r-pill)',
          background: 'var(--brand-soft)', color: 'var(--brand)'
        }}>
          {peers.length} {peers.length === 1 ? t('peerSingular') : t('peerPlural')}
        </span>
      </div>

      <svg width="100%" height="280" viewBox="0 0 440 280" style={{ display: 'block' }}>
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r="130" fill="url(#centerGlow)" />

        {[45, 75, 105].map((r, i) => (
          <circle
            key={r}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="var(--rule-strong)"
            strokeWidth="1"
            strokeDasharray={i === 1 ? '3 4' : '1 5'}
            opacity={0.5}
          />
        ))}

        {peers.map((p, i) => {
          const angle = i * step - Math.PI / 2;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          const live = connectedSet.has(p.id);
          let versions = {};
          try { versions = p.lesson_versions ? JSON.parse(p.lesson_versions) : {}; } catch (e) {}
          const count = Object.keys(versions).length;
          return (
            <g key={p.id}>
              <line
                x1={cx} y1={cy} x2={px} y2={py}
                stroke={live ? 'var(--brand)' : 'var(--rule-strong)'}
                strokeWidth={live ? 1.5 : 1}
                strokeDasharray={live ? '0' : '2 4'}
              />
              <circle
                cx={px} cy={py} r="16"
                fill="var(--surface)"
                stroke={live ? 'var(--brand)' : 'var(--rule-strong)'}
                strokeWidth="1.5"
              />
              <text
                x={px} y={py + 4}
                textAnchor="middle"
                fontSize="11"
                fill={live ? 'var(--brand)' : 'var(--ink-muted)'}
                fontFamily="Inter, sans-serif"
                fontWeight={700}
              >
                {(p.name || 'D').slice(0, 1).toUpperCase()}
              </text>
              <text
                x={px} y={py + 32}
                textAnchor="middle"
                fontSize="11"
                fill="var(--ink-muted)"
                fontFamily="Inter, sans-serif"
              >
                {(p.name || 'device').slice(0, 12)}
              </text>
              <text
                x={px} y={py + 46}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ink-faint)"
                fontFamily="Inter, sans-serif"
              >
                {count} {t('lessonsWord')}
              </text>
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r="26" fill="var(--brand)" />
        <text
          x={cx} y={cy + 5}
          textAnchor="middle"
          fontSize="13"
          fill="var(--brand-on)"
          fontFamily="Inter, sans-serif"
          fontWeight={700}
        >You</text>
        <text
          x={cx} y={cy + 52}
          textAnchor="middle"
          fontSize="11"
          fill="var(--ink-muted)"
          fontFamily="Inter, sans-serif"
          letterSpacing="0.04em"
        >
          {t('you').toUpperCase()}
        </text>

        {peers.length === 0 && (
          <text
            x={cx} y={cy + 90}
            textAnchor="middle"
            fontSize="12"
            fill="var(--ink-faint)"
            fontFamily="Inter, sans-serif"
          >
            {t('noPeersDetected')}
          </text>
        )}
      </svg>
    </div>
  );
}

export default function TeacherDashboard() {
  const { t } = useT();
  const [devices, setDevices] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [scoreCount, setScoreCount] = useState(0);
  const [sync, setSync] = useState(getSyncState());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [devRes, lessonRes, scoreRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/lessons'),
        fetch('/api/scores')
      ]);
      if (devRes.ok) setDevices(await devRes.json());
      if (lessonRes.ok) setLessons(await lessonRes.json());
      if (scoreRes.ok) {
        const scores = await scoreRes.json();
        setScoreCount(scores.length);
      }
    } catch (err) {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    const unsub = onSyncStateChange(setSync);
    return () => { clearInterval(interval); unsub(); };
  }, []);

  const recent = devices.filter(d => d.last_seen && new Date(d.last_seen) > new Date(Date.now() - 5 * 60 * 1000));

  const handleSync = async () => {
    setBusy(true);
    await triggerSync();
    await load();
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="hero">{t('networkDashboard')}</h1>
          <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>Monitor connected devices and sync status across your local mesh.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleSync} disabled={busy} type="button">
          <Icon name="refresh" size={15} style={{ animation: busy ? 'spin 1s linear infinite' : 'none' }} />
          {t('syncNow')}
        </button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s-4)' }}>
        <Stat label={t('activeDevices')} value={recent.length} icon="monitor" />
        <Stat label={t('totalLessons')} value={lessons.length} icon="library" />
        <Stat label={t('quizAttempts')} value={scoreCount} icon="trend" />
        <Stat label={t('lastSync')} value={sync.lastSync ? new Date(sync.lastSync).toLocaleTimeString() : t('never')} icon="clock" />
      </section>

      <section>
        <MeshGraph devices={devices} t={t} />
      </section>

      <section>
        <SectionHeader title={t('connectedDevicesTitle')} />
        {devices.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
            {t('noDevicesYet')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--s-4)' }}>
            {devices.map(d => (
              <DeviceCard
                key={d.id}
                device={d}
                lessons={lessons}
                isRecent={!!recent.find(x => x.id === d.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
