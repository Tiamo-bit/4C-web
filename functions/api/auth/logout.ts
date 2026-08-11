import { AuthEnv, clearSessionCookie, getAuthDb, getSessionToken, jsonResponse } from '../../_shared/auth';

type PagesEvent = {
  request: Request;
  env: AuthEnv;
};

export async function onRequest({ request, env }: PagesEvent): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const db = getAuthDb(env);
  const token = getSessionToken(request);

  try {
    if (db && token) {
      await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }

    return jsonResponse({ ok: true }, 200, {
      'Set-Cookie': clearSessionCookie(),
    });
  } catch (error) {
    console.error('Auth logout API error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Logout service error' }, 500, {
      'Set-Cookie': clearSessionCookie(),
    });
  }
}
