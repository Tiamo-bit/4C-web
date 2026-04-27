// AI辅助生成： [你的AI模型] , 2026-04-11
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PhaserGame from '../components/PhaserGame';

export default function PuzzlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '64px', boxSizing: 'border-box', background: '#1A1512' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: '80px', left: '30px', zIndex: 100,
          padding: '12px 24px', background: 'rgba(255, 255, 255, 0.1)',
          color: '#F4ECDF', border: '1px solid #9B7B52', borderRadius: '6px',
          cursor: 'pointer', fontWeight: 'bold', backdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(243, 104, 56, 0.8)';
          e.currentTarget.style.borderColor = '#F36838';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = '#9B7B52';
        }}
      >
        ← 退出拼图
      </button>
      <PhaserGame provinceId={id || 'beijing'} />
    </div>
  );
}
