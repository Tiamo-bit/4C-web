import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { PuzzleScene } from '../features/puzzle/PuzzleScene';

type PhaserGameProps = {
  onComplete?: () => void;
};

export default function PhaserGame({ onComplete }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (gameRef.current) return;

    const handlePuzzleCompleted = () => {
      onCompleteRef.current?.();
    };

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
      callbacks: {
        postBoot: (game) => {
          const scene = game.scene.getScene('PuzzleScene');
          scene.events.on('PuzzleCompleted', handlePuzzleCompleted);
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('PuzzleScene');
        scene?.events.off('PuzzleCompleted', handlePuzzleCompleted);
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} id="phaser-container" className="absolute inset-0 z-10" />;
}
