import React, { FormEvent, useEffect, useRef, useState } from 'react';

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ArchitectureAssistantProps = {
  provinceName: string;
  archName: string;
  card: string;
  sections: { title: string; body: string }[];
};

const MAX_INPUT_LENGTH = 1000;
const MAX_MESSAGES_TO_SEND = 10;

function getErrorMessage(status: number, fallback: string) {
  if (status === 400) return '问题内容不完整，请调整后再试。';
  if (status === 405) return '当前服务暂不支持这个请求方式。';
  if (status >= 500) return '榫灵暂时无法连接问答服务，请稍后再试。';
  return fallback;
}

export default function ArchitectureAssistant({
  provinceName,
  archName,
  card,
  sections,
}: ArchitectureAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || loading) return;
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setError(`问题请控制在 ${MAX_INPUT_LENGTH} 字以内。`);
      return;
    }

    const userMessage: AssistantMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-MAX_MESSAGES_TO_SEND),
          context: {
            provinceName,
            archName,
            card,
            sections,
          },
        }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const serverError =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error?: unknown }).error)
            : '';
        throw new Error(serverError || getErrorMessage(response.status, '榫灵暂时无法回答，请稍后再试。'));
      }

      if (!payload || typeof payload !== 'object' || !('message' in payload)) {
        throw new Error('问答服务返回格式异常。');
      }

      const assistantContent = String((payload as { message?: unknown }).message || '').trim();
      if (!assistantContent) {
        throw new Error('榫灵没有返回有效内容。');
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: assistantContent },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '榫灵暂时无法回答，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="architecture-assistant" aria-live="polite">
      {open && (
        <section className="assistant-panel" aria-label="榫灵古建问答">
          <div className="assistant-header">
            <div>
              <h2>榫灵 · 古建问答</h2>
              <p>正在了解：{provinceName} · {archName}</p>
            </div>
            <button
              className="assistant-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭榫灵"
            >
              ×
            </button>
          </div>

          <div className="assistant-messages" ref={messagesRef}>
            {messages.length === 0 && (
              <div className="assistant-empty">
                可以问我这座建筑的结构、历史、工艺或文化寓意。
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`assistant-message assistant-message--${message.role}`}
              >
                <span>{message.role === 'user' ? '你' : '榫灵'}</span>
                <p>{message.content}</p>
              </div>
            ))}
            {loading && <div className="assistant-thinking">榫灵正在思考……</div>}
          </div>

          {error && <div className="assistant-error">{error}</div>}

          <form className="assistant-input" onSubmit={handleSubmit}>
            <textarea
              value={input}
              maxLength={MAX_INPUT_LENGTH}
              onChange={(event) => setInput(event.target.value)}
              placeholder="问问榫灵：这座建筑最特别的地方是什么？"
              disabled={loading}
              rows={2}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              发送
            </button>
          </form>
        </section>
      )}

      <button
        className="assistant-fab"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? '收起榫灵' : '打开榫灵'}
      >
        榫灵
      </button>
    </div>
  );
}
