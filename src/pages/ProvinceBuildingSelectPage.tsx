import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProvinceBuildingGroup } from '../data/provinceBuildings';

const provincePhotoModules = import.meta.glob('../assets/buildings/*/photo.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

type LocalComment = {
  id: number;
  content: string;
  createdAt: string;
};

function getProvincePhotoUrl(provinceId: string): string {
  return provincePhotoModules[`../assets/buildings/${provinceId}/photo.png`] || '';
}

export default function ProvinceBuildingSelectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const provinceId = id || '';
  const group = useMemo(() => getProvinceBuildingGroup(provinceId), [provinceId]);
  const provincePhotoUrl = useMemo(() => getProvincePhotoUrl(provinceId), [provinceId]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<LocalComment[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [provinceId]);

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextContent = commentText.trim();
    if (!nextContent) return;

    setComments((current) => [
      {
        id: Date.now(),
        content: nextContent,
        createdAt: new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      ...current,
    ]);
    setCommentText('');
  };

  return (
    <main className="province-branch-page">
      <section className="province-branch-shell" aria-labelledby="province-branch-title">
        <div className="province-branch-layout">
          <aside className="province-branch-visual" aria-label={`${group.provinceName}展示区`}>
            <div className="province-branch-visual__stage">
              <div className="province-branch-visual__mapmark">
                <span>{group.provinceName}</span>
              </div>
              <div className="province-branch-visual__placeholder">
                <span>省份视觉素材占位区</span>
              </div>
            </div>
            <div className="province-branch-visual__copy">
              <span>当前省份</span>
              <h1 id="province-branch-title">{group.provinceName}</h1>
              <p>从地图进入后，该省份在这里被放大展示。后续可替换为省份轮廓、地图切片或专属插画素材。</p>
            </div>
          </aside>

          <section className="province-branch-buildings" aria-label={`${group.provinceName}建筑列表`}>
            <div className="province-branch-buildings__head">
              <span>建筑选择</span>
              <h2>选择要了解的建筑</h2>
            </div>
            <div className="province-branch-building-list">
              {group.buildings.map((building, index) => {
                const thumbnailUrl = index === 0 ? provincePhotoUrl : '';

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
              rows={4}
            />
            <button type="submit" className="province-branch-button province-branch-button--solid">
              提交评论
            </button>
          </form>
          <div className="province-branch-comment-list">
            {comments.length === 0 ? (
              <p className="province-branch-comment-empty">暂无评论，欢迎发表看法</p>
            ) : (
              comments.map((comment) => (
                <article key={comment.id} className="province-branch-comment-item">
                  <time>{comment.createdAt}</time>
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
