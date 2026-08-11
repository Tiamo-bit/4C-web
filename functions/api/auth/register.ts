import {
  AuthEnv,
  UserRow,
  createPasswordHash,
  createSession,
  getAuthDb,
  jsonResponse,
  parseJsonBody,
  publicUser,
  setSessionCookie,
  validateCredentials,
} from '../../_shared/auth';

type PagesEvent = {
  request: Request;
  env: AuthEnv;
};

export async function onRequest({ request, env }: PagesEvent): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const db = getAuthDb(env);
  if (!db) {
    return jsonResponse({ error: 'Auth database is not configured' }, 503);
  }

  const body = await parseJsonBody(request);
  if (!body) return jsonResponse({ error: 'Invalid JSON body' }, 400);

  const credentials = validateCredentials(body);
  if ('error' in credentials) return jsonResponse({ error: credentials.error }, 400);

  try {
    const passwordHash = await createPasswordHash(credentials.password);
    const result = await db
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .bind(credentials.username, passwordHash)
      .run();

    const user = await db
      .prepare('SELECT id, username, password_hash, created_at FROM users WHERE id = ?')
      .bind(result.meta?.last_row_id || 0)
      .first<UserRow>();

    if (!user) return jsonResponse({ error: 'User was not saved' }, 500);

    const token = await createSession(db, user.id);
    return jsonResponse({ user: publicUser(user) }, 201, {
      'Set-Cookie': setSessionCookie(token),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('UNIQUE') || message.includes('constraint')) {
      return jsonResponse({ error: '用户名已存在。' }, 409);
    }

    console.error('Auth register API error', message);
    return jsonResponse({ error: 'Register service error' }, 500);
  }
}
