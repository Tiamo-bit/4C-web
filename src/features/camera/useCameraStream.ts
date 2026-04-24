import { useEffect, useRef, useState } from 'react';

export interface CameraStreamResult {
  videoElement: HTMLVideoElement | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

/**
 * Hook responsible solely for managing the camera lifecycle.
 * Requests user media, attaches it to a hidden video element, and cleans up on unmount.
 */
export function useCameraStream(): CameraStreamResult {
  const [status, setStatus] = useState<CameraStreamResult['status']>('idle');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    // 1. Create a hidden <video> element
    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.style.position = 'absolute';
    video.style.width = '0';
    video.style.height = '0';
    video.style.overflow = 'hidden';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);
    videoRef.current = video;

    // 2. Initialize Camera
    async function initCamera() {
      try {
        setStatus('loading');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        if (cancelled) return;

        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Unknown camera error');
        }
      }
    }

    initCamera();

    // 3. Cleanup on unmount
    return () => {
      cancelled = true;

      // Stop all camera tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Remove the hidden <video> element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, []);

  return {
    videoElement: videoRef.current,
    status,
    error,
  };
}
