export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ meta?: { last_row_id?: number } }>;
};

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

export type AuthEnv = {
  COMMENTS_DB?: D1Database;
};

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
};

export type PublicUser = {
  id: number;
  username: string;
  createdAt: string;
};

const PASSWORD_SCHEME = 'pbkdf2_sha256';
const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEY_LENGTH_BITS = 256;
const SESSION_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{2,24}$/u;

const encoder = new TextEncoder();

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function getAuthDb(env: AuthEnv) {
  return env.COMMENTS_DB || null;
}

export function publicUser(user: Pick<UserRow, 'id' | 'username' | 'created_at'>): PublicUser {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
  };
}

export async function parseJsonBody(request: Request) {
  try {
    const body = await request.json();
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function validateCredentials(body: Record<string, unknown>) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: '用户名需为 2-24 位，可使用中文、字母、数字、下划线或短横线。',
    };
  }

  if (password.length < 6) {
    return { error: '密码至少需要 6 位。' };
  }

  return { username, password };
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        if (index === -1) return [part, ''];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

export function getSessionToken(request: Request) {
  return parseCookies(request.headers.get('cookie') || '').auth_token || '';
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]*$/i.test(hex) || hex.length % 2 !== 0) return null;

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function base64UrlFromBytes(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function toArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations,
    },
    key,
    PASSWORD_KEY_LENGTH_BITS,
  );
  return new Uint8Array(bits);
}

export async function createPasswordHash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  return `${PASSWORD_SCHEME}$${PASSWORD_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterationsRaw, saltHex, hashHex] = String(stored).split('$');
  const iterations = Number(iterationsRaw);
  const salt = hexToBytes(saltHex || '');
  const expected = hexToBytes(hashHex || '');

  if (scheme !== PASSWORD_SCHEME || !Number.isInteger(iterations) || iterations < 1 || !salt || !expected) {
    return false;
  }

  const candidate = await derivePasswordHash(password, salt, iterations);
  if (candidate.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate[index] ^ expected[index];
  }
  return difference === 0;
}

export async function createSession(db: D1Database, userId: number) {
  const token = base64UrlFromBytes(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  await db
    .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expiresAt)
    .run();

  return token;
}

export function setSessionCookie(token: string) {
  return `auth_token=${encodeURIComponent(token)}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

export function clearSessionCookie() {
  return 'auth_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure';
}

export async function getCurrentUser(request: Request, db: D1Database) {
  const token = getSessionToken(request);
  if (!token) return null;

  const now = new Date().toISOString();
  await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now).run();

  return db
    .prepare(
      `
        SELECT users.id, users.username, users.created_at
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ? AND sessions.expires_at > ?
      `,
    )
    .bind(token, now)
    .first<Pick<UserRow, 'id' | 'username' | 'created_at'>>();
}
