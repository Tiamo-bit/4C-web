import { AuthEnv, getAuthDb, getCurrentUser, jsonResponse, publicUser } from '../../_shared/auth';

type PagesEvent = {
  request: Request;
  env: AuthEnv;
};

export async function onRequest({ request, env }: PagesEvent): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const db = getAuthDb(env);
  if (!db) {
    return jsonResponse({ user: null });
  }

  try {
    const user = await getCurrentUser(request, db);
    return jsonResponse({ user: user ? publicUser(user) : null });
  } catch (error) {
    console.error('Auth me API error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Auth service error' }, 500);
  }
}
