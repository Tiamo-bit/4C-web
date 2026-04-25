import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import PhaserGame from './components/PhaserGame';
import chinaMapUrl from './features/map/official-china-map-gs2024-1234.png';

type Stage = 'intro' | 'login' | 'map' | 'science' | 'puzzle';

type PieceDef = {
  id: string;
  polygon: string;
  startX: string;
  startY: string;
  startRotate: string;
  finalX: string;
  finalY: string;
  finalRotate: string;
};

type Province = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  intro: string;
  highlights: string[];
};

type PetSkin = {
  id: string;
  label: string;
  robe: string;
  accent: string;
  glow: string;
  eye: string;
};

const INTRO_PIECES: PieceDef[] = [
  {
    id: 'beam-a',
    polygon: 'polygon(10% 8%, 90% 8%, 90% 42%, 64% 42%, 64% 92%, 10% 92%)',
    startX: '-34vw',
    startY: '-20vh',
    startRotate: '-28deg',
    finalX: '-74px',
    finalY: '-18px',
    finalRotate: '0deg',
  },
  {
    id: 'beam-b',
    polygon: 'polygon(8% 14%, 72% 14%, 72% 0%, 92% 0%, 92% 86%, 8% 86%)',
    startX: '32vw',
    startY: '-16vh',
    startRotate: '24deg',
    finalX: '68px',
    finalY: '-10px',
    finalRotate: '0deg',
  },
  {
    id: 'beam-c',
    polygon: 'polygon(12% 4%, 86% 4%, 86% 66%, 64% 66%, 64% 96%, 12% 96%)',
    startX: '-30vw',
    startY: '24vh',
    startRotate: '18deg',
    finalX: '-18px',
    finalY: '66px',
    finalRotate: '0deg',
  },
  {
    id: 'beam-d',
    polygon: 'polygon(6% 12%, 92% 12%, 92% 88%, 36% 88%, 36% 60%, 6% 60%)',
    startX: '34vw',
    startY: '22vh',
    startRotate: '-20deg',
    finalX: '14px',
    finalY: '58px',
    finalRotate: '0deg',
  },
];

const PET_SKINS: PetSkin[] = [
  { id: 'scholar', label: '书生', robe: '#F2E7D8', accent: '#C58B54', glow: '#F7DFA3', eye: '#2F2520' },
  { id: 'monk', label: '小僧', robe: '#E7E0D3', accent: '#D6A33C', glow: '#E6D9AB', eye: '#2C2927' },
  { id: 'lady', label: '青衣', robe: '#E9EEF7', accent: '#8D9CB8', glow: '#C9D7EE', eye: '#2C3037' },
];

const PROVINCES: Province[] = [
  {
    id: 'beijing',
    name: '北京',
    x: 65.8,
    y: 36.4,
    w: 6.2,
    h: 5.4,
    intro: '北京是中国古代都城营造集大成之地，中轴线与宫殿礼制体现了严整的空间秩序。',
    highlights: ['中轴对称', '宫殿礼制', '城门与城墙体系'],
  },
  {
    id: 'jiangsu',
    name: '江苏',
    x: 71.8,
    y: 56,
    w: 8.4,
    h: 8.4,
    intro: '江苏园林与水乡建筑强调借景与尺度控制，宅院与街巷的细腻关系极具代表性。',
    highlights: ['江南园林', '粉墙黛瓦', '水巷肌理'],
  },
  {
    id: 'zhejiang',
    name: '浙江',
    x: 73.5,
    y: 68.2,
    w: 8.2,
    h: 8.8,
    intro: '浙江传统聚落沿山就势，木构与石构并用，形成灵活且适应地形的建造智慧。',
    highlights: ['山地聚落', '木石混构', '廊桥与祠堂'],
  },
  {
    id: 'guangdong',
    name: '广东',
    x: 63.2,
    y: 83.6,
    w: 10.2,
    h: 8.2,
    intro: '岭南建筑重视通风遮阳，骑楼、祠堂与民居共同构成了独特的亚热带营造体系。',
    highlights: ['骑楼街区', '灰塑装饰', '通风遮阳'],
  },
  {
    id: 'sichuan',
    name: '四川',
    x: 41.3,
    y: 61.2,
    w: 12.6,
    h: 12.4,
    intro: '四川盆地传统院落重实用与防潮，穿斗式木构在民居中应用广泛。',
    highlights: ['穿斗式木构', '川西林盘', '防潮院落'],
  },
  {
    id: 'xinjiang',
    name: '新疆',
    x: 21.5,
    y: 35.6,
    w: 22.8,
    h: 18.6,
    intro: '新疆建筑融合多元文化，夯土、木构与装饰艺术共同形成丝路沿线空间风貌。',
    highlights: ['夯土工艺', '丝路风格', '庭院式空间'],
  },
];

function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'float' | 'assemble' | 'lock' | 'burst' | 'fade'>('float');

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase('assemble'), 1000),
      window.setTimeout(() => setPhase('lock'), 1380),
      window.setTimeout(() => setPhase('burst'), 1540),
      window.setTimeout(() => setPhase('fade'), 2000),
      window.setTimeout(onFinish, 2400),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onFinish]);

  return (
    <section className={`intro-screen ${phase === 'fade' ? 'is-fading' : ''}`}>
      <div className="intro-haze" />
      <div className={`mortise-core phase-${phase}`}>
        {INTRO_PIECES.map((piece, index) => (
          <div
            key={piece.id}
            className={`mortise-piece piece-${index + 1}`}
            style={
              {
                '--polygon': piece.polygon,
                '--start-x': piece.startX,
                '--start-y': piece.startY,
                '--start-rotate': piece.startRotate,
                '--final-x': piece.finalX,
                '--final-y': piece.finalY,
                '--final-rotate': piece.finalRotate,
              } as CSSProperties
            }
          />
        ))}
        {(phase === 'burst' || phase === 'fade') && (
          <div className="spark-wave">
            {Array.from({ length: 26 }, (_, index) => {
              const angle = (Math.PI * 2 * index) / 26;
              const distance = 84 + (index % 4) * 26;
              return (
                <span
                  key={`spark-${index}`}
                  className="spark-dot"
                  style={
                    {
                      '--dx': `${Math.cos(angle) * distance}px`,
                      '--dy': `${Math.sin(angle) * distance}px`,
                      '--delay': `${index * 0.01}s`,
                    } as CSSProperties
                  }
                />
              );
            })}
          </div>
        )}
      </div>
      <p className="intro-caption">榫卯咬合中...</p>
    </section>
  );
}

function LoginScreen({ onLogin }: { onLogin: (name: string, email: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('请先填写用户名和邮箱。');
      return;
    }
    setError('');
    onLogin(name.trim(), email.trim());
  };

  return (
    <section className="login-screen">
      <div className="login-card">
        <h1>营造入卷</h1>
        <p>以榫卯之名，进入山水城市图卷。</p>
        <form onSubmit={handleSubmit}>
          <label>
            用户名
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="请输入你的名字"
              autoComplete="name"
            />
          </label>
          <label>
            邮箱
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </label>
          {error ? <div className="login-error">{error}</div> : null}
          <button type="submit">进入地图</button>
        </form>
      </div>
    </section>
  );
}

function PetAvatar({
  skin,
  left,
  top,
  moving,
  onClick,
}: {
  skin: PetSkin;
  left: number;
  top: number;
  moving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`pet-avatar ${moving ? 'is-moving' : ''}`}
      style={
        {
          '--pet-robe': skin.robe,
          '--pet-accent': skin.accent,
          '--pet-glow': skin.glow,
          '--pet-eye': skin.eye,
          left: `${left}%`,
          top: `${top}%`,
        } as CSSProperties
      }
      onClick={onClick}
      aria-label="切换桌宠"
      title="点击切换桌宠"
    >
      <span className="pet-avatar__halo" />
      <span className="pet-avatar__head" />
      <span className="pet-avatar__body" />
      <span className="pet-avatar__label">{skin.label}</span>
    </button>
  );
}

function MapScreen({
  userName,
  onOpenProvince,
}: {
  userName: string;
  onOpenProvince: (province: Province) => void;
}) {
  const [focusedProvinceId, setFocusedProvinceId] = useState(PROVINCES[1].id);
  const [petSkinIndex, setPetSkinIndex] = useState(0);
  const [petPosition, setPetPosition] = useState({ left: 18, top: 76 });
  const [petMoving, setPetMoving] = useState(false);
  const moveTimerRef = useRef<number | null>(null);

  const selectedProvince = useMemo(
    () => PROVINCES.find((province) => province.id === focusedProvinceId),
    [focusedProvinceId]
  );
  const currentSkin = PET_SKINS[petSkinIndex % PET_SKINS.length];

  useEffect(() => {
    return () => {
      if (moveTimerRef.current) {
        window.clearTimeout(moveTimerRef.current);
      }
    };
  }, []);

  const cyclePetSkin = () => {
    setPetSkinIndex((index) => (index + 1) % PET_SKINS.length);
  };

  const triggerProvinceVisit = (province: Province) => {
    if (petMoving) return;

    setFocusedProvinceId(province.id);
    setPetMoving(true);
    setPetPosition({ left: province.x, top: province.y });

    if (moveTimerRef.current) {
      window.clearTimeout(moveTimerRef.current);
    }

    moveTimerRef.current = window.setTimeout(() => {
      setPetMoving(false);
      onOpenProvince(province);
    }, 640);
  };

  return (
    <section className="map-page">
      <aside className="province-nav" aria-label="省份导航">
        <div className="nav-title">云游九州</div>
        <ul className="province-list">
          {PROVINCES.map((province) => (
            <li key={province.id}>
              <button
                type="button"
                className={province.id === focusedProvinceId ? 'is-active' : ''}
                onClick={() => triggerProvinceVisit(province)}
              >
                {province.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="map-main">
        <header className="map-header">
          <div>
            <strong>{userName}</strong>，欢迎回到古建图卷
          </div>
          <div className="map-hint">当前聚焦：{selectedProvince?.name ?? '未选择'}</div>
        </header>

        <div className="map-shell">
          <img src={chinaMapUrl} alt="中国地图" className="map-image" />

          <div className="map-hotspots">
            {PROVINCES.map((province) => (
              <button
                key={province.id}
                className={`province-hotspot ${province.id === focusedProvinceId ? 'is-active' : ''}`}
                style={
                  {
                    '--x': province.x,
                    '--y': province.y,
                    '--w': province.w,
                    '--h': province.h,
                  } as CSSProperties
                }
                onClick={() => triggerProvinceVisit(province)}
                aria-label={`进入${province.name}科普界面`}
              >
                <span>{province.name}</span>
              </button>
            ))}
          </div>

          <PetAvatar
            skin={currentSkin}
            left={petPosition.left}
            top={petPosition.top}
            moving={petMoving}
            onClick={cyclePetSkin}
          />

          <div className="map-legend">
            点击桌宠可切换皮肤，点击省份后桌宠会先跳转到该省份，再打开科普页面。
          </div>
        </div>
      </div>
    </section>
  );
}

function ScienceScreen({
  province,
  onOpenPuzzle,
  onBack,
}: {
  province: Province;
  onOpenPuzzle: () => void;
  onBack: () => void;
}) {
  return (
    <section className="science-screen">
      <div className="science-card">
        <div className="science-head">
          <h2>{province.name} · 古建科普</h2>
          <div className="science-actions">
            <button type="button" onClick={onOpenPuzzle}>
              进入拼图
            </button>
            <button type="button" onClick={onBack}>
              返回地图
            </button>
          </div>
        </div>

        <div className="science-gallery">
          <figure className="science-figure">
            <img src={chinaMapUrl} alt={`${province.name} 对应的地图图示`} />
            <figcaption>地图导览</figcaption>
          </figure>
          <figure className="science-figure science-figure--alt">
            <img src={chinaMapUrl} alt={`${province.name} 的视觉延展图`} />
            <figcaption>空间延展</figcaption>
          </figure>
        </div>

        <div className="science-content">
          <p>{province.intro}</p>
          <ul>
            {province.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PuzzleScreen({
  province,
  onBack,
}: {
  province: Province;
  onBack: () => void;
}) {
  return (
    <section className="puzzle-screen">
      <div className="puzzle-shell">
        <div className="puzzle-head">
          <div>
            <h2>{province.name} · 拼图模块</h2>
            <p>拖动碎片完成建筑拼合，完成后可返回科普页面。</p>
          </div>
          <button type="button" onClick={onBack}>
            返回科普
          </button>
        </div>
        <PhaserGame />
      </div>
    </section>
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>('intro');
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [activeProvince, setActiveProvince] = useState<Province | null>(null);

  return (
    <main className="app-root">
      {stage === 'intro' ? <IntroScreen onFinish={() => setStage('login')} /> : null}
      {stage === 'login' ? (
        <LoginScreen
          onLogin={(name, email) => {
            setProfile({ name, email });
            setStage('map');
          }}
        />
      ) : null}
      {stage === 'map' ? (
        <MapScreen
          userName={profile?.name ?? '访客'}
          onOpenProvince={(province) => {
            setActiveProvince(province);
            setStage('science');
          }}
        />
      ) : null}
      {stage === 'science' && activeProvince ? (
        <ScienceScreen
          province={activeProvince}
          onOpenPuzzle={() => setStage('puzzle')}
          onBack={() => setStage('map')}
        />
      ) : null}
      {stage === 'puzzle' && activeProvince ? (
        <PuzzleScreen
          province={activeProvince}
          onBack={() => setStage('science')}
        />
      ) : null}
    </main>
  );
}
