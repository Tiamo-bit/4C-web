import { useEffect, useRef, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { useGestureStore } from '../../store/useGestureStore';

const UI_THROTTLE_MS = 100;

export function useHandTrackingEngine(videoElement: HTMLVideoElement | null) {
  const setTrackingData = useGestureStore((state) => state.setTrackingData);
  const setStatus = useGestureStore((state) => state.setStatus);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const rafIdRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(-1);
  const lastUiUpdateRef = useRef<number>(0);

  const distance = useCallback(
    (a: NormalizedLandmark, b: NormalizedLandmark) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    []
  );

  useEffect(() => {
    if (!videoElement) return;

    let cancelled = false;

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


              // Pinch detection
              let pinching = false;
              for (const hand of hands) {
                if (hand.length >= 21) {
                  const d = distance(hand[4], hand[8]);
                  if (d < 0.1) {
                    pinching = true;
                    break;
                  }
                }
              }

              // Extract index finger and map coordinates
              let normCoords: { x: number; y: number } | null = null;
              let physicsX = 0;
              let physicsY = 0;

              if (hands.length > 0 && hands[0].length >= 21) {
                const lm = hands[0][8];
                // Mirror correction for front camera
                normCoords = { x: 1 - lm.x, y: lm.y };
                physicsX = normCoords.x * window.innerWidth;
                physicsY = normCoords.y * window.innerHeight;
              }

              // Update Zustand Store
              const timeSinceLastUi = now - lastUiUpdateRef.current;

              if (normCoords) {
                if (timeSinceLastUi >= UI_THROTTLE_MS) {
                  lastUiUpdateRef.current = now;
                  setTrackingData(
                    { x: physicsX, y: physicsY, isPinching: pinching },
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
                  setTrackingData({ x: physicsX, y: physicsY, isPinching: pinching });
                }
              } else if (timeSinceLastUi >= UI_THROTTLE_MS) {
                // Lost hand update
                lastUiUpdateRef.current = now;
                setTrackingData(
                  { x: 0, y: 0, isPinching: false },
                  {
                    display: {
                      coords: null,
                      isPinching: false,
                      handCount: 0,
                    },
                  }
                );
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
  }, [videoElement, distance, setStatus, setTrackingData]);
}
