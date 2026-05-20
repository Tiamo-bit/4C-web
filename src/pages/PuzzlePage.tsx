// AI辅助生成： [你的AI模型] , 2026-04-11
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PhaserGame from '../components/PhaserGame';

export default function PuzzlePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [completed, setCompleted] = useState(false);

  const handleExit = () => {
    if (id) {
      navigate(`/learn/${id}#puzzle-entry`, { replace: true });
      return;
    }

    navigate('/map', { replace: true });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '64px', boxSizing: 'border-box', background: '#2b2621' }}>
      <button 
        onClick={handleExit}
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
      {completed && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '36px',
            transform: 'translateX(-50%)',
            zIndex: 120,
            width: 'min(520px, calc(100vw - 48px))',
            padding: '18px 22px',
            borderRadius: '16px',
            border: '1px solid rgba(231, 211, 170, 0.38)',
            background: 'rgba(244, 236, 223, 0.94)',
            color: '#2F251F',
            boxShadow: '0 18px 42px rgba(0, 0, 0, 0.28)',
            textAlign: 'center',
            lineHeight: 1.8,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ display: 'block', fontSize: '1.15rem', color: '#7e301e' }}>榫卯归位</strong>
          <span>愿你在斗拱梁枋之间，看见千年匠心，也把稳固与从容带回自己的生活。</span>
        </div>
      )}
      <PhaserGame onComplete={() => setCompleted(true)} />
    </div>
  );
}
