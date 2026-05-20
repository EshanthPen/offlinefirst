const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

// ─── Backup builder ──────────────────────────────────────────
function buildBackup() {
  const safeParse = (v) => {
    if (v == null) return null;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return v; }
  };

  const lessons = db.prepare('SELECT * FROM lessons').all().map(l => ({
    ...l,
    content: safeParse(l.content),
    published: !!l.published
  }));
  const quizzes = db.prepare('SELECT * FROM quizzes').all().map(q => ({
    ...q,
    questions: safeParse(q.questions)
  }));
  const scores = db.prepare('SELECT * FROM scores').all().map(s => ({
    ...s,
    answers: safeParse(s.answers)
  }));
  const devices = db.prepare('SELECT * FROM devices').all().map(d => ({
    ...d,
    lesson_versions: safeParse(d.lesson_versions)
  }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      lessons: lessons.length,
      quizzes: quizzes.length,
      scores: scores.length,
      devices: devices.length
    },
    lessons, quizzes, scores, devices
  };
}

// ─── Local backup ────────────────────────────────────────────
async function writeLocalBackup(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
  const dump = buildBackup();
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(dir, filename);
  await fs.promises.writeFile(filepath, JSON.stringify(dump, null, 2));
  await pruneOldBackups(dir, 14);
  return { filepath, counts: dump.counts };
}

async function pruneOldBackups(dir, keep) {
  try {
    const files = (await fs.promises.readdir(dir))
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort();
    const toDelete = files.slice(0, Math.max(0, files.length - keep));
    for (const f of toDelete) {
      await fs.promises.unlink(path.join(dir, f));
    }
  } catch {}
}

// ─── S3-compatible upload (Cloudflare R2, AWS S3, Backblaze B2) ─
// Minimal SigV4 implementation — no aws-sdk dep. ~80 lines.
async function uploadToS3(bucket, key, body, cfg) {
  const { endpoint, region, accessKey, secretKey } = cfg;
  const host = new URL(endpoint).host;
  const method = 'PUT';
  const service = 's3';
  const contentSha = crypto.createHash('sha256').update(body).digest('hex');
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${contentSha}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, contentSha].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const hash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, hash].join('\n');

  const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
  const kDate    = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const auth = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `${endpoint.replace(/\/$/, '')}${canonicalUri}`;
  const res = await fetch(url, {
    method,
    headers: {
      Host: host,
      Authorization: auth,
      'x-amz-content-sha256': contentSha,
      'x-amz-date': amzDate,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString()
    },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 PUT failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return { url, etag: res.headers.get('etag') };
}

// ─── Orchestrator ────────────────────────────────────────────
async function runBackupCycle() {
  const localDir = process.env.BACKUP_DIR || path.join(path.dirname(process.env.DB_PATH || './'), 'backups');

  try {
    const { filepath, counts } = await writeLocalBackup(localDir);
    console.log(`[backup] wrote ${filepath} (${counts.lessons} lessons, ${counts.scores} scores)`);

    // Optional cloud upload
    const { S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
    if (S3_BUCKET && S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY) {
      const body = await fs.promises.readFile(filepath);
      const key = `offlinefirst/${path.basename(filepath)}`;
      const result = await uploadToS3(S3_BUCKET, key, body, {
        endpoint: S3_ENDPOINT,
        region: S3_REGION || 'auto',
        accessKey: S3_ACCESS_KEY,
        secretKey: S3_SECRET_KEY
      });
      console.log(`[backup] uploaded to ${result.url}`);
    }
  } catch (err) {
    console.error('[backup] failed:', err.message);
  }
}

// ─── Schedule ────────────────────────────────────────────────
// Set BACKUP_INTERVAL_HOURS=24 (default) or any positive number to enable.
// Set BACKUP_INTERVAL_HOURS=0 to disable.
function startScheduledBackups() {
  const hours = parseFloat(process.env.BACKUP_INTERVAL_HOURS ?? '24');
  if (!hours || hours <= 0) {
    console.log('[backup] scheduled backups disabled (BACKUP_INTERVAL_HOURS=0)');
    return;
  }
  const ms = hours * 60 * 60 * 1000;
  // First backup 60s after boot, then every interval
  setTimeout(runBackupCycle, 60_000);
  setInterval(runBackupCycle, ms);
  const { S3_BUCKET } = process.env;
  console.log(`[backup] scheduled every ${hours}h ${S3_BUCKET ? '(local + S3 upload)' : '(local only)'}`);
}

module.exports = { startScheduledBackups, runBackupCycle, buildBackup };
