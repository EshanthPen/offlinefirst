const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// regenerated each boot if not set, so sessions die on restart
const SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
const TEACHER_PIN = process.env.TEACHER_PIN || null;
const AUTH_ENABLED = !!TEACHER_PIN;

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function issueTeacherToken() {
  return sign({ role: 'teacher', iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS });
}

function checkPin(pin) {
  if (!TEACHER_PIN) return false;
  if (typeof pin !== 'string' || pin.length !== TEACHER_PIN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(TEACHER_PIN));
}

function requireTeacher(req, res, next) {
  if (!AUTH_ENABLED) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verify(token);
  if (!payload || payload.role !== 'teacher') {
    return res.status(401).json({ error: 'unauthorized', authRequired: true });
  }
  req.auth = payload;
  next();
}

module.exports = {
  AUTH_ENABLED,
  checkPin,
  issueTeacherToken,
  verify,
  requireTeacher
};
