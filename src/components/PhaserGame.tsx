import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { PuzzleScene } from '../features/puzzle/PuzzleScene';

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

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

  return <div ref={containerRef} id="phaser-container" className="absolute inset-0 z-10" />;
}
