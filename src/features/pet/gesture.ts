import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";
import type { Direction } from "./petTypes";

export type DirectionGestureOptions = {
  enabled?: boolean;
  threshold?: number;
  lockTimeMs?: number;
  onDirection: (direction: Direction) => void;
};

export function resolveDirectionFromDelta(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold = 36,
): Direction | null {
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function useDirectionalGesture({
  enabled = true,
  threshold = 36,
  lockTimeMs = 500,
  onDirection,
}: DirectionGestureOptions) {
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const lockRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (event: PointerEvent | TouchEvent) => {
      if ("touches" in event && event.touches.length > 1) return;
      event.preventDefault?.();
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    return () => window.removeEventListener("touchmove", onMove);
  }, [enabled]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled) return;
    startRef.current = { x: event.clientX, y: event.clientY, t: performance.now() };
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled) return;
    const start = startRef.current;
    if (!start) return;
    const now = performance.now();
    if (now < lockRef.current) return;

    const direction = resolveDirectionFromDelta(
      start.x,
      start.y,
      event.clientX,
      event.clientY,
      threshold,
    );
    startRef.current = null;
    if (!direction) return;

    lockRef.current = now + lockTimeMs;
    onDirection(direction);
  };

  const onTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    if (!enabled || event.touches.length === 0) return;
    const touch = event.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY, t: performance.now() };
  };

  const onTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    if (!enabled) return;
    const start = startRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const now = performance.now();
    if (now < lockRef.current) return;

    const direction = resolveDirectionFromDelta(
      start.x,
      start.y,
      touch.clientX,
      touch.clientY,
      threshold,
    );
    startRef.current = null;
    if (!direction) return;

    lockRef.current = now + lockTimeMs;
    onDirection(direction);
  };

  return {
    onPointerDown,
    onPointerUp,
    onTouchStart,
    onTouchEnd,
  };
}

type MediaPipeDirectionOptions = {
  enabled?: boolean;
  onDirection: (direction: Direction) => void;
  video?: HTMLVideoElement | null;
  modelAssetPath?: string;
  runningMode?: "VIDEO";
  minMoveDistance?: number;
  lockTimeMs?: number;
};

// AI辅助优化： [你的AI模型] , 2026-04-17
export async function startMediaPipeDirectionRecognizer({
  enabled = true,
  onDirection,
  video,
  modelAssetPath = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  runningMode = "VIDEO",
  minMoveDistance = 0.08,
  lockTimeMs = 520,
}: MediaPipeDirectionOptions) {
  if (!enabled || !video) return () => undefined;
  if (!navigator.mediaDevices?.getUserMedia) return () => undefined;

  const [{ HandLandmarker, FilesetResolver }, stream] = await Promise.all([
    import("@mediapipe/tasks-vision"),
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }),
  ]);

  video.srcObject = stream;
  await video.play();

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
  );

  const landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath,
      delegate: "GPU",
    },
    runningMode,
    numHands: 1,
  });

  let rafId = 0;
  let lastEmitAt = 0;
  let lastCenter: { x: number; y: number } | null = null;

  const averageCenter = (landmarks: Array<{ x: number; y: number }>) => {
    const sum = landmarks.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
      },
      { x: 0, y: 0 },
    );
    return { x: sum.x / landmarks.length, y: sum.y / landmarks.length };
  };

  const detect = () => {
    const now = performance.now();
    const result = landmarker.detectForVideo(video, now);
    const landmarks = result.landmarks?.[0];

    if (landmarks?.length) {
      const center = averageCenter(landmarks);
      if (lastCenter) {
        const dx = center.x - lastCenter.x;
        const dy = center.y - lastCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= minMoveDistance && now - lastEmitAt >= lockTimeMs) {
          const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
          lastEmitAt = now;
          onDirection(direction);
        }
      }
      lastCenter = center;
    }

    rafId = window.requestAnimationFrame(detect);
  };

  rafId = window.requestAnimationFrame(detect);

  return () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    landmarker.close();
    const streamTrack = video.srcObject as MediaStream | null;
    streamTrack?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  };
}
