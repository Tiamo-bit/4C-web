import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PROVINCE_INFO: Record<string, { name: string, arch: string, desc: string }> = {
  beijing: { name: "北京", arch: "故宫太和殿", desc: "中国现存最大的木结构宫殿建筑，代表了中国古代建筑的最高规格与工艺水平。" },
  shanxi: { name: "山西", arch: "五台山佛光寺", desc: "中国唐代建筑的瑰宝，梁思成称其为“中国第一国宝”，保留了唐代的木结构风貌。" },
  hebei: { name: "河北", arch: "赵州桥", desc: "世界上现存年代最久远、跨度最大、保存最完整的单孔坦弧敞肩石拱桥。" },
  shandong: { name: "山东", arch: "曲阜孔庙", desc: "中国古代三大古建筑群之一，被誉为“天下第一庙”，其大成殿为中国古代建筑的最高礼制代表。" },
  henan: { name: "河南", arch: "少林寺", desc: "千年古刹，不仅是佛教禅宗祖庭，其塔林也是中国现存数量最多、规模最大的古塔群。" },
  shaanxi: { name: "陕西", arch: "西安钟楼", desc: "中国现存钟楼中形制最大、保存最完整的一座，体现了明代建筑的雄伟与严谨。" },
  hubei: { name: "湖北", arch: "黄鹤楼", desc: "江南三大名楼之一，历代屡毁屡建，现存建筑虽然为现代重建，但完美继承了古代飞檐翘角的建筑风貌。" },
  hunan: { name: "湖南", arch: "岳阳楼", desc: "江南三大名楼中唯一保持原貌的古建筑，采用独特的“盔顶”结构，工艺极为精湛。" },
  jiangxi: { name: "江西", arch: "滕王阁", desc: "江南三大名楼之一，以“落霞与孤鹜齐飞，秋水共长天一色”闻名于世，结构宏伟。" },
  zhejiang: { name: "浙江", arch: "六和塔", desc: "中国古代楼阁式塔的杰出代表，外部八角形，内部方形结构，展现了宋代建筑的高超技艺。" },
  jiangsu: { name: "江苏", arch: "拙政园", desc: "中国四大名园之一，代表了江南园林建筑的最高成就，巧妙利用借景与漏窗。" },
  anhui: { name: "安徽", arch: "宏村古建筑群", desc: "典型的徽派建筑代表，以白墙黛瓦马头墙著称，展现了中国传统民居的独特韵味。" },
  default: { name: "未知地域", arch: "神秘古建", desc: "在这片土地上，还有更多未知的榫卯智慧等待你去探索与修复。" }
};

export default function ProvinceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const info = PROVINCE_INFO[id || ""] || PROVINCE_INFO.default;

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#F4ECDF', paddingTop: '64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', padding: '60px', gap: '60px' }}>
        
        {/* 左侧：文字介绍 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '3rem', color: '#1A1512', marginBottom: '16px' }}>{info.arch}</h1>
          <h2 style={{ fontSize: '1.5rem', color: '#D23918', marginBottom: '32px' }}>所在地：{info.name}</h2>
          <p style={{ fontSize: '1.2rem', color: '#2F251F', lineHeight: '1.8', opacity: 0.85, maxWidth: '600px' }}>
            {info.desc}
          </p>
        </div>

        {/* 右侧：预留图纸素材区域 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            maxHeight: '600px',
            border: '2px dashed rgba(47, 37, 31, 0.3)', 
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'rgba(47, 37, 31, 0.5)',
            fontSize: '1.2rem',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.05)'
          }}>
            [ {info.arch} - 三维模型或线稿素材预留区 ]
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', paddingBottom: '80px' }}>
        <button 
          onClick={() => navigate('/puzzle/' + id)}
          style={{
            padding: '16px 48px',
            fontSize: '1.25rem',
            background: '#D23918',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 8px 24px rgba(210, 57, 24, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(210, 57, 24, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(210, 57, 24, 0.3)';
          }}
        >
          开启结构修复
        </button>
      </div>
    </div>
  );
}
