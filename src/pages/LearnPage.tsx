import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RevealParagraph from '../components/RevealParagraph';

const PROVINCE_INFO: Record<string, { name: string, arch: string, desc: string, totalPieces: number }> = {
  beijing: { name: "北京", arch: "故宫太和殿", desc: "中国现存最大的木结构宫殿建筑，代表了中国古代建筑的最高规格与工艺水平。", totalPieces: 6 },
  shanxi: { name: "山西", arch: "五台山佛光寺", desc: "中国唐代建筑的瑰宝，梁思成称其为“中国第一国宝”，保留了唐代的木结构风貌。", totalPieces: 4 },
  hebei: { name: "河北", arch: "赵州桥", desc: "世界上现存年代最久远、跨度最大、保存最完整的单孔坦弧敞肩石拱桥。", totalPieces: 3 },
  shandong: { name: "山东", arch: "曲阜孔庙", desc: "中国古代三大古建筑群之一，被誉为“天下第一庙”，其大成殿为中国古代建筑的最高礼制代表。", totalPieces: 5 },
  henan: { name: "河南", arch: "少林寺", desc: "千年古刹，不仅是佛教禅宗祖庭，其塔林也是中国现存数量最多、规模最大的古塔群。", totalPieces: 4 },
  shaanxi: { name: "陕西", arch: "西安钟楼", desc: "中国现存钟楼中形制最大、保存最完整的一座，体现了明代建筑的雄伟与严谨。", totalPieces: 5 },
  hubei: { name: "湖北", arch: "黄鹤楼", desc: "江南三大名楼之一，历代屡毁屡建，现存建筑虽然为现代重建，但完美继承了古代飞檐翘角的建筑风貌。", totalPieces: 6 },
  hunan: { name: "湖南", arch: "岳阳楼", desc: "江南三大名楼中唯一保持原貌的古建筑，采用独特的“盔顶”结构，工艺极为精湛。", totalPieces: 4 },
  jiangxi: { name: "江西", arch: "滕王阁", desc: "江南三大名楼之一，以“落霞与孤鹜齐飞，秋水共长天一色”闻名于世，结构宏伟。", totalPieces: 5 },
  zhejiang: { name: "浙江", arch: "六和塔", desc: "中国古代楼阁式塔的杰出代表，外部八角形，内部方形结构，展现了宋代建筑的高超技艺。", totalPieces: 4 },
  jiangsu: { name: "江苏", arch: "拙政园", desc: "中国四大名园之一，代表了江南园林建筑的最高成就，巧妙利用借景与漏窗。", totalPieces: 7 },
  anhui: { name: "安徽", arch: "宏村古建筑群", desc: "典型的徽派建筑代表，以白墙黛瓦马头墙著称，展现了中国传统民居的独特韵味。", totalPieces: 5 },
  default: { name: "未知地域", arch: "神秘古建", desc: "在这片土地上，还有更多未知的榫卯智慧等待你去探索与修复。", totalPieces: 3 }
};

export default function LearnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const info = PROVINCE_INFO[id || ""] || PROVINCE_INFO.default;

  const [progress, setProgress] = useState(0);
  const [fragments, setFragments] = useState<number[]>([]);

  useEffect(() => {
    const savedProgress = localStorage.getItem(`learn_progress_${id}`);
    const savedFragments = localStorage.getItem(`fragments_${id}`);
    if (savedProgress) setProgress(Number(savedProgress));
    if (savedFragments) setFragments(JSON.parse(savedFragments));
  }, [id]);

  const handleStudy = () => {
    if (progress >= 100) return;

    const step = 100 / info.totalPieces;
    const newProgress = Math.min(100, progress + step);
    setProgress(newProgress);
    localStorage.setItem(`learn_progress_${id}`, newProgress.toString());

    if (Math.floor(newProgress / step) > fragments.length) {
      const newFragmentId = Math.floor(Math.random() * 1000);
      const updatedFragments = [...fragments, newFragmentId];
      setFragments(updatedFragments);
      localStorage.setItem(`fragments_${id}`, JSON.stringify(updatedFragments));
      alert(`恭喜！你深入研读了${info.arch}的历史，成功获得一块建筑核心碎片！`);
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#F4ECDF', paddingTop: '64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

      {/* 底层纹理 */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          opacity: 0.05, mixBlendMode: 'multiply', pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div style={{ flex: 1, display: 'flex', padding: '60px', gap: '60px', position: 'relative', zIndex: 10 }}>

        {/* 左侧文字区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#1A1512', marginBottom: '16px', fontFamily: '"Zhi Mang Xing", cursive' }}>{info.arch}</h1>
          <h2 style={{ fontSize: '1.5rem', color: '#F36838', marginBottom: '32px' }}>所在地：{info.name}</h2>
          <p style={{ fontSize: '1.2rem', color: '#1A1512', lineHeight: '2', opacity: 0.85, maxWidth: '600px' }}>
            {info.desc}
          </p>

          <div style={{ marginTop: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#1A1512', fontWeight: 'bold' }}>结构研读进度</span>
              <span style={{ color: '#16A951', fontWeight: 'bold', fontSize: '1.2rem' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: '100%', height: '16px', background: 'rgba(26, 21, 18, 0.1)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #9B7B52' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#16A951', transition: 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)' }} />
            </div>
          </div>

          <div style={{ marginTop: '50px', display: 'flex', gap: '24px' }}>
            <button
              onClick={handleStudy}
              disabled={progress >= 100}
              style={{
                padding: '16px 40px', fontSize: '1.2rem', background: progress >= 100 ? '#9B7B52' : '#F36838', color: 'white',
                border: 'none', borderRadius: '8px', cursor: progress >= 100 ? 'not-allowed' : 'pointer', fontWeight: 'bold',
                boxShadow: progress >= 100 ? 'none' : '0 8px 24px rgba(243, 104, 56, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              {progress >= 100 ? '研读大成' : '潜心钻研'}
            </button>
            <button
              onClick={() => navigate('/puzzle/' + id)}
              style={{
                padding: '16px 40px', fontSize: '1.2rem', background: 'transparent', color: '#F36838',
                border: '2px solid #F36838', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(243, 104, 56, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              开启榫卯拼图 ({fragments.length}/{info.totalPieces})
            </button>
          </div>
        </div>

        {/* 右侧图像区 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '100%', height: '100%', maxHeight: '600px',
            border: '1px solid #9B7B52', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(76, 111, 177, 0.05), rgba(26, 21, 18, 0.05))',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#1A1512', fontSize: '1.5rem', boxShadow: 'inset 0 0 40px rgba(76, 111, 177, 0.1)'
          }}>
            <span style={{ fontFamily: '"Zhi Mang Xing", cursive', fontSize: '2.5rem', color: '#4C6FB1', marginBottom: '40px' }}>古建图鉴全览</span>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '0 40px', justifyContent: 'center' }}>
              {Array.from({ length: info.totalPieces }).map((_, i) => (
                <div key={i} style={{
                  width: '60px', height: '60px',
                  background: i < fragments.length ? '#16A951' : '#9D2933',
                  borderRadius: '8px', opacity: i < fragments.length ? 1 : 0.2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: i < fragments.length ? '0 4px 12px rgba(22, 169, 81, 0.4)' : 'none',
                  transition: 'all 0.5s ease'
                }}>
                  <span style={{ color: 'white', opacity: i < fragments.length ? 1 : 0.5 }}>碎</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
