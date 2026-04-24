import { useMemo } from 'react';
import { useCameraStream } from './features/camera/useCameraStream';
import { useHandTrackingEngine } from './features/gesture/useHandTrackingEngine';
import { useGestureStore } from './store/useGestureStore';
import PhaserGame from './components/PhaserGame';

export default function App() {
  // 1. Initialize Camera
  const { videoElement, status: cameraStatus, error: cameraError } = useCameraStream();

  // 2. Feed video to Hand Tracking Engine
  useHandTrackingEngine(videoElement);

  // 3. Consume throttled UI state from Zustand
  const display = useGestureStore((state) => state.display);
  const engineStatus = useGestureStore((state) => state.status);
  const engineError = useGestureStore((state) => state.error);

  const { coords, isPinching, handCount } = display;
  const isLoading = engineStatus === 'idle' || engineStatus === 'loading' || cameraStatus === 'loading';
  const hasError = engineStatus === 'error' || cameraStatus === 'error';

  const pixel = useMemo(() => {
    if (!coords) return null;
    return {
      x: coords.x * window.innerWidth,
      y: coords.y * window.innerHeight,
    };
  }, [coords]);

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden select-none">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gray-950/90 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin" />
          <p className="text-lg text-purple-300 tracking-wide animate-pulse">
            Initializing Architecture Puzzle...
          </p>
        </div>
      )}

      {/* Error banner */}
      {hasError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-950/90">
          <p className="text-red-400 text-xl">
            ⚠ Failed to load hand tracking: {engineError || cameraError}
          </p>
        </div>
      )}

      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Phaser Game */}
      <PhaserGame />

      {/* Visual crosshair tracker */}
      {pixel && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: `${pixel.x}px`,
            top: `${pixel.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`absolute -inset-8 rounded-full transition-all duration-200 ${
              isPinching
                ? 'bg-emerald-500/15 shadow-[0_0_40px_12px_rgba(52,211,153,.25)]'
                : 'bg-purple-500/10 shadow-[0_0_30px_8px_rgba(168,85,247,.15)]'
            }`}
          />
          <div
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              isPinching
                ? 'bg-emerald-400 shadow-[0_0_16px_4px_rgba(52,211,153,.6)]'
                : 'bg-purple-400 shadow-[0_0_12px_3px_rgba(168,85,247,.5)]'
            }`}
          />
        </div>
      )}

      {/* Status badge */}
      <div className="absolute bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gray-900/60 backdrop-blur-md border border-gray-700/40 px-4 py-2 text-xs text-gray-400">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            engineStatus === 'ready'
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,.6)]'
              : 'bg-amber-400 animate-pulse'
          }`}
        />
        {engineStatus === 'ready'
          ? `Tracking · ${handCount} hand(s)`
          : 'Loading...'}
      </div>
    </div>
  );
}
