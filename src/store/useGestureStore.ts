import { create } from 'zustand';

export interface HandDisplayState {
  /** Normalised index-finger-tip coordinates (mirrored), null if no hand */
  coords: { x: number; y: number } | null;
  /** Whether a pinch gesture is currently detected */
  isPinching: boolean;
  /** Number of hands currently detected */
  handCount: number;
}

interface GestureState {
  // ── High Frequency Physics Data (Consumed via .subscribe()) ──
  x: number; // Viewport X (pixels)
  y: number; // Viewport Y (pixels)
  isPinching: boolean;

  // ── Low Frequency UI Data (Consumed via standard React useStore) ──
  display: HandDisplayState;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;

  // ── Actions ──
  setTrackingData: (
    physics: { x: number; y: number; isPinching: boolean },
    uiUpdate?: { display: HandDisplayState }
  ) => void;
  setStatus: (status: GestureState['status'], error?: string | null) => void;
}

export const useGestureStore = create<GestureState>((set) => ({
  // Initial Physics State
  x: 0,
  y: 0,
  isPinching: false,

  // Initial UI State
  display: {
    coords: null,
    isPinching: false,
    handCount: 0,
  },
  status: 'idle',
  error: null,

  // Setters
  setTrackingData: (physics, uiUpdate) =>
    set((state) => {
      if (uiUpdate) {
        return { ...physics, ...uiUpdate };
      }
      return { ...physics };
    }),

  setStatus: (status, error = null) => set({ status, error }),
}));
