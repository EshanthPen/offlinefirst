import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import MeshGraph from '../components/MeshGraph';
import DeviceCard from '../components/DeviceCard';
import Avatar from '../components/Avatar';
import { getProfile } from '../db';
import { getSyncState, onSyncStateChange, triggerSync, getDeviceId } from '../sync';

function Stat({ label, value }) {
  return (
    <div className="lms-card lms-stat">
      <div className="lms-stat-value">{value}</div>
      <div className="lms-stat-label">{label}</div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ studentName: 'Teacher' });
  const [devices, setDevices] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [results, setResults] = useState([]);
  const [sync, setSync] = useState(getSyncState());
  const [busy, setBusy] = useState(false);
  const [myId, setMyId] = useState(null);

  const load = async () => {
    try {
      const [devRes, lessonRes, scoreRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/lessons'),
        fetch('/api/scores')
      ]);
      if (devRes.ok) {
        const ds = await devRes.json();
        const myDeviceId = await getDeviceId();
        setMyId(myDeviceId);
        const mapped = ds.map(d => ({
          id: d.id,
          name: d.name || d.id,
          role: d.role || 'student',
          synced: d.lesson_versions ? Object.keys(safeParse(d.lesson_versions)).length : 0,
          total: 0,
          last_seen_ms: d.last_seen ? Date.now() - new Date(d.last_seen).getTime() : null,
          live: d.last_seen && (Date.now() - new Date(d.last_seen).getTime()) < 5 * 60 * 1000,
          recent: d.last_seen && (Date.now() - new Date(d.last_seen).getTime()) < 5 * 60 * 1000
        }));
        if (lessonRes.ok) {
          const ls = await lessonRes.json();
          setLessons(ls);
          mapped.forEach(d => { d.total = ls.length; });
        }
        setDevices(mapped.filter(d => d.id !== myDeviceId));
      }
      if (scoreRes.ok) setResults(await scoreRes.json());
      setProfile(await getProfile());
    } catch {}
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 10000);
    const u = onSyncStateChange(setSync);
    return () => { clearInterval(i); u(); };
  }, []);

  const recent = devices.filter(d => d.live);
  const avgScore = results.length
    ? Math.round(results.reduce((a, r) => a + (r.score / r.total) * 100, 0) / results.length)
    : 0;

  const handleSync = async () => { setBusy(true); await triggerSync(); await load(); setBusy(false); };

  return (
    <div className="lms-page">
      <div className="lms-page-head-row">
        <div>
          <h1 className="lms-page-title">Network dashboard</h1>
          <p className="lms-page-sub">
            Welcome back, {(profile.studentName || 'Teacher').split(' ')[0]}. Your local mesh is live.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="lms-pill-btn outline" onClick={handleSync} disabled={busy}>
            <Icon name="refresh" size={14} style={{ animation: busy ? 'pulse-dot 1s ease infinite' : 'none' }} />
            Sync now
          </button>
          <button type="button" className="lms-pill-btn solid" onClick={() => navigate('/content')}>
            <Icon name="plus" size={14} /> New lesson
          </button>
        </div>
      </div>

      <div className="lms-stat-grid">
        <Stat label="Active devices" value={recent.length} />
        <Stat label="Lessons published" value={lessons.length} />
        <Stat label="Quiz attempts" value={results.length} />
        <Stat label="Average score" value={`${avgScore}%`} />
      </div>

      <MeshGraph devices={devices} />

      <h2 className="lms-section-title" style={{ marginTop: 32, marginBottom: 12 }}>Connected devices</h2>
      {devices.length === 0 ? (
        <div className="lms-card" style={{ padding: 32, textAlign: 'center', color: 'var(--lms-ink-muted)' }}>
          No devices connected yet. Students appear here as they sync.
        </div>
      ) : (
        <div className="lms-device-grid">
          {devices.map(d => <DeviceCard key={d.id} device={d} />)}
        </div>
      )}

      <div className="lms-page-head-row" style={{ marginTop: 32 }}>
        <h2 className="lms-section-title">Recent quiz attempts</h2>
        <button type="button" className="lms-text-btn" onClick={() => navigate('/results')}>
          See all <Icon name="arrow-right" size={14} />
        </button>
      </div>
      {results.length === 0 ? (
        <div className="lms-card" style={{ padding: 32, textAlign: 'center', color: 'var(--lms-ink-muted)' }}>
          No quiz attempts yet.
        </div>
      ) : (
        <div className="lms-card">
          {results.slice(0, 5).map(r => {
            const pct = Math.round((r.score / r.total) * 100);
            const color = pct >= 80 ? 'var(--lms-ok)' : pct >= 60 ? 'var(--lms-info)' : 'var(--lms-warn)';
            return (
              <div key={r.id} className="lms-list-row" style={{ cursor: 'default' }}>
                <span className="lms-list-row-main">
                  <Avatar name={r.student_name || 'Anonymous'} size={28} />
                  <span style={{ fontWeight: 500 }}>{r.student_name || 'Anonymous'}</span>
                </span>
                <span style={{ width: 240 }} className="lms-list-row-muted">{r.lesson_title || r.lesson_id}</span>
                <span style={{ width: 120, textAlign: 'right', color, fontWeight: 600 }}>
                  {r.score}/{r.total} · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function safeParse(v) {
  if (v == null) return {};
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return {}; }
}
