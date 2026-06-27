import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getBuildingAssetKey,
  getProvinceBuildingGroup,
  PRIMARY_BUILDING_ID,
} from '../data/provinceBuildings';

const provinceMapModules = import.meta.glob('../assets/province-maps/*.{png,jpg,jpeg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const provinceMapUrls = Object.entries(provinceMapModules).reduce<Record<string, string>>(
  (urls, [path, url]) => {
    const match = path.match(/province-maps\/([^/]+)\.(?:png|jpe?g)$/);
    if (match) urls[match[1]] = url;
    return urls;
  },
  {}
);

const provincePhotoModules = import.meta.glob('../assets/buildings/**/photo.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const provincePhotoUrls = Object.fromEntries(
  Object.entries(provincePhotoModules).map(([path, url]) => {
    const match = path.match(/buildings\/([^/]+)(?:\/([^/]+))?\/photo\.png$/);
    const assetKey = match ? getBuildingAssetKey(match[1], match[2] || PRIMARY_BUILDING_ID) : '';
    return [assetKey, url];
  })
);

type PersistedComment = {
  id: number;
  provinceId: string;
  userId: number | null;
  authorName: string;
  content: string;
  createdAt: string;
};

function getBuildingPhotoUrl(provinceId: string, buildingId: string): string {
  return provincePhotoUrls[getBuildingAssetKey(provinceId, buildingId)] || '';
}

async function requestComments(provinceId: string) {
  const response = await fetch(`/api/comments?provinceId=${encodeURIComponent(provinceId)}`, {
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '评论加载失败，请稍后再试。');
  }
  return {
    comments: Array.isArray(data.comments) ? (data.comments as PersistedComment[]) : [],
  };
}

async function createComment(provinceId: string, content: string) {
  const response = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ provinceId, content }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '评论提交失败，请稍后再试。');
  }
  if (!data.comment || typeof data.comment !== 'object') {
    throw new Error('评论服务返回格式异常，请稍后再试。');
  }
  return data as { comment: PersistedComment };
}

export default function ProvinceBuildingSelectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const provinceId = id || '';
  const group = useMemo(() => getProvinceBuildingGroup(provinceId), [provinceId]);
  const provinceMapUrl = provinceMapUrls[provinceId];
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<PersistedComment[]>([]);
  const [commentError, setCommentError] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [provinceId]);

  useEffect(() => {
    if (!provinceId) return;
    let cancelled = false;
    setCommentsLoading(true);
    setCommentError('');

    requestComments(provinceId)
      .then((data) => {
        if (!cancelled) setComments(data.comments);
      })
      .catch((error) => {
        if (!cancelled) {
          setComments([]);
          setCommentError(error instanceof Error ? error.message : '评论加载失败，请稍后再试。');
        }
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [provinceId]);

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextContent = commentText.trim();
    if (!nextContent || commentSubmitting) return;

    setCommentSubmitting(true);
    setCommentError('');
    try {
      const data = await createComment(provinceId, nextContent);
      setComments((current) => [data.comment, ...current]);
      setCommentText('');
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : '评论提交失败，请稍后再试。');
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <main className="province-branch-page">
      <section className="province-branch-shell" aria-labelledby="province-branch-title">
        <div className="province-branch-layout">
          <aside className="province-branch-visual" aria-label={`${group.provinceName}展示区`}>
            <div className="province-branch-visual__stage">
              {provinceMapUrl ? (
                <img
                  className="province-branch-visual__map"
                  src={provinceMapUrl}
                  alt={`${group.provinceName}省份图`}
                />
              ) : (
                <>
                  <div className="province-branch-visual__mapmark">
                    <span>{group.provinceName}</span>
                  </div>
                  <div className="province-branch-visual__placeholder">
                    <span>省份视觉素材占位区</span>
                  </div>
                </>
              )}
            </div>
            <div className="province-branch-visual__copy">
              <span>当前省份</span>
              <h1 id="province-branch-title">{group.provinceName}</h1>
              <p>沿省域图景进入代表建筑，继续探索当地传统营造智慧。</p>
            </div>
          </aside>

          <section className="province-branch-buildings" aria-label={`${group.provinceName}建筑列表`}>
            <div className="province-branch-buildings__head">
              <span>建筑选择</span>
              <h2>选择要了解的建筑</h2>
            </div>
            <div className="province-branch-building-list">
              {group.buildings.map((building) => {
                const thumbnailUrl = getBuildingPhotoUrl(provinceId, building.id);
                return (
                  <article key={building.id} className="province-branch-building-card">
                    <div className="province-branch-building-card__thumb">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={`${group.provinceName}${building.name}缩略图`} />
                      ) : (
                        <span>缩略图占位</span>
                      )}
                    </div>
                    <div className="province-branch-building-card__body">
                      <h3>{building.name}</h3>
                      <p>{building.description}</p>
                      <button
                        type="button"
                        className="province-branch-button"
                        disabled={!building.detailPath}
                        onClick={() => {
                          if (building.detailPath) navigate(building.detailPath);
                        }}
                      >
                        {building.detailPath ? '进入查看' : '资料待补充'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <section className="province-branch-comments" aria-label="评论区">
          <div className="province-branch-comments__head">
            <span>讨论区</span>
            <h2>关于{group.provinceName}的看法</h2>
          </div>
          <form className="province-branch-comment-form" onSubmit={handleSubmitComment}>
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="写下你对这个省份或建筑的看法"
              maxLength={500}
              rows={4}
            />
            <button
              type="submit"
              className="province-branch-button province-branch-button--solid"
              disabled={commentSubmitting || !commentText.trim()}
            >
              {commentSubmitting ? '提交中' : '提交评论'}
            </button>
          </form>
          {commentError && <p className="province-branch-comment-error">{commentError}</p>}
          <div className="province-branch-comment-list">
            {commentsLoading ? (
              <p className="province-branch-comment-empty">评论加载中...</p>
            ) : comments.length === 0 ? (
              <p className="province-branch-comment-empty">暂无评论，欢迎发表看法</p>
            ) : (
              comments.map((comment) => (
                <article key={comment.id} className="province-branch-comment-item">
                  <time>{comment.authorName} - {comment.createdAt}</time>
                  <p>{comment.content}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
