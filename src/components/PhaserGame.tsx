import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { PuzzleScene } from '../features/puzzle/PuzzleScene';
import { useHandTrackingEngine } from '../features/gesture/useHandTrackingEngine';

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // 使用 useState 存储 video 实例，触发 AI 引擎的生命周期
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // 1. 唤起物理摄像头
  useEffect(() => {
    if (!videoElement) return;

    let isActive = true;
    let currentStream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (!isActive) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        currentStream = stream;
        videoElement.srcObject = stream;
        videoElement.play().catch(e => {
          if (e.name !== 'AbortError') console.error('视频播放错误:', e);
        });
      })
      .catch(err => console.error('获取摄像头失败:', err));

    return () => {
      isActive = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      videoElement.srcObject = null;
    };
  }, [videoElement]);

  // 2. 挂载手势AI推理引擎
  useHandTrackingEngine(videoElement);

  // 3. 初始化 Phaser 游戏引擎
  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current!,
      width: window.innerWidth,
      height: window.innerHeight,
      transparent: true,
      scene: [PuzzleScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        mouse: { preventDefaultWheel: false },
        touch: { capture: false },
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* 隐藏的视频标签，作为 AI 引擎的“眼睛” */}
      <video ref={setVideoElement} style={{ display: 'none' }} autoPlay playsInline muted />
      <div ref={containerRef} id="phaser-container" className="absolute inset-0 z-10" />
    </>
  );
}