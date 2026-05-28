type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ meta?: { last_row_id?: number } }>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

type PagesEvent = {
  request: Request;
  env: {
    COMMENTS_DB?: D1Database;
  };
};

type CommentRow = {
  id: number;
  province_id: string;
  user_id: number | null;
  author_name: string;
  content: string;
  created_at: string;
};

const COMMENT_LIMIT = 50;
const PROVINCE_ID_PATTERN = /^[a-z0-9_-]{1,48}$/i;
const MAX_COMMENT_LENGTH = 500;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function publicComment(row: CommentRow) {
  return {
    id: row.id,
    provinceId: row.province_id,
    userId: row.user_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

function getProvinceId(request: Request) {
  const provinceId = new URL(request.url).searchParams.get('provinceId')?.trim() || '';
  if (!PROVINCE_ID_PATTERN.test(provinceId)) return null;
  return provinceId;
}

function validateCommentContent(value: unknown) {
  if (typeof value !== 'string') return null;
  const content = value.trim();
  if (!content || content.length > MAX_COMMENT_LENGTH) return null;
  return content;
}

async function handleGet(request: Request, db: D1Database) {
  const provinceId = getProvinceId(request);
  if (!provinceId) return jsonResponse({ error: 'Invalid provinceId' }, 400);

  const { results = [] } = await db
    .prepare(`
      SELECT id, province_id, user_id, author_name, content, created_at
      FROM comments
      WHERE province_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT ?
    `)
    .bind(provinceId, COMMENT_LIMIT)
    .all<CommentRow>();

  return jsonResponse({ comments: results.map(publicComment) });
}

async function handlePost(request: Request, db: D1Database) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!isRecord(body)) return jsonResponse({ error: 'Invalid request body' }, 400);

  const provinceId = typeof body.provinceId === 'string' ? body.provinceId.trim() : '';
  if (!PROVINCE_ID_PATTERN.test(provinceId)) return jsonResponse({ error: 'Invalid provinceId' }, 400);

  const content = validateCommentContent(body.content);
  if (!content) return jsonResponse({ error: 'Comment content must be 1-500 characters' }, 400);

  const authorName = '游客';
  const result = await db
    .prepare(`
      INSERT INTO comments (province_id, user_id, author_name, content)
      VALUES (?, ?, ?, ?)
    `)
    .bind(provinceId, null, authorName, content)
    .run();

  const savedComment = await db
    .prepare(`
      SELECT id, province_id, user_id, author_name, content, created_at
      FROM comments
      WHERE id = ?
    `)
    .bind(result.meta?.last_row_id || 0)
    .first<CommentRow>();

  if (!savedComment) return jsonResponse({ error: 'Comment was not saved' }, 500);

  return jsonResponse({ comment: publicComment(savedComment) }, 201);
}

export async function onRequest({ request, env }: PagesEvent): Promise<Response> {
  if (!env.COMMENTS_DB) {
    if (request.method === 'GET') return jsonResponse({ comments: [] });
    return jsonResponse({ error: 'Comments database is not configured' }, 503);
  }

  try {
    if (request.method === 'GET') return handleGet(request, env.COMMENTS_DB);
    if (request.method === 'POST') return handlePost(request, env.COMMENTS_DB);
    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Comments API error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Comments service error' }, 500);
  }
}
