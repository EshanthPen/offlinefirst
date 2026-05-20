import Peer from 'peerjs';
import {
  initDB,
  saveLessons, saveQuizzes, getAllLessons,
  getUnsyncedScores, markScoresSynced, getLessonVersionManifest,
  getProfile
} from './db';

// ---- Device Identity ----
export const getDeviceId = async () => {
  let id = localStorage.getItem('offlinefirst_device_id');
  if (!id) {
    id = 'of_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('offlinefirst_device_id', id);
  }
  return id;
};

// ---- Sync State (observable) ----
let syncState = {
  status: 'offline',
  connectedPeers: [],
  lastSync: null,
  pendingScores: 0
};

let listeners = [];

export const getSyncState = () => syncState;

export const onSyncStateChange = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
};

const updateSyncState = (updates) => {
  syncState = { ...syncState, ...updates };
  listeners.forEach(fn => fn(syncState));
};

const refreshPendingCount = async () => {
  try {
    const unsynced = await getUnsyncedScores();
    updateSyncState({ pendingScores: unsynced.length });
  } catch (err) {
    // ignore
  }
};

// ---- Server Sync ----
export const syncWithServer = async () => {
  try {
    updateSyncState({ status: 'syncing' });

    const versions = await getLessonVersionManifest();

    const res = await fetch(`/api/sync/bundle?versions=${encodeURIComponent(JSON.stringify(versions))}`);
    if (!res.ok) throw new Error('Server unreachable');

    const bundle = await res.json();

    if (bundle.lessons?.length > 0) {
      const parsed = bundle.lessons.map(l => ({
        ...l,
        content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content
      }));
      await saveLessons(parsed);
    }

    if (bundle.quizzes?.length > 0) {
      const parsed = bundle.quizzes.map(q => ({
        ...q,
        questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
      }));
      await saveQuizzes(parsed);
    }

    const unsyncedScores = await getUnsyncedScores();
    if (unsyncedScores.length > 0) {
      const syncRes = await fetch('/api/scores/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: unsyncedScores })
      });

      if (syncRes.ok) {
        await markScoresSynced(unsyncedScores.map(s => s.id));
      }
    }

    const deviceId = await getDeviceId();
    const profile = await getProfile();
    const newVersions = await getLessonVersionManifest();

    try {
      await fetch('/api/devices/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deviceId,
          name: profile.studentName,
          role: profile.role,
          lessonVersions: newVersions
        })
      });
    } catch (err) {
      // heartbeat failure is non-fatal
    }

    updateSyncState({
      status: 'synced',
      lastSync: new Date().toISOString(),
      pendingScores: 0
    });

    return { success: true, newLessons: bundle.lessons?.length || 0 };

  } catch (err) {
    console.log('Server sync failed, falling back to peer sync:', err.message);
    updateSyncState({ status: connections.length > 0 ? 'local' : 'offline' });
    await refreshPendingCount();
    return { success: false, error: err.message };
  }
};

// ---- Peer-to-Peer Sync (mesh, no internet required) ----
let peer = null;
let connections = [];
let newContentCallback = null;

export const initPeerSync = async (onNewContent) => {
  newContentCallback = onNewContent;
  const deviceId = await getDeviceId();

  try {
    peer = new Peer(deviceId, {
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', (id) => {
      console.log('Peer sync ready, device ID:', id);
      if (syncState.status === 'offline') {
        updateSyncState({ status: 'local' });
      }
      broadcastPresence();
    });

    peer.on('connection', (conn) => {
      handleIncomingConnection(conn);
    });

    peer.on('error', (err) => {
      console.log('Peer error (expected when offline):', err.type);
    });

    peer.on('disconnected', () => {
      console.log('Peer disconnected');
    });

  } catch (err) {
    console.log('Peer init failed:', err);
  }
};

const handleIncomingConnection = (conn) => {
  conn.on('open', async () => {
    connections.push(conn);
    updateSyncState({ connectedPeers: connections.map(c => c.peer) });

    const versions = await getLessonVersionManifest();
    const deviceId = await getDeviceId();
    conn.send({ type: 'MANIFEST', versions, deviceId });

    // forward our unsynced scores to teacher peers, in case they have connectivity
    const unsynced = await getUnsyncedScores();
    if (unsynced.length > 0) {
      conn.send({ type: 'SCORES', scores: unsynced });
    }
  });

  conn.on('data', async (data) => {
    if (!data || !data.type) return;

    if (data.type === 'MANIFEST') {
      await sendMissingContent(conn, data.versions || {});
    }

    if (data.type === 'CONTENT_BUNDLE') {
      if (data.lessons?.length > 0) {
        await saveLessons(data.lessons);
      }
      if (data.quizzes?.length > 0) {
        await saveQuizzes(data.quizzes);
      }
      updateSyncState({ status: 'synced', lastSync: new Date().toISOString() });
      if (newContentCallback) newContentCallback(data.lessons?.length || 0);
    }

    if (data.type === 'SCORES' && Array.isArray(data.scores)) {
      try {
        await fetch('/api/scores/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: data.scores })
        });
      } catch (err) {
        console.log('Could not forward scores to server:', err.message);
      }
    }
  });

  conn.on('close', () => {
    connections = connections.filter(c => c !== conn);
    updateSyncState({ connectedPeers: connections.map(c => c.peer) });
  });

  conn.on('error', (err) => {
    console.log('Connection error:', err);
  });
};

const sendMissingContent = async (conn, theirVersions) => {
  const allLessons = await getAllLessons();
  const dbInstance = await initDB();
  const allQuizzes = await dbInstance.getAll('quizzes');

  const newLessons = allLessons.filter(l =>
    !theirVersions[l.id] || theirVersions[l.id] < l.version
  );

  if (newLessons.length > 0) {
    const relevantQuizzes = allQuizzes.filter(q =>
      newLessons.find(l => l.id === q.lesson_id)
    );

    conn.send({
      type: 'CONTENT_BUNDLE',
      lessons: newLessons,
      quizzes: relevantQuizzes
    });
  }
};

const broadcastPresence = () => {
  if (!peer) return;
  const knownPeers = JSON.parse(localStorage.getItem('known_peers') || '[]');
  const myId = localStorage.getItem('offlinefirst_device_id');

  knownPeers.forEach(peerId => {
    if (peerId === myId) return;
    if (connections.find(c => c.peer === peerId)) return;

    try {
      const conn = peer.connect(peerId, { reliable: true });
      handleIncomingConnection(conn);
    } catch (err) {
      // peer not available
    }
  });
};

export const addKnownPeer = (peerId) => {
  const known = JSON.parse(localStorage.getItem('known_peers') || '[]');
  if (!known.includes(peerId)) {
    known.push(peerId);
    localStorage.setItem('known_peers', JSON.stringify(known));
  }
  if (peer && peer.open) {
    broadcastPresence();
  }
};

export const removeKnownPeer = (peerId) => {
  const known = JSON.parse(localStorage.getItem('known_peers') || '[]');
  const updated = known.filter(p => p !== peerId);
  localStorage.setItem('known_peers', JSON.stringify(updated));
};

export const getKnownPeers = () =>
  JSON.parse(localStorage.getItem('known_peers') || '[]');

// Auto-sync: try server first, fall back to peer sync
export const startAutoSync = (onNewContent) => {
  initPeerSync(onNewContent);

  const doSync = async () => {
    const serverResult = await syncWithServer();
    if (!serverResult.success && connections.length === 0) {
      updateSyncState({ status: 'offline' });
    }
    await refreshPendingCount();
  };

  doSync();
  return setInterval(doSync, 30000);
};

export const triggerSync = async () => {
  return syncWithServer();
};
