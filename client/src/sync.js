import Peer from 'peerjs';
import {
  initDB,
  saveLessons, saveQuizzes, getAllLessons,
  getUnsyncedScores, markScoresSynced, getLessonVersionManifest,
  getProfile
} from './db';

export const getDeviceId = async () => {
  let id = localStorage.getItem('offlinefirst_device_id');
  if (!id) {
    id = 'of_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('offlinefirst_device_id', id);
  }
  return id;
};

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
  return () => { listeners = listeners.filter(l => l !== fn); };
};

const updateSyncState = (updates) => {
  syncState = { ...syncState, ...updates };
  listeners.forEach(fn => fn(syncState));
};

const refreshPendingCount = async () => {
  try {
    const unsynced = await getUnsyncedScores();
    updateSyncState({ pendingScores: unsynced.length });
  } catch {}
};

// pulls new content from server, pushes scores, refreshes peer list
export const syncWithServer = async () => {
  try {
    updateSyncState({ status: 'syncing' });

    const versions = await getLessonVersionManifest();
    const res = await fetch(`/api/sync/bundle?versions=${encodeURIComponent(JSON.stringify(versions))}`);
    if (!res.ok) throw new Error('Server unreachable');
    const bundle = await res.json();

    let newCount = 0;
    if (bundle.lessons?.length > 0) {
      const parsed = bundle.lessons.map(l => ({
        ...l,
        content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content
      }));
      await saveLessons(parsed);
      newCount = parsed.length;
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
      if (syncRes.ok) await markScoresSynced(unsyncedScores.map(s => s.id));
    }

    // heartbeat. server returns active peers; we auto-connect to them.
    const deviceId = await getDeviceId();
    const profile = await getProfile();
    const newVersions = await getLessonVersionManifest();
    try {
      const hbRes = await fetch('/api/devices/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deviceId,
          name: profile.studentName,
          role: profile.role,
          lessonVersions: newVersions
        })
      });
      if (hbRes.ok) {
        const data = await hbRes.json();
        if (Array.isArray(data.peers)) {
          for (const p of data.peers) addKnownPeer(p.id);
        }
      }
    } catch {}

    // push any new content immediately to all live peer connections.
    // this is the viral spread: a teacher creating a lesson pushes to every
    // connected device the moment it lands locally.
    if (newCount > 0) await pushContentToAllPeers();

    updateSyncState({
      status: 'synced',
      lastSync: new Date().toISOString(),
      pendingScores: 0
    });

    if (newCount > 0 && newContentCallback) newContentCallback(newCount);

    return { success: true, newLessons: newCount };
  } catch (err) {
    console.log('Server sync failed:', err.message);
    updateSyncState({ status: connections.length > 0 ? 'local' : 'offline' });
    await refreshPendingCount();
    return { success: false, error: err.message };
  }
};

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
      console.log('peer ready', id);
      if (syncState.status === 'offline') updateSyncState({ status: 'local' });
      broadcastPresence();
    });

    peer.on('connection', (conn) => {
      handleIncomingConnection(conn);
    });

    peer.on('error', (err) => {
      // 'unavailable-id' = our id is already taken on signaling (StrictMode dup).
      // 'peer-unavailable' = the peer we tried to connect to isn't online.
      console.log('peer error:', err.type);
    });
  } catch (err) {
    console.log('peer init failed:', err);
  }
};

const handleIncomingConnection = (conn) => {
  conn.on('open', async () => {
    if (!connections.find(c => c.peer === conn.peer)) connections.push(conn);
    updateSyncState({ connectedPeers: connections.map(c => c.peer) });

    const versions = await getLessonVersionManifest();
    const deviceId = await getDeviceId();
    const knownPeers = getKnownPeers();

    // MANIFEST also carries our known_peers list → gossip propagation.
    conn.send({ type: 'MANIFEST', versions, deviceId, knownPeers });

    const unsynced = await getUnsyncedScores();
    if (unsynced.length > 0) conn.send({ type: 'SCORES', scores: unsynced });
  });

  conn.on('data', async (data) => {
    if (!data || !data.type) return;

    if (data.type === 'MANIFEST') {
      // gossip: ingest their peer list, attempt connection to anyone new
      if (Array.isArray(data.knownPeers)) {
        for (const pid of data.knownPeers) addKnownPeer(pid);
      }
      if (data.deviceId) addKnownPeer(data.deviceId);
      await sendMissingContent(conn, data.versions || {});
    }

    if (data.type === 'CONTENT_BUNDLE') {
      let parsedLessons = [];
      let parsedQuizzes = [];
      if (data.lessons?.length > 0) {
        parsedLessons = data.lessons.map(l => ({
          ...l,
          content: typeof l.content === 'string' ? JSON.parse(l.content) : l.content
        }));
        await saveLessons(parsedLessons);
      }
      if (data.quizzes?.length > 0) {
        parsedQuizzes = data.quizzes.map(q => ({
          ...q,
          questions: typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions
        }));
        await saveQuizzes(parsedQuizzes);
      }
      updateSyncState({ status: 'synced', lastSync: new Date().toISOString() });
      if (newContentCallback && parsedLessons.length > 0) newContentCallback(parsedLessons.length);

      // viral spread: re-propagate what we just got to every other peer.
      // each device dedupes on receive (compares version), so this terminates.
      if (parsedLessons.length > 0) await pushContentToAllPeers(conn);
    }

    if (data.type === 'SCORES' && Array.isArray(data.scores)) {
      try {
        await fetch('/api/scores/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: data.scores })
        });
      } catch {}
    }
  });

  conn.on('close', () => {
    connections = connections.filter(c => c !== conn);
    updateSyncState({ connectedPeers: connections.map(c => c.peer) });
  });

  conn.on('error', () => {});
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
    conn.send({ type: 'CONTENT_BUNDLE', lessons: newLessons, quizzes: relevantQuizzes });
  }
};

// push every lesson + quiz we have to every live peer, optionally excluding
// the connection we just received from (avoids ping-pong).
async function pushContentToAllPeers(excludeConn = null) {
  if (connections.length === 0) return;
  const allLessons = await getAllLessons();
  const dbInstance = await initDB();
  const allQuizzes = await dbInstance.getAll('quizzes');
  if (allLessons.length === 0) return;

  for (const conn of connections) {
    if (conn === excludeConn) continue;
    if (!conn.open) continue;
    try {
      // send a manifest first; the receiver compares versions and asks for what's new
      const deviceId = await getDeviceId();
      conn.send({ type: 'MANIFEST', versions: {}, deviceId, knownPeers: getKnownPeers() });
      // also push everything directly. dedup happens on receive via saveLessons (idb put).
      conn.send({ type: 'CONTENT_BUNDLE', lessons: allLessons, quizzes: allQuizzes });
    } catch (err) {
      console.log('push to peer failed:', err.message);
    }
  }
}

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
    } catch {}
  });
};

export const addKnownPeer = (peerId) => {
  const myId = localStorage.getItem('offlinefirst_device_id');
  if (!peerId || peerId === myId) return;

  const known = JSON.parse(localStorage.getItem('known_peers') || '[]');
  const isNew = !known.includes(peerId);
  if (isNew) {
    known.push(peerId);
    localStorage.setItem('known_peers', JSON.stringify(known));
  }

  // try to connect immediately, whether new or known but disconnected
  if (peer && peer.open && !connections.find(c => c.peer === peerId)) {
    try {
      const conn = peer.connect(peerId, { reliable: true });
      handleIncomingConnection(conn);
    } catch {}
  }
};

export const removeKnownPeer = (peerId) => {
  const known = JSON.parse(localStorage.getItem('known_peers') || '[]');
  localStorage.setItem('known_peers', JSON.stringify(known.filter(p => p !== peerId)));
};

export const getKnownPeers = () =>
  JSON.parse(localStorage.getItem('known_peers') || '[]');

// 30s tick: server sync, peer discovery, propagation
export const startAutoSync = (onNewContent) => {
  initPeerSync(onNewContent);

  const doSync = async () => {
    const r = await syncWithServer();
    if (!r.success && connections.length === 0) {
      updateSyncState({ status: 'offline' });
    }
    await refreshPendingCount();
  };

  doSync();
  return setInterval(doSync, 30000);
};

export const triggerSync = async () => syncWithServer();
