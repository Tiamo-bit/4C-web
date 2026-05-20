import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import PuzzlePage from './pages/PuzzlePage';
import LearnPage from './pages/LearnPage';
import ProvinceBuildingSelectPage from './pages/ProvinceBuildingSelectPage';
import { useCameraStream } from './features/camera/useCameraStream';
import { useHandTrackingEngine } from './features/gesture/useHandTrackingEngine';
import { useGestureStore } from './store/useGestureStore';

function GestureRuntime() {
  const { videoElement, status: cameraStatus, error: cameraError } = useCameraStream();
  useHandTrackingEngine(videoElement);

  const display = useGestureStore((state) => state.display);
  const engineStatus = useGestureStore((state) => state.status);
  const engineError = useGestureStore((state) => state.error);

  return (
    <>
      {display.coords && (
        <div
          style={{
            position: 'fixed',
            left: `${display.coords.x * 100}vw`,
            top: `${display.coords.y * 100}vh`,
            width: display.isPinching ? 24 : 34,
            height: display.isPinching ? 24 : 34,
            borderRadius: '50%',
            border: `2px solid ${display.isPinching ? '#16A951' : '#F36838'}`,
            boxShadow: `0 0 16px ${display.isPinching ? 'rgba(22,169,81,0.65)' : 'rgba(243,104,56,0.5)'}`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 20000,
          }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 20000,
          padding: '8px 12px',
          borderRadius: 6,
          background: 'rgba(26, 21, 18, 0.72)',
          color: '#F4ECDF',
          fontSize: 12,
          pointerEvents: 'none',
        }}
      >
        Camera: {cameraStatus} / AI: {engineStatus}
        {(cameraError || engineError) && ` / ${cameraError || engineError}`}
      </div>
    </>
  );
}

function GestureRuntimeHost() {
  const location = useLocation();
  return location.pathname.startsWith('/puzzle/') ? <GestureRuntime /> : null;
}

function App() {
  return (
    <BrowserRouter>
      <GestureRuntimeHost />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/province/:id" element={<ProvinceBuildingSelectPage />} />
        <Route path="/learn/:id" element={<LearnPage />} />
        <Route path="/puzzle/:id" element={<PuzzlePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
