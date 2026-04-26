import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { PROVINCE_CONTENT } from '../data/provinces';
import RevealText from '../components/RevealText';
import RevealParagraph from '../components/RevealParagraph';

/* ────────────────────── 默认兜底数据 ────────────────────── */
const DEFAULT_CONTENT = {
  name: '未知地域',
  arch: '神秘古建',
  subtitle: '在这片土地上，还有更多未知的榫卯智慧等待你去探索与修复',
  card: '这里隐藏着中国古代建筑的智慧密码，等待你的探索。',
  sections: [
    { title: '身世溯源', body: '这片土地拥有悠久的建筑历史，等待探索。' },
    { title: '建筑亮点', body: '独特的建筑工艺与营造智慧，值得深入研究。' },
    { title: '历史高光', body: '历经千年风雨，依然屹立不倒的文化传奇。' },
  ],
  highlights: ['古建筑'],
  totalPieces: 9,
};

/* ─── 动态获取省份实景图 ─── */
function getPhotoUrl(id: string): string {
  try {
    return new URL(`../assets/buildings/${id}/photo.png`, import.meta.url).href;
  } catch {
    return '';
  }
}

/* ────────────── 章节组件：标题 + 正文 (scroll-triggered) ────────────── */
function NarrativeSection({ section, index }: { section: { title: string; body: string }; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-8% 0px' });
  const icons = ['📜', '🏛️', '⚡'];

  return (
    <motion.section
      ref={ref}
      className="learn-section"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      <div className="learn-section__number">
        <span className="learn-section__icon">{icons[index] || '📖'}</span>
        <span className="learn-section__index">{'零壹贰叁肆'[index + 1] || '章'}</span>
      </div>
      <h3 className="learn-section__title">
        <RevealText text={section.title} delay={0.15} />
      </h3>
      <motion.div
        className="learn-section__divider"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
      <div className="learn-section__body">
        <RevealParagraph text={section.body} />
      </div>
    </motion.section>
  );
}

/* ────────────────────────── 主页面 ────────────────────────── */
export default function LearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const content = PROVINCE_CONTENT[id || ''] || DEFAULT_CONTENT;
  const photoUrl = getPhotoUrl(id || '');

  const [progress, setProgress] = useState(0);
  const [fragments, setFragments] = useState<number[]>([]);
  const [bgLoaded, setBgLoaded] = useState(false);

  /* 滚动到顶部 */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  /* 预加载背景图 */
  useEffect(() => {
    if (!photoUrl) return;
    const img = new Image();
    img.src = photoUrl;
    img.onload = () => setBgLoaded(true);
  }, [photoUrl]);

  /* 恢复进度 */
  useEffect(() => {
    const savedProgress = localStorage.getItem(`learn_progress_${id}`);
    const savedFragments = localStorage.getItem(`fragments_${id}`);
    if (savedProgress) setProgress(Number(savedProgress));
    if (savedFragments) setFragments(JSON.parse(savedFragments));
  }, [id]);

  const handleStudy = () => {
    if (progress >= 100) return;
    const step = 100 / content.totalPieces;
    const newProgress = Math.min(100, progress + step);
    setProgress(newProgress);
    localStorage.setItem(`learn_progress_${id}`, newProgress.toString());
    if (Math.floor(newProgress / step) > fragments.length) {
      const newFragmentId = Math.floor(Math.random() * 1000);
      const updatedFragments = [...fragments, newFragmentId];
      setFragments(updatedFragments);
      localStorage.setItem(`fragments_${id}`, JSON.stringify(updatedFragments));
      alert(`恭喜！你深入研读了${content.arch}的历史，成功获得一块建筑核心碎片！`);
    }
  };

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const cardRef = useRef(null);
  const cardInView = useInView(cardRef, { once: true, margin: '-10% 0px' });
  const footerRef = useRef(null);
  const footerInView = useInView(footerRef, { once: true, margin: '-5% 0px' });

  return (
    <div className="learn-page">
      {/* ═══ 实景背景层（固定 + 虚化 + 渐显） ═══ */}
      <motion.div
        className="learn-page__bg"
        style={{ backgroundImage: `url(${photoUrl})` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: bgLoaded ? 1 : 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* ═══ 噪声纹理层 ═══ */}
      <div className="learn-page__noise" />

      {/* ═══════════ Hero 区域 ═══════════ */}
      <header ref={heroRef} className="learn-hero">
        <div className="learn-hero__inner">
          <motion.div
            className="learn-hero__province"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {content.name}
          </motion.div>
          <h1 className="learn-hero__title">
            <RevealText text={content.arch} delay={0.25} />
          </h1>
          <motion.p
            className="learn-hero__subtitle"
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.6 }}
          >
            {content.subtitle}
          </motion.p>
          <motion.div
            className="learn-hero__tags"
            initial={{ opacity: 0, y: 16 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            {content.highlights.map((tag, i) => (
              <span key={i} className="learn-tag">{tag}</span>
            ))}
          </motion.div>
          <motion.div
            className="learn-hero__scroll-hint"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span>↓ 向下滚动探索 ↓</span>
          </motion.div>
        </div>
      </header>

      {/* ═══════════ 建筑名片 ═══════════ */}
      <motion.div
        ref={cardRef}
        className="learn-card"
        initial={{ opacity: 0, y: 40 }}
        animate={cardInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="learn-card__header">
          <span className="learn-card__icon">🏷️</span>
          <span className="learn-card__label">建筑名片</span>
        </div>
        <p className="learn-card__text">{content.card}</p>
      </motion.div>

      {/* ═══════════ 叙事章节（身世溯源 / 建筑亮点 / 历史高光） ═══════════ */}
      <div className="learn-narrative">
        {content.sections.map((section, index) => (
          <NarrativeSection key={index} section={section} index={index} />
        ))}
      </div>

      {/* ═══════════ 底部操作区 ═══════════ */}
      <motion.footer
        ref={footerRef}
        className="learn-footer"
        initial={{ opacity: 0, y: 40 }}
        animate={footerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="learn-footer__progress">
          <div className="learn-footer__progress-header">
            <span className="learn-footer__progress-label">结构研读进度</span>
            <span className="learn-footer__progress-value">{Math.round(progress)}%</span>
          </div>
          <div className="learn-footer__progress-track">
            <motion.div
              className="learn-footer__progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
            />
          </div>
        </div>
        <div className="learn-footer__fragments">
          {Array.from({ length: content.totalPieces }).map((_, i) => (
            <motion.div
              key={i}
              className={`learn-footer__fragment ${i < fragments.length ? 'is-collected' : ''}`}
              initial={{ scale: 0 }}
              animate={footerInView ? { scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{i < fragments.length ? '✦' : '◇'}</span>
            </motion.div>
          ))}
        </div>
        <div className="learn-footer__actions">
          <motion.button
            className={`learn-btn learn-btn--primary ${progress >= 100 ? 'is-complete' : ''}`}
            whileHover={{ scale: progress >= 100 ? 1 : 1.04 }}
            whileTap={{ scale: progress >= 100 ? 1 : 0.96 }}
            onClick={handleStudy}
            disabled={progress >= 100}
          >
            {progress >= 100 ? '✓ 研读大成' : '潜心钻研'}
          </motion.button>
          <motion.button
            className="learn-btn learn-btn--secondary"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/puzzle/' + id)}
          >
            开启榫卯拼图 ({fragments.length}/{content.totalPieces})
          </motion.button>
          <motion.button
            className="learn-btn learn-btn--ghost"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/map')}
          >
            ← 返回地图
          </motion.button>
        </div>
      </motion.footer>
    </div>
  );
}
