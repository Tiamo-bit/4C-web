import {
  AuthEnv,
  UserRow,
  createSession,
  getAuthDb,
  jsonResponse,
  parseJsonBody,
  publicUser,
  setSessionCookie,
  validateCredentials,
  verifyPassword,
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
    const user = await db
      .prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?')
      .bind(credentials.username)
      .first<UserRow>();

    if (!user || !(await verifyPassword(credentials.password, user.password_hash))) {
      return jsonResponse({ error: '用户名或密码错误。' }, 401);
    }

    const token = await createSession(db, user.id);
    return jsonResponse({ user: publicUser(user) }, 200, {
      'Set-Cookie': setSessionCookie(token),
    });
  } catch (error) {
    console.error('Auth login API error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Login service error' }, 500);
  }
}
