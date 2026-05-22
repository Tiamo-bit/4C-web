type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type BuildingContext = {
  provinceName: string;
  archName: string;
  card: string;
  sections: { title: string; body: string }[];
};

type PagesEvent = {
  request: Request;
  env: {
    AI_API_KEY?: string;
    AI_BASE_URL?: string;
    AI_MODEL?: string;
  };
};

type ProviderInput = {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  context: BuildingContext;
};

const MAX_USER_MESSAGE_LENGTH = 1000;
const MAX_CONTEXT_FIELD_LENGTH = 2400;
const MAX_MESSAGES = 10;
const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-v4-flash';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) return null;

  const messages = value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      role: item.role,
      content: item.content,
    }))
    .filter(
      (item): item is ChatMessage =>
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0
    )
    .map((item) => ({
      role: item.role,
      content: truncate(item.content.trim(), MAX_USER_MESSAGE_LENGTH),
    }))
    .slice(-MAX_MESSAGES);

  return messages.length > 0 ? messages : null;
}

function parseContext(value: unknown): BuildingContext | null {
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
    .filter((section): section is Record<string, unknown> => isRecord(section))
    .map((section) => ({
      title: typeof section.title === 'string' ? section.title : '',
      body: typeof section.body === 'string' ? section.body : '',
    }))
    .filter((section) => section.title.trim() && section.body.trim())
    .slice(0, 6)
    .map((section) => ({
      title: truncate(section.title.trim(), 120),
      body: truncate(section.body.trim(), MAX_CONTEXT_FIELD_LENGTH),
    }));

  if (!provinceName.trim() || !archName.trim() || parsedSections.length === 0) {
    return null;
  }

  return {
    provinceName: truncate(provinceName.trim(), 80),
    archName: truncate(archName.trim(), 120),
    card: truncate(card.trim(), MAX_CONTEXT_FIELD_LENGTH),
    sections: parsedSections,
  };
}

function buildSystemPrompt(context: BuildingContext) {
  const sectionText = context.sections
    .map((section) => `【${section.title}】${section.body}`)
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

async function callOpenAICompatibleProvider(input: ProviderInput): Promise<string> {
  const baseUrl = input.baseUrl.replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: buildSystemPrompt(input.context) },
        ...input.messages,
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider request failed with ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    throw new Error('Provider returned an invalid response');
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error('Provider returned no message');
  }

  const content = firstChoice.message.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Provider returned empty content');
  }

  return content.trim();
}

export async function onRequest({ request, env }: PagesEvent): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!isRecord(body)) {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const messages = parseMessages(body.messages);
  const context = parseContext(body.context);

  if (!messages || !context) {
    return jsonResponse({ error: 'Missing or invalid messages/context' }, 400);
  }

  if (!env.AI_API_KEY) {
    return jsonResponse({ error: 'AI assistant is not configured' }, 500);
  }

  try {
    const message = await callOpenAICompatibleProvider({
      apiKey: env.AI_API_KEY,
      baseUrl: env.AI_BASE_URL || DEFAULT_BASE_URL,
      model: env.AI_MODEL || DEFAULT_MODEL,
      messages,
      context,
    });

    return jsonResponse({ message });
  } catch (error) {
    console.error('AI provider error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Provider error' }, 500);
  }
}
