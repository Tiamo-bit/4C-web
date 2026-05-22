import express from 'express';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const dataDir = join(rootDir, 'data');
mkdirSync(dataDir, { recursive: true });

loadLocalEnv(join(rootDir, '.env'));
loadLocalEnv(join(rootDir, '.dev.vars'));

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

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province_id TEXT NOT NULL,
    user_id INTEGER,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_comments_province_id_created_at
    ON comments (province_id, created_at DESC);
`);

const app = express();
const PORT = Number(process.env.PORT || 4174);
const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{2,24}$/u;
const PROVINCE_ID_PATTERN = /^[a-z0-9_-]{1,48}$/i;
const SESSION_DAYS = 7;
const MAX_COMMENT_LENGTH = 500;
const COMMENT_LIMIT = 100;
const MAX_CHAT_MESSAGE_LENGTH = 1000;
const MAX_CHAT_CONTEXT_FIELD_LENGTH = 2400;
const MAX_CHAT_MESSAGES = 10;
const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-v4-flash';

app.use(express.json({ limit: '10kb' }));

function loadLocalEnv(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

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

function publicComment(comment) {
  return {
    id: comment.id,
    provinceId: comment.province_id,
    userId: comment.user_id ?? null,
    authorName: comment.author_name,
    content: comment.content,
    createdAt: comment.created_at,
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

function validateProvinceId(value) {
  const provinceId = String(value || '').trim();
  if (!PROVINCE_ID_PATTERN.test(provinceId)) {
    return { error: '省份参数无效。' };
  }
  return { provinceId };
}

function validateCommentContent(value) {
  const content = String(value || '').trim();
  if (!content) {
    return { error: '评论内容不能为空。' };
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return { error: `评论请控制在 ${MAX_COMMENT_LENGTH} 字以内。` };
  }
  return { content };
}

function truncateText(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

function parseChatMessages(value) {
  if (!Array.isArray(value)) return null;

  const messages = value
    .filter(isRecord)
    .map(item => ({
      role: item.role,
      content: item.content,
    }))
    .filter(item =>
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string' &&
      item.content.trim().length > 0
    )
    .map(item => ({
      role: item.role,
      content: truncateText(item.content.trim(), MAX_CHAT_MESSAGE_LENGTH),
    }))
    .slice(-MAX_CHAT_MESSAGES);

  return messages.length > 0 ? messages : null;
}

function parseChatContext(value) {
  if (!isRecord(value)) return null;

  const { provinceName, archName, card, sections } = value;
  if (
    typeof provinceName !== 'string' ||
    typeof archName !== 'string' ||
    typeof card !== 'string' ||
    !Array.isArray(sections)
  ) {
    return null;
  }

  const parsedSections = sections
    .filter(isRecord)
    .map(section => ({
      title: typeof section.title === 'string' ? section.title : '',
      body: typeof section.body === 'string' ? section.body : '',
    }))
    .filter(section => section.title.trim() && section.body.trim())
    .slice(0, 6)
    .map(section => ({
      title: truncateText(section.title.trim(), 120),
      body: truncateText(section.body.trim(), MAX_CHAT_CONTEXT_FIELD_LENGTH),
    }));

  if (!provinceName.trim() || !archName.trim() || parsedSections.length === 0) {
    return null;
  }

  return {
    provinceName: truncateText(provinceName.trim(), 80),
    archName: truncateText(archName.trim(), 120),
    card: truncateText(card.trim(), MAX_CHAT_CONTEXT_FIELD_LENGTH),
    sections: parsedSections,
  };
}

function buildChatSystemPrompt(context) {
  const sectionText = context.sections
    .map(section => `【${section.title}】${section.body}`)
    .join('\n');

  return [
    '你叫“榫灵”，是一个中国古代建筑科普小助手。',
    '回答要简洁、准确、适合普通用户阅读。优先结合当前页面的建筑资料回答。',
    '如果用户问题超出当前资料，可以用通俗方式补充相关古建筑常识，但不要编造具体史实。',
    '当前页面资料：',
    `省份/地区：${context.provinceName}`,
    `建筑：${context.archName}`,
    `建筑名片：${context.card}`,
    `章节资料：\n${sectionText}`,
  ].join('\n');
}

async function callOpenAICompatibleProvider({ apiKey, baseUrl, model, messages, context }) {
  const endpoint = baseUrl.replace(/\/+$/, '');
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: buildChatSystemPrompt(context) },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider request failed with ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Provider returned no message');
  }

  return content.trim();
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

app.get('/api/comments', (req, res) => {
  const province = validateProvinceId(req.query.provinceId);
  if (province.error) return res.status(400).json({ error: province.error });

  const comments = db.prepare(`
    SELECT id, province_id, user_id, author_name, content, created_at
    FROM comments
    WHERE province_id = ?
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT ?
  `).all(province.provinceId, COMMENT_LIMIT);

  res.json({ comments: comments.map(publicComment) });
});

app.post('/api/comments', (req, res) => {
  const province = validateProvinceId(req.body?.provinceId);
  if (province.error) return res.status(400).json({ error: province.error });

  const comment = validateCommentContent(req.body?.content);
  if (comment.error) return res.status(400).json({ error: comment.error });

  const user = getCurrentUser(req);
  const result = db.prepare(`
    INSERT INTO comments (province_id, user_id, author_name, content)
    VALUES (?, ?, ?, ?)
  `).run(province.provinceId, user?.id ?? null, user?.username ?? '游客', comment.content);

  const savedComment = db.prepare(`
    SELECT id, province_id, user_id, author_name, content, created_at
    FROM comments
    WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment: publicComment(savedComment) });
});

app.post('/api/chat', async (req, res) => {
  const messages = parseChatMessages(req.body?.messages);
  const context = parseChatContext(req.body?.context);

  if (!messages || !context) {
    return res.status(400).json({ error: 'Missing or invalid messages/context' });
  }

  if (!process.env.AI_API_KEY) {
    return res.status(500).json({ error: 'AI assistant is not configured' });
  }

  try {
    const message = await callOpenAICompatibleProvider({
      apiKey: process.env.AI_API_KEY,
      baseUrl: process.env.AI_BASE_URL || DEFAULT_AI_BASE_URL,
      model: process.env.AI_MODEL || DEFAULT_AI_MODEL,
      messages,
      context,
    });

    res.json({ message });
  } catch (error) {
    console.error('AI provider error', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Provider error' });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.error(error);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
