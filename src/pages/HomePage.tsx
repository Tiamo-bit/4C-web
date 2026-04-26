import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import RevealParagraph from '../components/RevealParagraph';

const ARCH_TERMS = ['京派四合院', '晋商大院', '陕北窑洞', '陇东地坑院', '苏式园林', '徽派粉墙黛瓦', '浙派台门院落', '闽南红砖古厝', '客家土楼', '川西吊脚楼', '傣家竹楼', '藏式碉房', '侗寨鼓楼', '蒙古包'];



const ARCH_POSITIONS = ARCH_TERMS.map((term, i) => {
  const size = 3 + (i % 4) * 2;
  const blur = (i % 3) * 2;
  const startX = 2 + (i * 7);
  const duration = 25 + ((i * 7) % 15);
  const delay = (i * 3.7) % 10;
  return { term, size, blur, startX, duration, delay };
});

const UnitCube = ({ transforms, isBacking }: any) => {
  const { x, y, z, sx, sy, sz } = transforms;
  const faceBase = isBacking ? '#2F251F' : '#9B7B52';
  const faceDark = isBacking ? '#1A1512' : '#7A5F3F';
  const faceShadow = isBacking ? '#000000' : '#4A3B2F';

  const getStyle = (transform: string, gradient: string) => ({
    position: 'absolute' as const,
    inset: 0,
    background: gradient,
    transform,
    border: '1px solid rgba(26,21,18,0.9)',
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
  });

  return (
    <motion.div style={{
      position: 'absolute', width: 100, height: 100, transformStyle: 'preserve-3d',
      x, y, z, scaleX: sx, scaleY: sy, scaleZ: sz,
      marginLeft: -50, marginTop: -50
    }}>
      <div style={getStyle('translateZ(50px)', `linear-gradient(135deg, ${faceBase}, ${faceDark})`)} />
      <div style={getStyle('rotateY(180deg) translateZ(50px)', `linear-gradient(135deg, ${faceDark}, ${faceShadow})`)} />
      <div style={getStyle('rotateY(90deg) translateZ(50px)', `linear-gradient(135deg, ${faceBase}, ${faceShadow})`)} />
      <div style={getStyle('rotateY(-90deg) translateZ(50px)', `linear-gradient(135deg, ${faceDark}, ${faceBase})`)} />
      <div style={getStyle('rotateX(90deg) translateZ(50px)', `linear-gradient(135deg, ${faceBase}, #AD8D61)`)} />
      <div style={getStyle('rotateX(-90deg) translateZ(50px)', `linear-gradient(135deg, ${faceShadow}, ${faceDark})`)} />
    </motion.div>
  )
}

// ==========================================
// 阶段一：开场动画 (六通解构 -> 红底竖排牌匾)
// ==========================================
const IntroPhase = ({ onEnterHub }: { onEnterHub: () => void }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollContainerRef });

  const steps = [0, 0.2, 0.5, 0.8, 1.0];
  const globalRotateX = useTransform(scrollYProgress, steps, [-35, -35, -15, 0, 0]);
  const globalRotateY = useTransform(scrollYProgress, steps, [45, 45, 20, 0, 0]);

  // 【修复】：真正的 X, Y, Z 三轴六根木柱建模，构成孔明锁六通

  // b1: X轴(横向) 前上 -> 牌匾上边框
  const b1 = {
    x: useTransform(scrollYProgress, steps, [0, 0, -300, 0, 0]),
    y: useTransform(scrollYProgress, steps, [-20, -20, -300, -260, -260]),
    z: useTransform(scrollYProgress, steps, [20, 20, 300, 0, 0]),
    sx: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 2.0, 2.0]), // 宽 200
    sy: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]), // 高 20
    sz: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]),
  };

  // b2: X轴(横向) 后下 -> 牌匾下边框
  const b2 = {
    x: useTransform(scrollYProgress, steps, [0, 0, 300, 0, 0]),
    y: useTransform(scrollYProgress, steps, [20, 20, 300, 260, 260]),
    z: useTransform(scrollYProgress, steps, [-20, -20, -300, 0, 0]),
    sx: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 2.0, 2.0]), // 宽 200
    sy: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]), // 高 20
    sz: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]),
  };

  // b3: Y轴(竖直) 左后 -> 牌匾左边框
  const b3 = {
    x: useTransform(scrollYProgress, steps, [-20, -20, -300, -90, -90]),
    y: useTransform(scrollYProgress, steps, [0, 0, -300, 0, 0]),
    z: useTransform(scrollYProgress, steps, [-20, -20, 300, 0, 0]),
    sx: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]), // 宽 20
    sy: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 5.0, 5.0]), // 高 500
    sz: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]),
  };

  // b4: Y轴(竖直) 右前 -> 牌匾右边框
  const b4 = {
    x: useTransform(scrollYProgress, steps, [20, 20, 300, 90, 90]),
    y: useTransform(scrollYProgress, steps, [0, 0, 300, 0, 0]),
    z: useTransform(scrollYProgress, steps, [20, 20, -300, 0, 0]),
    sx: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]), // 宽 20
    sy: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 5.0, 5.0]), // 高 500
    sz: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0.2, 0.2]),
  };

  // b5: Z轴(进深) 左上 -> 解构后消失（变为文字）
  const b5 = {
    x: useTransform(scrollYProgress, steps, [-20, -20, -300, 0, 0]),
    y: useTransform(scrollYProgress, steps, [-20, -20, -300, 0, 0]),
    z: useTransform(scrollYProgress, steps, [0, 0, 0, -50, -50]),
    sx: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sy: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sz: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 0, 0]),
  };

  // b6: Z轴(进深) 右下 -> 解构后消失（变为文字）
  const b6 = {
    x: useTransform(scrollYProgress, steps, [20, 20, 300, 0, 0]),
    y: useTransform(scrollYProgress, steps, [20, 20, 300, 0, 0]),
    z: useTransform(scrollYProgress, steps, [0, 0, 0, -50, -50]),
    sx: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sy: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sz: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 0, 0]),
  };

  // 文字显现：木构件消失后，文字浮现
  // 文字显现：用 React state 驱动，彻底绕开 framer-motion 的隐式 transform
  const [textVisible, setTextVisible] = useState(false);
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setTextVisible(v > 0.72);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <div ref={scrollContainerRef} style={{ width: '100vw', height: '100vh', overflowY: 'scroll', overflowX: 'hidden', position: 'relative', zIndex: 10 }}>
      <div style={{ height: '400vh', width: '100%' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '2000px' }}>

          {/* 3D 场景 */}
          <motion.div style={{ position: 'relative', transformStyle: 'preserve-3d', rotateX: globalRotateX, rotateY: globalRotateY }}>
            <UnitCube transforms={b1} />
            <UnitCube transforms={b2} />
            <UnitCube transforms={b3} />
            <UnitCube transforms={b4} />
            <UnitCube transforms={b5} />
            <UnitCube transforms={b6} />
          </motion.div>

          {/* 
            "中国古代建筑" 文字 —— 用纯 <div> 渲染，不使用 motion.div，
            放在 sticky 容器内部、preserve-3d 外部，用 z-index 压在 3D 场景上方
          */}
          <div
            onClick={() => {
              if (scrollYProgress.get() >= 0.8) onEnterHub();
            }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              writingMode: 'vertical-rl' as const,
              zIndex: 100,
              pointerEvents: textVisible ? 'auto' : 'none',
              opacity: textVisible ? 1 : 0,
              transition: 'opacity 0.6s ease',
              cursor: 'pointer',
            }}
          >
            <div style={{
              color: '#1A1512',
              fontSize: '54px',
              fontFamily: '"KaiTi", "STKaiti", "SimSun", serif',
              fontWeight: 900,
              letterSpacing: '18px',
              textShadow: '0 0 16px rgba(255,255,255,0.95), 0 0 40px rgba(255,255,255,0.7), 2px 2px 6px rgba(0,0,0,0.25)',
              paddingTop: '18px',
            }}>
              中国古代建筑
            </div>
          </div>

          <motion.div style={{ position: 'absolute', bottom: '40px', opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]), color: '#1A1512', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '4px' }}>
            向下滚动 ↓
          </motion.div>
        </div>
      </div>
    </div>
  );
};


// 阶段二：沉浸式全屏滚动 + 顶部全站导航


/* 全量省份列表（含有无数据标志） */
const ALL_PROVINCES = [
  { id: 'beijing', name: '北京' }, { id: 'tianjin', name: '天津' }, { id: 'hebei', name: '河北' },
  { id: 'shanxi', name: '山西' }, { id: 'neimenggu', name: '内蒙古' }, { id: 'liaoning', name: '辽宁' },
  { id: 'jilin', name: '吉林' }, { id: 'heilongjiang', name: '黑龙江' }, { id: 'shanghai', name: '上海' },
  { id: 'jiangsu', name: '江苏' }, { id: 'zhejiang', name: '浙江' }, { id: 'anhui', name: '安徽' },
  { id: 'fujian', name: '福建' }, { id: 'jiangxi', name: '江西' }, { id: 'shandong', name: '山东' },
  { id: 'henan', name: '河南' }, { id: 'hubei', name: '湖北' }, { id: 'hunan', name: '湖南' },
  { id: 'guangdong', name: '广东' }, { id: 'guangxi', name: '广西' }, { id: 'hainan', name: '海南' },
  { id: 'chongqing', name: '重庆' }, { id: 'sichuan', name: '四川' }, { id: 'guizhou', name: '贵州' },
  { id: 'yunnan', name: '云南' }, { id: 'xizang', name: '西藏' }, { id: 'shaanxi', name: '陕西' },
  { id: 'gansu', name: '甘肃' }, { id: 'qinghai', name: '青海' }, { id: 'ningxia', name: '宁夏' },
  { id: 'xinjiang', name: '新疆' }, { id: 'taiwan', name: '台湾' },
  { id: 'xianggang', name: '香港' }, { id: 'aomen', name: '澳门' },
];

/* 有数据的省份 ID 集合 */
const HAS_DATA = new Set([
  'beijing', 'tianjin', 'hebei', 'shanxi', 'neimenggu', 'liaoning', 'jilin', 'heilongjiang',
  'shanghai', 'jiangsu', 'zhejiang', 'anhui', 'fujian', 'jiangxi', 'shandong', 'henan',
  'hubei', 'hunan', 'guangdong', 'guangxi', 'hainan', 'chongqing', 'sichuan', 'guizhou',
  'yunnan', 'xizang', 'shaanxi', 'gansu', 'qinghai', 'ningxia', 'xinjiang'
]);

/* 三屏宣传文案（可配置） */
const HERO_SECTIONS = [
  {
    text: '榫卯之间，承载千年智慧\n从北国琉璃到南疆竹楼，每一根梁柱都是匠人与天地的对话',
    bgImage: '', // 空 = 占位
  },
  {
    text: '三十一处营造遗珍\n跨越山河，探寻散落在华夏大地上的建筑基因图谱',
    bgImage: '',
  },
  {
    text: '以古法拼合，复原千年造物\n从碎片到全貌，亲手重组中国古代建筑的营造密码',
    bgImage: '',
  },
];

const HubPhase = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });

  /* ─── 导航状态 ─── */
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [toast, setToast] = useState('');
  const megaMenuTimer = useRef<number | null>(null);

  /* Mega Menu hover 延迟关闭 */
  const openMegaMenu = () => {
    if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current);
    setShowMegaMenu(true);
  };
  const closeMegaMenu = () => {
    megaMenuTimer.current = window.setTimeout(() => setShowMegaMenu(false), 200);
  };

  /* 省份点击 */
  const handleProvinceClick = (id: string) => {
    if (HAS_DATA.has(id)) {
      navigate(`/learn/${id}`);
    } else {
      setToast('该地区古建筑待发掘');
      setTimeout(() => setToast(''), 2000);
    }
  };

  /* ─── 碎片收集进度 ─── */
  const [collectedPieces, setCollectedPieces] = useState(0);
  const totalPieces = 279; // 31 provinces × 9 pieces

  useEffect(() => {
    let pieces = 0;
    ALL_PROVINCES.forEach(p => {
      const fragments = localStorage.getItem(`fragments_${p.id}`);
      if (fragments) {
        try { pieces += JSON.parse(fragments).length; } catch { }
      }
    });
    setCollectedPieces(pieces);
  }, [showCollection]);

  /* 各省完成状态 */
  const getProvinceCompletion = (id: string) => {
    const frag = localStorage.getItem(`fragments_${id}`);
    if (!frag) return 0;
    try { return JSON.parse(frag).length; } catch { return 0; }
  };

  /* ─── 视差弹簧 ─── */
  const springY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.5 });

  return (
    <>
      {/* ═══════ 固定导航栏 ═══════ */}
      <nav className="hub-navbar">
        <div className="hub-navbar__inner" style={{ flexDirection: 'column', gap: '4px', padding: '8px 40px' }}>
          {/* 网站主标题 */}
          <span style={{
            fontFamily: '"Liu Jian Mao Cao", cursive',
            fontSize: '57px',
            color: '#1A1512',
            letterSpacing: '0.15em',
            lineHeight: 1,
          }}>
            筑迹中国
          </span>
          {/* 四个导航入口 */}
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            <button
              className="hub-nav-item"
              onMouseEnter={openMegaMenu}
              onMouseLeave={closeMegaMenu}
            >
              地域图志
            </button>
            <button className="hub-nav-item" onClick={() => navigate('/map')}>
              神州沙盘
            </button>
            <button className="hub-nav-item" onClick={() => setShowCollection(true)}>
              营造图鉴
            </button>
            <button className="hub-nav-item" onClick={() => setShowLogin(true)}>
              营造入卷
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════ Mega Menu 省份网格 ═══════ */}
      <AnimatePresence>
        {showMegaMenu && (
          <motion.div
            className="hub-mega-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            onMouseEnter={openMegaMenu}
            onMouseLeave={closeMegaMenu}
          >
            <div className="hub-mega-menu__grid">
              {ALL_PROVINCES.map(p => (
                <button
                  key={p.id}
                  className={`hub-mega-menu__tag ${HAS_DATA.has(p.id) ? '' : 'is-locked'}`}
                  onClick={() => handleProvinceClick(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast 提示 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="hub-mega-menu__toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ 全屏 Scroll-Snap 区域 ═══════ */}
      <div ref={scrollRef} className="hub-scroll-container">
        {HERO_SECTIONS.map((section, i) => (
          <section key={i} className="hub-section">
            {/* 背景层（有图用图，无图占位） */}
            {section.bgImage ? (
              <motion.div
                className="hub-section__bg"
                style={{
                  backgroundImage: `url(${section.bgImage})`,
                  y: useTransform(springY, [i / 3, (i + 1) / 3], ['0%', '-10%']),
                }}
              />
            ) : (
              <div className="hub-section__bg hub-section__bg--placeholder">
                <span className="hub-section__placeholder-text">实景素材待载入</span>
              </div>
            )}

            {/* 遮罩层 */}
            <div className="hub-section__overlay" />

            {/* 文案层 */}
            <div className="hub-section__content">
              <RevealParagraph text={section.text} />
            </div>
          </section>
        ))}
      </div>

      {/* ═══════ 营造图鉴 Overlay ═══════ */}
      <AnimatePresence>
        {showCollection && (
          <motion.div
            className="hub-collection-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCollection(false)}
          >
            <motion.div
              className="hub-collection-panel"
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'relative' }}
            >
              <button className="close-btn" onClick={() => setShowCollection(false)}>✕</button>
              <h2>营造图鉴</h2>
              <p style={{ color: '#6a5845', marginBottom: '4px' }}>
                碎片收集进度：<span style={{ color: '#16A951', fontWeight: 700 }}>{collectedPieces}</span> / {totalPieces}
              </p>
              <div className="hub-progress-bar">
                <div className="hub-progress-fill" style={{ width: `${(collectedPieces / totalPieces) * 100}%` }} />
              </div>

              <div className="hub-buildings-grid">
                {ALL_PROVINCES.filter(p => HAS_DATA.has(p.id)).map(p => {
                  const completed = getProvinceCompletion(p.id);
                  const isComplete = completed >= 9;
                  return (
                    <div key={p.id} className={`hub-building-card ${isComplete ? 'is-complete' : 'is-locked'}`}>
                      <span style={{ fontSize: '2rem', marginBottom: '6px' }}>{isComplete ? '🏛️' : '🔒'}</span>
                      <span style={{ fontWeight: 600, color: isComplete ? '#16A951' : '#6a5845' }}>{p.name}</span>
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>{completed}/9</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ 登录弹窗 ═══════ */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            className="hub-login-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogin(false)}
          >
            <motion.div
              className="hub-login-card"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <button className="close-btn" onClick={() => setShowLogin(false)} style={{
                position: 'absolute', top: 16, right: 16, width: 36, height: 36,
                borderRadius: '50%', border: '1px solid rgba(112,84,47,0.2)',
                background: 'rgba(255,255,255,0.6)', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#38291d', fontFamily: 'inherit'
              }}>✕</button>
              <h2>营造入卷</h2>
              <p>登录以保存你的探索进度与成就</p>
              <label>
                用户名
                <input type="text" placeholder="请输入用户名" />
              </label>
              <label>
                密码
                <input type="password" placeholder="请输入密码" />
              </label>
              <button className="submit-btn">入卷登录</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ==========================================
// 主容器
// ==========================================
export default function HomePage() {
  const [isIntro, setIsIntro] = useState(true);
  const [doorClosing, setDoorClosing] = useState(false);
  const [doorOpening, setDoorOpening] = useState(false);

  const handleTransition = () => {
    setDoorClosing(true);
    setTimeout(() => {
      setIsIntro(false);
      setDoorClosing(false);
      setDoorOpening(true);
      setTimeout(() => setDoorOpening(false), 800);
    }, 800);
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#F4ECDF', position: 'relative', overflow: 'hidden' }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap');
          .no-scroll::-webkit-scrollbar { display: none; }
          .no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* 噪点底纹 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.05, mixBlendMode: 'multiply', pointerEvents: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* 常驻水墨字 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {ARCH_POSITIONS.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }} animate={{ opacity: 0.4, y: ['100vh', '-100vh'] }}
            transition={{ opacity: { duration: 2, ease: "easeOut" }, y: { duration: item.duration, delay: item.delay, repeat: Infinity, ease: 'linear' } }}
            style={{ position: 'absolute', writingMode: 'vertical-rl', fontFamily: '"Zhi Mang Xing", cursive', fontSize: `${item.size}rem`, color: '#1A1512', filter: `blur(${item.blur}px)`, left: `${item.startX}vw`, textShadow: '2px 4px 10px rgba(26, 21, 18, 0.3)', whiteSpace: 'nowrap' }}
          >
            {item.term}
          </motion.div>
        ))}
      </div>

      {isIntro ? <IntroPhase onEnterHub={handleTransition} /> : <HubPhase />}

      {/* 大门转场动画 */}
      <AnimatePresence>
        {doorClosing && (
          <>
            <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} exit={{ x: '-100%' }} transition={{ duration: 0.8, ease: 'easeInOut' }} style={{ position: 'fixed', left: 0, top: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg, #5c1813 0%, #8A251E 20%, #8A251E 80%, #5c1813 100%)', zIndex: 9999, borderRight: '3px solid #3a0d0a', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7)' }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }} transition={{ duration: 0.8, ease: 'easeInOut' }} style={{ position: 'fixed', right: 0, top: 0, width: '50%', height: '100%', background: 'linear-gradient(270deg, #5c1813 0%, #8A251E 20%, #8A251E 80%, #5c1813 100%)', zIndex: 9999, borderLeft: '3px solid #3a0d0a', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7)' }} />
          </>
        )}
        {doorOpening && (
          <>
            <motion.div initial={{ x: '0%' }} animate={{ x: '-100%' }} transition={{ duration: 0.8, ease: 'easeInOut' }} style={{ position: 'fixed', left: 0, top: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg, #5c1813 0%, #8A251E 20%, #8A251E 80%, #5c1813 100%)', zIndex: 9999, borderRight: '3px solid #3a0d0a', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7)' }} />
            <motion.div initial={{ x: '0%' }} animate={{ x: '100%' }} transition={{ duration: 0.8, ease: 'easeInOut' }} style={{ position: 'fixed', right: 0, top: 0, width: '50%', height: '100%', background: 'linear-gradient(270deg, #5c1813 0%, #8A251E 20%, #8A251E 80%, #5c1813 100%)', zIndex: 9999, borderLeft: '3px solid #3a0d0a', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7)' }} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}