import express from 'express';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const dataDir = join(rootDir, 'data');
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, 'auth.sqlite'));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const app = express();
const PORT = Number(process.env.PORT || 4174);
const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{2,24}$/u;
const SESSION_DAYS = 7;

app.use(express.json({ limit: '10kb' }));

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const index = part.indexOf('=');
        if (index === -1) return [part, ''];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function createPasswordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 120_000, 32, 'sha256').toString('hex');
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [scheme, iterations, salt, hash] = String(stored).split('$');
  if (scheme !== 'pbkdf2_sha256' || !iterations || !salt || !hash) return false;
  const candidate = pbkdf2Sync(password, salt, Number(iterations), 32, 'sha256');
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
  };
}

function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

function setSessionCookie(res, token) {
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie('auth_token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

function getCurrentUser(req) {
  const token = parseCookies(req.headers.cookie).auth_token;
  if (!token) return null;

  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
  return db.prepare(`
    SELECT users.id, users.username, users.created_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ? AND sessions.expires_at > ?
  `).get(token, new Date().toISOString()) || null;
}

function validateCredentials(usernameInput, passwordInput) {
  const username = String(usernameInput || '').trim();
  const password = String(passwordInput || '');

  if (!USERNAME_PATTERN.test(username)) {
    return { error: '用户名需为 2-24 位，可使用中文、字母、数字、下划线或短横线。' };
  }
  if (password.length < 6) {
    return { error: '密码至少需要 6 位。' };
  }
  return { username, password };
}

app.get('/api/auth/me', (req, res) => {
  const user = getCurrentUser(req);
  res.json({ user: user ? publicUser(user) : null });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie).auth_token;
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post('/api/auth/register', (req, res, next) => {
  try {
    const credentials = validateCredentials(req.body?.username, req.body?.password);
    if (credentials.error) return res.status(400).json({ error: credentials.error });

    const result = db
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run(credentials.username, createPasswordHash(credentials.password));
    const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    setSessionCookie(res, createSession(user.id));
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ error: '这个用户名已经被使用。' });
    }
    next(error);
  }
});

app.post('/api/auth/login', (req, res) => {
  const credentials = validateCredentials(req.body?.username, req.body?.password);
  if (credentials.error) return res.status(400).json({ error: credentials.error });

  const user = db.prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?').get(credentials.username);
  if (!user || !verifyPassword(credentials.password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码不正确。' });
  }

  setSessionCookie(res, createSession(user.id));
  res.json({ user: publicUser(user) });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Auth API listening on http://localhost:${PORT}`);
});
