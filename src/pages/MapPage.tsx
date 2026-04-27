import React, { useState, useMemo, useRef, CSSProperties, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import chinaMapUrl from '../features/map/china-map-new.png';
import scholarImg from '../assets/pets/scholar.png';
import ladyImg from '../assets/pets/lady.png';

type Province = {
  id: string; name: string; x: number; y: number; w: number; h: number;
  intro: string; highlights: string[];
};

const PET_SKINS = [
  { id: 'scholar', label: '书生', image: scholarImg, baseFacing: -1 }, // 书生原图面朝左
  { id: 'lady', label: '青衣', image: ladyImg, baseFacing: 1 },       // 青衣原图面朝右
];

const PROVINCES: Province[] = [
  { id: 'beijing', name: '北京', x: 68, y: 31.6, w: 5, h: 5, intro: '北京四合院——元代肇基、明清鼎盛的合院式民居典范', highlights: ["北方传统民居", "合院式建筑"] },
  { id: 'tianjin', name: '天津', x: 69.2, y: 34.7, w: 4, h: 4, intro: '天津广东会馆——北方规模最大的清代会馆戏楼', highlights: ["会馆建筑", "戏楼"] },
  { id: 'hebei', name: '河北', x: 65.1, y: 37.4, w: 6, h: 6, intro: '赵州桥——世界现存最早的敞肩石拱桥', highlights: ["石拱桥", "古桥"] },
  { id: 'shanxi', name: '山西', x: 59.3, y: 38.3, w: 6, h: 6, intro: '平遥古城墙——夯土包砖的世界遗产核心遗存', highlights: ["古城墙", "世界遗产"] },
  { id: 'neimenggu', name: '内蒙古', x: 51.8, y: 30.2, w: 15, h: 8, intro: '蒙古包——草原游牧民族的移动式毡帐民居', highlights: ["移动式民居", "游牧文化"] },
  { id: 'liaoning', name: '辽宁', x: 75.6, y: 27.5, w: 6, h: 6, intro: '兴城古城——中国现存最完整的明代卫城', highlights: ["卫城", "古城墙"] },
  { id: 'jilin', name: '吉林', x: 79.4, y: 22.7, w: 6, h: 6, intro: '叶赫那拉古城——满族发祥地之一', highlights: ["满族古城", "古城遗址"] },
  { id: 'heilongjiang', name: '黑龙江', x: 82.8, y: 14.5, w: 7, h: 7, intro: '宁古塔——清代东北边疆军政核心重镇', highlights: ["清代军府城址", "流人文化"] },
  { id: 'shanghai', name: '上海', x: 76.6, y: 52.8, w: 4, h: 4, intro: '豫园——明嘉靖年间的江南古典园林代表', highlights: ["古典园林", "国保单位"] },
  { id: 'jiangsu', name: '江苏', x: 72.8, y: 48.6, w: 8.4, h: 8.4, intro: '拙政园——天下园林之母、世界文化遗产', highlights: ["古典园林", "世界遗产"] },
  { id: 'zhejiang', name: '浙江', x: 76.6, y: 60.4, w: 8.2, h: 8.8, intro: '天一阁——亚洲现存最古老的私家藏书楼', highlights: ["藏书楼", "国保单位"] },
  { id: 'anhui', name: '安徽', x: 67.2, y: 53, w: 6, h: 6, intro: '西递村——世界文化遗产徽派古村落', highlights: ["徽派古村落", "世界遗产"] },
  { id: 'fujian', name: '福建', x: 69, y: 67.7, w: 6, h: 6, intro: '承启楼——土楼之王、客家圆形土楼代表', highlights: ["客家土楼", "世界遗产"] },
  { id: 'jiangxi', name: '江西', x: 63.4, y: 64, w: 6, h: 6, intro: '彩虹桥——宋代木拱廊桥、徽州廊桥典范', highlights: ["廊桥", "国保单位"] },
  { id: 'shandong', name: '山东', x: 69.9, y: 40.5, w: 7, h: 7, intro: '孔府——天下第一家、世界文化遗产三孔核心', highlights: ["官邸府第", "世界遗产"] },
  { id: 'henan', name: '河南', x: 62.6, y: 47.7, w: 6, h: 6, intro: '康百万庄园——中原三大官宅之首', highlights: ["庄园建筑", "国保单位"] },
  { id: 'hubei', name: '湖北', x: 58.8, y: 55.3, w: 6, h: 6, intro: '荆州古城墙——南方唯一完整明清府城城墙', highlights: ["古城墙", "国保单位"] },
  { id: 'hunan', name: '湖南', x: 55, y: 61.7, w: 6, h: 6, intro: '岳阳楼——江南三大名楼之首、盔顶纯木结构', highlights: ["古楼阁", "国保单位"] },
  { id: 'guangdong', name: '广东', x: 59.3, y: 75.9, w: 10.2, h: 8.2, intro: '开平碉楼——万国建筑博物馆、世界文化遗产', highlights: ["碉楼", "世界遗产"] },
  { id: 'guangxi', name: '广西', x: 49, y: 76.6, w: 7, h: 7, intro: '程阳永济桥——世界四大历史名桥之一', highlights: ["风雨桥", "国保单位"] },
  { id: 'hainan', name: '海南', x: 53, y: 88.6, w: 5, h: 5, intro: '海口骑楼老街——中国现存最大南洋骑楼建筑群', highlights: ["骑楼街区", "历史文化街区"] },
  { id: 'chongqing', name: '重庆', x: 50.3, y: 59.2, w: 5, h: 5, intro: '湖广会馆——中国现存规模最大的城市会馆建筑群', highlights: ["会馆建筑", "国保单位"] },
  { id: 'sichuan', name: '四川', x: 40.7, y: 53.1, w: 12.6, h: 12.4, intro: '克莎民居——嘉绒藏族邛笼式石木碉形民居', highlights: ["嘉绒藏族碉房", "传统民居"] },
  { id: 'guizhou', name: '贵州', x: 47.3, y: 67.3, w: 6, h: 6, intro: '吊脚楼——西南山地少数民族半干栏式民居', highlights: ["干栏式民居", "国家级非遗"] },
  { id: 'yunnan', name: '云南', x: 35.7, y: 72.8, w: 8, h: 8, intro: '傣族竹楼——中国干栏式建筑活态标本', highlights: ["干栏式民居", "生态民居"] },
  { id: 'xizang', name: '西藏', x: 19.4, y: 49.3, w: 15, h: 10, intro: '帕拉庄园——西藏唯一保存完整的贵族庄园', highlights: ["贵族庄园", "国保单位"] },
  { id: 'shaanxi', name: '陕西', x: 55.8, y: 40.8, w: 6, h: 6, intro: '大雁塔——唐代四方楼阁式砖塔、世界文化遗产', highlights: ["唐代佛塔", "世界遗产"] },
  { id: 'gansu', name: '甘肃', x: 36.8, y: 31.4, w: 10, h: 6, intro: '上花园戏台——河西走廊民间砖木结构戏台', highlights: ["民间古戏台", "省级文保"] },
  { id: 'qinghai', name: '青海', x: 30.3, y: 41.6, w: 10, h: 8, intro: '丹噶尔古城——青藏高原商道节点古城', highlights: ["商贸古城", "国保单位"] },
  { id: 'ningxia', name: '宁夏', x: 50.9, y: 38.7, w: 5, h: 5, intro: '镇北堡——明长城沿线屯兵古堡', highlights: ["古堡", "屯堡建筑"] },
  { id: 'xinjiang', name: '新疆', x: 18.3, y: 28, w: 22.8, h: 18.6, intro: '维吾尔族民居——丝路干旱区生土民居典范', highlights: ["生土民居", "国家级非遗"] },
  { id: 'taiwan', name: '台湾', x: 76.7, y: 75.8, w: 4, h: 4, intro: '台湾传统闽南式建筑与红砖洋楼', highlights: ["红砖洋楼"] },
  { id: 'xianggang', name: '香港', x: 65.7, y: 82.3, w: 3, h: 3, intro: '香港早期客家围村建筑', highlights: ["客家围村"] },
  { id: 'aomen', name: '澳门', x: 62.4, y: 84, w: 3, h: 3, intro: '澳门中西合璧的历史街区建筑', highlights: ["中葡交融"] }
];

// 因为原版手绘图上缺失了这四个省份的文字，所以我们需要让它们的 UI 标签永久显示
const ALWAYS_VISIBLE_LABELS = ['shanghai'];

function PetAvatar({ skin, left, top, moving, onClick }: any) {
  const [facing, setFacing] = useState(1); // 1: right, -1: left
  const lastLeft = useRef(left);

  // 智能转身逻辑：实时对比坐标位移方向
  useEffect(() => {
    if (left < lastLeft.current) {
      setFacing(-1); // 向左走，镜像翻转
    } else if (left > lastLeft.current) {
      setFacing(1);  // 向右走，恢复默认
    }
    lastLeft.current = left;
  }, [left]);

  return (
    <motion.button
      type="button"
      className={`pet-avatar-container ${moving ? 'is-moving' : ''}`}
      style={{
        position: 'absolute',
        zIndex: 10,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        outline: 'none',
        pointerEvents: 'auto',
        // 确保中心点对齐
        transform: 'translate(-50%, -100%)'
      } as CSSProperties}
      initial={false}
      animate={{ 
        left: `${left}%`, 
        top: `${top}%` 
      }}
      /* ========================================================
         移动参数调整区 (如果需要调整速度，请修改此处)
         ======================================================== */
      transition={{
        // 横向平移时长 (单位: 秒)，数值越大走得越慢
        left: { duration: 2.2, ease: "easeInOut" }, 
        // 纵向跳跃弹力参数
        top: { 
          type: "spring", 
          stiffness: 35, // 刚度：越小越软
          damping: 15,   // 阻尼：越大越稳
          mass: 1.5      // 质量：越大越沉重
        }
      }}
      /* ======================================================== */
      onClick={onClick}
    >
      {/* 桌宠形象组件：处理跳动、呼吸与翻转 */}
      <motion.img
        src={skin.image}
        alt={skin.label}
        style={{ 
          width: '82px', 
          height: 'auto', 
          display: 'block',
          filter: moving ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.15))' : 'none'
        }}
        animate={{
          // 根据原图朝向计算最终 scaleX，确保移动时始终面朝前方
          scaleX: facing * skin.baseFacing,
          // 移动时快速跳动 [0, -12, 0]，静止时慢速浮动 [0, -4, 0]
          y: moving ? [0, -12, 0] : [0, -4, 0],
          // 移动时节奏形变：跳起拉长，落地压扁
          scaleY: moving ? [1, 1.1, 0.9, 1] : 1
        }}
        transition={{
          y: {
            duration: moving ? 0.25 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          scaleY: {
            duration: 0.25,
            repeat: Infinity,
            ease: "easeInOut"
          },
          scaleX: { duration: 0.2 } // 转向平滑过渡
        }}
      />
      
      {/* 底部名称标签 */}
      <div className="pet-avatar__label" style={{ 
        marginTop: '-8px',
        position: 'relative',
        zIndex: 2,
        pointerEvents: 'none'
      }}>
        {skin.label}
      </div>
    </motion.button>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const [focusedProvinceId, setFocusedProvinceId] = useState(PROVINCES[0].id);
  const [petSkinIndex, setPetSkinIndex] = useState(0);
  const [petPosition, setPetPosition] = useState({ left: PROVINCES[0].x, top: PROVINCES[0].y });
  const [petMoving, setPetMoving] = useState(false);
  const moveTimerRef = useRef<number | null>(null);

  const selectedProvince = useMemo(
    () => PROVINCES.find((p) => p.id === focusedProvinceId),
    [focusedProvinceId]
  );
  const currentSkin = PET_SKINS[petSkinIndex % PET_SKINS.length];

  const triggerProvinceVisit = (province: Province) => {
    if (petMoving) return;
    setFocusedProvinceId(province.id);
    setPetMoving(true);
    setPetPosition({ left: province.x, top: province.y });

    if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current);
    
    moveTimerRef.current = window.setTimeout(() => {
      setPetMoving(false);
    }, 2400); 
  };

  return (
    <div style={{ width: '100vw', height: '100vh', paddingTop: '64px', boxSizing: 'border-box', background: '#F4ECDF', overflow: 'hidden', position: 'relative' }}>
      <section className="map-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="map-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <header className="map-header" style={{ flexShrink: 0 }}>
            <div className="map-hint">当前聚焦：{selectedProvince?.name ?? '未选择'}</div>
          </header>

          <div className="map-shell" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, paddingBottom: '40px' }}>
            {/* 紧紧包裹图片的 wrapper，确保坐标系与图片物理边界一致 */}
            <div 
              style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}
            >
              
              <img 
                src={chinaMapUrl} 
                alt="中国地图" 
                style={{ 
                  display: 'block', 
                  maxWidth: '100%', 
                  maxHeight: 'calc(100vh - 180px)', // 严格约束高度，留出按钮空间
                  width: 'auto', 
                  height: 'auto' 
                }} 
              />

              
              <div className="map-hotspots" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                {PROVINCES.map((p) => (
                  <button key={p.id} className={`province-hotspot ${p.id === focusedProvinceId ? 'is-active' : ''}`}
                    style={{ '--x': p.x, '--y': p.y, '--w': p.w, '--h': p.h } as CSSProperties}
                    onClick={() => triggerProvinceVisit(p)}
                  >
                    <span style={ALWAYS_VISIBLE_LABELS.includes(p.id) ? { 
                      opacity: 1, 
                      background: 'transparent', 
                      border: 'none', 
                      boxShadow: 'none',
                      color: '#2F251F',
                      fontWeight: 600,
                      fontSize: '14px',
                      padding: 0
                    } : undefined}>
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
              
              <PetAvatar skin={currentSkin} left={petPosition.left} top={petPosition.top} moving={petMoving} onClick={() => setPetSkinIndex(i => i + 1)} />

              {/* 点击进入按钮：压在地图边缘线上 */}
              <div style={{ 
                position: 'absolute', 
                bottom: '0px', // 置于底部边缘
                left: '50%', 
                transform: 'translateX(-50%) translateY(50%)', // 向下偏移半个自身高度，使其压线显示
                zIndex: 20 
              }}>


                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="enter-province-btn"
                  style={{
                    padding: '8px 32px',
                    fontSize: '16px',
                    letterSpacing: '0.1em',
                    background: 'linear-gradient(180deg, #a1432c, #7e301e)',
                    color: '#fff7e6',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(126, 48, 30, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    opacity: petMoving ? 0.6 : 1
                  }}
                  onClick={() => !petMoving && navigate('/learn/' + focusedProvinceId)}
                >
                  <span>点击进入 {selectedProvince?.name}</span>
                  <span style={{ fontSize: '12px' }}>→</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* 底部版权说明 */}
      <div style={{ 
        position: 'absolute', 
        bottom: '8px', 
        right: '16px', 
        fontSize: '16.8px', 
        color: '#8A7B66',
        zIndex: 50
      }}>
        底图来源：<a href="http://bzdt.ch.mnr.gov.cn/" target="_blank" rel="noopener noreferrer" style={{ color: '#8A7B66', textDecoration: 'underline' }}>标准地图服务（http://bzdt.ch.mnr.gov.cn/）网站</a>
      </div>

    </div>

  );
}