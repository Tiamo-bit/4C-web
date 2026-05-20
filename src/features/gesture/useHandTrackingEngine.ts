import { useEffect, useRef, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { useGestureStore } from '../../store/useGestureStore';

const UI_THROTTLE_MS = 100;
const SMOOTHING_ALPHA = 0.42;
const MAX_JUMP_PX_PER_FRAME = 90;
const LOST_HAND_GRACE_MS = 200;
const PINCH_START_THRESHOLD = 0.075;
const PINCH_END_THRESHOLD = 0.11;
const PINCH_STABLE_FRAMES = 2;

type Point = { x: number; y: number };

export function useHandTrackingEngine(videoElement: HTMLVideoElement | null) {
  const setTrackingData = useGestureStore((state) => state.setTrackingData);
  const setStatus = useGestureStore((state) => state.setStatus);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const rafIdRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(-1);
  const lastUiUpdateRef = useRef<number>(0);
  const smoothedPointRef = useRef<Point | null>(null);
  const lastValidPointRef = useRef<Point | null>(null);
  const lostHandSinceRef = useRef<number | null>(null);
  const pinchStateRef = useRef(false);
  const pinchStableFramesRef = useRef(0);

  const distance = useCallback(
    (a: NormalizedLandmark, b: NormalizedLandmark) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    []
  );

  const clampJump = useCallback((next: Point, prev: Point | null) => {
    if (!prev) return next;

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= MAX_JUMP_PX_PER_FRAME || dist === 0) return next;

    const ratio = MAX_JUMP_PX_PER_FRAME / dist;
    return {
      x: prev.x + dx * ratio,
      y: prev.y + dy * ratio,
    };
  }, []);

  const smoothPoint = useCallback((raw: Point) => {
    const prev = smoothedPointRef.current;
    const clamped = clampJump(raw, prev);

    if (!prev) {
      smoothedPointRef.current = clamped;
      return clamped;
    }

    // EMA keeps normal hand tremor from becoming cursor jitter while still
    // allowing fast movement through the jump clamp above.
    const smoothed = {
      x: prev.x + (clamped.x - prev.x) * SMOOTHING_ALPHA,
      y: prev.y + (clamped.y - prev.y) * SMOOTHING_ALPHA,
    };

    smoothedPointRef.current = smoothed;
    return smoothed;
  }, [clampJump]);

  const updatePinchState = useCallback(
    (hand: NormalizedLandmark[]) => {
      const d = distance(hand[4], hand[8]);
      const wasPinching = pinchStateRef.current;
      const crossedThreshold = wasPinching
        ? d > PINCH_END_THRESHOLD
        : d < PINCH_START_THRESHOLD;

      if (crossedThreshold) {
        pinchStableFramesRef.current += 1;
      } else {
        pinchStableFramesRef.current = 0;
      }

      // Separate start/end thresholds plus stable frames avoid repeated
      // grab/release when the fingertips hover around a single cutoff.
      if (pinchStableFramesRef.current >= PINCH_STABLE_FRAMES) {
        pinchStateRef.current = !wasPinching;
        pinchStableFramesRef.current = 0;
      }

      return pinchStateRef.current;
    },
    [distance]
  );

  useEffect(() => {
    if (!videoElement) return;

    let cancelled = false;

    // AI辅助优化： [你的AI模型] , 2026-04-14
    async function initEngine() {
      try {
        setStatus('loading');

        // 获取当前环境的 Base URL
        const baseUrl = import.meta.env.BASE_URL;

        // 使用 URL 对象将其转换为标准的绝对路径，确保末尾斜杠和域名完整
        const wasmPath = `${baseUrl}wasm`;
        const modelPath = `${baseUrl}models/hand_landmarker.task`;

        // 1. 初始化 WASM 运行库
        const vision = await FilesetResolver.forVisionTasks(wasmPath);

        if (cancelled) return;

        // 2. 初始化手势识别引擎
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU" // 推荐显式开启 GPU 加速
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });

        if (cancelled) return;
        handLandmarkerRef.current = landmarker;
        setStatus('ready');

        // Engine Detection Loop
        // AI辅助优化： [你的AI模型] , 2026-04-14
        function detect() {
          if (cancelled || !videoElement) return;

          if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const now = performance.now();

            if (now !== lastTimestampRef.current) {
              lastTimestampRef.current = now;

              const result = handLandmarkerRef.current!.detectForVideo(
                videoElement,
                now
              );


              const hands = result.landmarks;
              const activeHand = hands.find((hand) => hand.length >= 21);

              // Extract index finger and map coordinates. Pinch is evaluated
              // on the same hand to avoid two-hand coordinate/gesture mismatch.
              let normCoords: { x: number; y: number } | null = null;
              let physicsPoint: Point | null = null;
              let pinching = false;

              if (activeHand) {
                lostHandSinceRef.current = null;
                const lm = activeHand[8];
                const rawNormCoords = { x: 1 - lm.x, y: lm.y };
                const rawPhysicsPoint = {
                  x: rawNormCoords.x * window.innerWidth,
                  y: rawNormCoords.y * window.innerHeight,
                };

                physicsPoint = smoothPoint(rawPhysicsPoint);
                lastValidPointRef.current = physicsPoint;
                normCoords = {
                  x: physicsPoint.x / window.innerWidth,
                  y: physicsPoint.y / window.innerHeight,
                };
                pinching = updatePinchState(activeHand);
              } else {
                if (lostHandSinceRef.current === null) {
                  lostHandSinceRef.current = now;
                }
                pinchStateRef.current = false;
                pinchStableFramesRef.current = 0;
              }

              // Update Zustand Store
              const timeSinceLastUi = now - lastUiUpdateRef.current;

              if (normCoords && physicsPoint) {
                if (timeSinceLastUi >= UI_THROTTLE_MS) {
                  lastUiUpdateRef.current = now;
                  setTrackingData(
                    { x: physicsPoint.x, y: physicsPoint.y, isPinching: pinching, isTracked: true },
                    {
                      display: {
                        coords: normCoords,
                        isPinching: pinching,
                        handCount: hands.length,
                      },
                    }
                  );
                } else {
                  // High frequency update only
                  setTrackingData({
                    x: physicsPoint.x,
                    y: physicsPoint.y,
                    isPinching: pinching,
                    isTracked: true,
                  });
                }
              } else {
                const lastPoint = lastValidPointRef.current ?? {
                  x: useGestureStore.getState().x,
                  y: useGestureStore.getState().y,
                };
                const lostForMs = lostHandSinceRef.current === null ? 0 : now - lostHandSinceRef.current;
                const shouldRefreshUi =
                  timeSinceLastUi >= UI_THROTTLE_MS ||
                  lostForMs <= LOST_HAND_GRACE_MS;

                // Keep the last valid physics coordinate during hand loss.
                // This prevents Phaser from receiving (0, 0) and moving the
                // cursor or dragged piece to the top-left corner.
                if (shouldRefreshUi) {
                  lastUiUpdateRef.current = now;
                  setTrackingData(
                    { x: lastPoint.x, y: lastPoint.y, isPinching: false, isTracked: false },
                    {
                      display: {
                        coords: null,
                        isPinching: false,
                        handCount: 0,
                      },
                    }
                  );
                } else {
                  setTrackingData({
                    x: lastPoint.x,
                    y: lastPoint.y,
                    isPinching: false,
                    isTracked: false,
                  });
                }
              }
            }
          }

          rafIdRef.current = requestAnimationFrame(detect);
        }

        rafIdRef.current = requestAnimationFrame(detect);
      } catch (err) {
        if (!cancelled) {
          setStatus('error', err instanceof Error ? err.message : 'Engine init failed');
        }
      }
    }

    initEngine();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafIdRef.current);
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
    };
  }, [videoElement, smoothPoint, updatePinchState, setStatus, setTrackingData]);
}
