// AI辅助生成： [你的AI模型] , 2026-03-30
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '64px',
        background: 'rgba(244, 236, 223, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(47, 37, 31, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        zIndex: 10000,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#2F251F', fontSize: '1.25rem', letterSpacing: '1px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          4C 古建数字化平台
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '32px' }}>
        <Link 
          to="/map" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/map' ? '#D23918' : '#2F251F',
            fontWeight: location.pathname === '/map' ? 'bold' : 'normal',
            transition: 'color 0.3s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#D23918')}
          onMouseLeave={(e) => (e.currentTarget.style.color = location.pathname === '/map' ? '#D23918' : '#2F251F')}
        >
          数字地图
        </Link>
      </div>
    </nav>
  );
}
