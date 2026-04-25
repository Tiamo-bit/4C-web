import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ARCH_TERMS = ['京派四合院', '晋商大院', '陕北窑洞', '陇东地坑院', '苏式园林', '徽派粉墙黛瓦', '浙派台门院落', '闽南红砖古厝', '客家土楼', '川西吊脚楼', '傣家竹楼', '藏式碉房', '侗寨鼓楼', '蒙古包'];

const PROVINCE_LIST = [
  { id: 'beijing', name: '北京' },
  { id: 'shanxi', name: '山西' },
  { id: 'hebei', name: '河北' },
  { id: 'shandong', name: '山东' },
  { id: 'henan', name: '河南' },
  { id: 'shaanxi', name: '陕西' },
  { id: 'hubei', name: '湖北' },
  { id: 'hunan', name: '湖南' },
  { id: 'jiangxi', name: '江西' },
  { id: 'zhejiang', name: '浙江' },
  { id: 'jiangsu', name: '江苏' },
  { id: 'anhui', name: '安徽' },
];

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

  // b5: Z轴(进深) 左上 -> 解构后隐藏
  const b5 = {
    x: useTransform(scrollYProgress, steps, [-20, -20, -300, 0, 0]),
    y: useTransform(scrollYProgress, steps, [-20, -20, -300, 0, 0]),
    z: useTransform(scrollYProgress, steps, [0, 0, 0, -50, -50]),
    sx: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sy: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sz: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 0, 0]),
  };

  // b6: Z轴(进深) 右下 -> 解构后隐藏
  const b6 = {
    x: useTransform(scrollYProgress, steps, [20, 20, 300, 0, 0]),
    y: useTransform(scrollYProgress, steps, [20, 20, 300, 0, 0]),
    z: useTransform(scrollYProgress, steps, [0, 0, 0, -50, -50]),
    sx: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sy: useTransform(scrollYProgress, steps, [0.4, 0.4, 0.4, 0, 0]),
    sz: useTransform(scrollYProgress, steps, [3.0, 3.0, 3.0, 0, 0]),
  };

  // 红底牌匾显现控制
  const plaqueOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);

  return (
    <div ref={scrollContainerRef} style={{ width: '100vw', height: '100vh', overflowY: 'scroll', overflowX: 'hidden', position: 'relative', zIndex: 10 }}>
      <div style={{ height: '400vh', width: '100%' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '2000px' }}>

          <motion.div style={{ position: 'relative', transformStyle: 'preserve-3d', rotateX: globalRotateX, rotateY: globalRotateY }}>
            <UnitCube transforms={b1} />
            <UnitCube transforms={b2} />
            <UnitCube transforms={b3} />
            <UnitCube transforms={b4} />
            <UnitCube transforms={b5} />
            <UnitCube transforms={b6} />

            {/* 【完美修复】：红底金字，竖排牌匾 */}
            <motion.div
              onClick={() => {
                if (scrollYProgress.get() >= 0.9) onEnterHub();
              }}
              style={{
                position: 'absolute', width: 160, height: 500, marginLeft: -80, marginTop: -250,
                background: '#8A251E', // 纯正朱红
                border: '4px solid #D4AF37', // 描金边框
                writingMode: 'vertical-rl',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 50px rgba(138, 37, 30, 0.8), inset 0 0 30px rgba(0,0,0,0.4)',
                opacity: plaqueOpacity,
                transform: 'translateZ(10px)', // 浮在木框之上
                cursor: useTransform(scrollYProgress, [0.85, 0.9], ['default', 'pointer']) as any,
              }}
            >
              <span style={{ fontFamily: '"Zhi Mang Xing", cursive', fontSize: '3.5rem', color: '#F4ECDF', textShadow: '0 0 15px #D4AF37, 2px 2px 5px rgba(0,0,0,0.8)', letterSpacing: '16px' }}>
                中华传统古建筑
              </span>
            </motion.div>
          </motion.div>

          <motion.div style={{ position: 'absolute', bottom: '40px', opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]), color: '#1A1512', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '4px' }}>
            向下滚动 解构孔明密码 ↓
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 阶段二：四板块主页 (干净纯粹，无牌匾)
// ==========================================
const HubPhase = () => {
  const navigate = useNavigate();
  const [isExploded, setIsExploded] = useState(false);
  const [collectedPieces, setCollectedPieces] = useState(0);
  const totalPieces = 56;

  useEffect(() => {
    let pieces = 0;
    PROVINCE_LIST.forEach(p => {
      const fragments = localStorage.getItem(`fragments_${p.id}`);
      if (fragments) pieces += JSON.parse(fragments).length;
    });
    setCollectedPieces(pieces);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 10, display: 'flex', width: '100%', height: '100vh', padding: '24px', gap: '24px', boxSizing: 'border-box' }}>

      {/* 左侧：省份百科全书 */}
      <div className="no-scroll" style={{ width: '20%', height: '100%', border: '1px solid #9B7B52', borderRadius: '16px', background: 'linear-gradient(180deg, rgba(76, 111, 177, 0.05), rgba(76, 111, 177, 0.15))', backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '24px 16px', boxSizing: 'border-box', boxShadow: 'inset 0 0 20px rgba(76, 111, 177, 0.1)' }}>
        <h2 style={{ color: '#1A1512', fontSize: '1.8rem', marginBottom: '24px', borderBottom: '1px solid rgba(155, 123, 82, 0.5)', paddingBottom: '12px', textAlign: 'center', fontFamily: '"Zhi Mang Xing", cursive', letterSpacing: '4px' }}>典藏地域志</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PROVINCE_LIST.map(p => (
            <motion.button
              key={p.id} onClick={() => navigate(`/learn/${p.id}`)}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(155, 123, 82, 0.2)', color: '#F36838', borderColor: '#F36838' }}
              style={{ background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(155, 123, 82, 0.3)', padding: '16px 20px', borderRadius: '8px', cursor: 'pointer', color: '#1A1512', fontSize: '1.2rem', fontWeight: 'bold', transition: 'all 0.3s ease', textAlign: 'center', boxShadow: '0 4px 12px rgba(26, 21, 18, 0.05)' }}
            >
              {p.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 右侧主视觉区 (去除了占位的牌匾) */}
      <div style={{ width: '80%', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 数字神州沙盘 */}
        <motion.div
          whileHover={{ boxShadow: '0 12px 50px rgba(22, 169, 81, 0.3)', borderColor: '#16A951' }}
          onClick={() => navigate('/map')}
          style={{ flex: '1', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', border: '2px solid rgba(155, 123, 82, 0.5)', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(26, 21, 18, 0.1)', transition: 'all 0.4s ease' }}
        >
          <h2 style={{ fontSize: '3.5rem', color: '#1A1512', marginBottom: '20px', fontWeight: 'bold', fontFamily: '"Zhi Mang Xing", cursive', letterSpacing: '8px' }}>数字神州沙盘</h2>
          <p style={{ color: '#4C6FB1', fontSize: '1.4rem', marginBottom: '32px' }}>化身灵宠，跃历华夏河山，探寻营造法则</p>
          <div style={{ padding: '16px 48px', background: 'transparent', border: '2px solid #16A951', color: '#16A951', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.25rem', boxShadow: '0 0 20px rgba(22, 169, 81, 0.2)' }}>进入地图空间</div>
        </motion.div>

        {/* 底部双卡片 */}
        <div style={{ flex: '0 0 40%', display: 'flex', gap: '24px' }}>
          {/* 匠心集萃 */}
          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.5)', border: '1px solid #9B7B52', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ color: '#1A1512', fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>匠心集萃</h3>
            <p style={{ color: '#4C6FB1', marginBottom: '20px', fontSize: '1.1rem' }}>已收集构件碎片: <span style={{ color: '#F36838', fontWeight: 'bold' }}>{collectedPieces}/{totalPieces}</span></p>
            <div className="no-scroll" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', overflowY: 'auto' }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} style={{ width: '50px', height: '50px', borderRadius: '8px', background: i < collectedPieces ? '#16A951' : '#9D2933', opacity: i < collectedPieces ? 1 : 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: i < collectedPieces ? '0 0 10px rgba(22, 169, 81, 0.4)' : 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
                  {i < collectedPieces && <span style={{ color: 'white', fontSize: '20px' }}>✦</span>}
                </div>
              ))}
            </div>
          </div>

          {/* 天工开物 */}
          <div
            onMouseEnter={() => setIsExploded(true)} onMouseLeave={() => setIsExploded(false)}
            style={{ flex: 1, background: 'linear-gradient(135deg, rgba(76, 111, 177, 0.1), rgba(26, 21, 18, 0.05))', border: '1px solid #9B7B52', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', perspective: '800px', backdropFilter: 'blur(8px)' }}
          >
            <h3 style={{ position: 'absolute', top: '24px', left: '24px', color: '#1A1512', fontSize: '1.5rem', fontWeight: 'bold' }}>天工开物</h3>
            <p style={{ position: 'absolute', top: '60px', left: '24px', color: '#4C6FB1', fontSize: '1.1rem' }}>悬停观测构件解剖</p>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle, rgba(76, 111, 177, 0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <motion.div animate={{ rotateY: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100px', height: '100px', marginTop: '20px' }}>
              <motion.div animate={{ y: isExploded ? 50 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} style={{ width: '30px', height: '100px', background: '#9B7B52', position: 'absolute', left: '35px', top: '0', border: '1px solid #1A1512', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }} />
              <motion.div animate={{ x: isExploded ? -60 : 0, z: isExploded ? 40 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} style={{ width: '140px', height: '20px', background: '#F36838', position: 'absolute', left: '-20px', top: '20px', transform: 'translateZ(15px)', border: '1px solid #1A1512' }} />
              <motion.div animate={{ x: isExploded ? 60 : 0, z: isExploded ? -40 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} style={{ width: '140px', height: '20px', background: '#F36838', position: 'absolute', left: '-20px', top: '20px', transform: 'rotateY(90deg) translateZ(15px)', border: '1px solid #1A1512' }} />
              <motion.div animate={{ y: isExploded ? -60 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} style={{ width: '50px', height: '25px', background: '#4C6FB1', position: 'absolute', left: '25px', top: '-25px', transform: 'translateZ(0px)', border: '1px solid #1A1512' }} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
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