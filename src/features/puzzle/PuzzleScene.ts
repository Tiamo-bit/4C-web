import * as Phaser from 'phaser';
import { useGestureStore } from '../../store/useGestureStore';

// Import all province puzzle images statically so Vite can resolve them
const puzzleModules = import.meta.glob('../../assets/buildings/*/puzzle.png', { eager: true, import: 'default' }) as Record<string, string>;

function getPuzzleUrl(provinceId: string): string {
  // Keys look like "../../assets/buildings/beijing/puzzle.png"
  const key = `../../assets/buildings/${provinceId}/puzzle.png`;
  return puzzleModules[key] || '';
}

// Fallback to test-building if province puzzle not found
import testBuildingUrl from '../../assets/buildings/test-building.png';

const GRID = 3;        // 3×3 = 9 pieces
const SCALE_FACTOR = 1; // 原始尺寸

export class PuzzleScene extends Phaser.Scene {
  private draggedPiece: Phaser.GameObjects.Image | null = null;
  private puzzlePieces: Phaser.GameObjects.Image[] = [];
  private fitScale = 1;
  private wasPinching = false;
  private worldX = 0;
  private worldY = 0;
  private unsubscribeStore: (() => void) | null = null;
  private debugCursor!: Phaser.GameObjects.Graphics;
  private cursorTween!: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'PuzzleScene' });
  }

  preload() {
    const provinceId = this.registry.get('provinceId') || 'beijing';
    const puzzleUrl = getPuzzleUrl(provinceId);
    const imageUrl = puzzleUrl || testBuildingUrl;
    this.load.image('puzzle-source', imageUrl);
  }

  create() {
    const { width: screenW, height: screenH } = this.scale;

    // ── 1. Image Slicing Logic (3×3) ────────────────────────────────
    const texture = this.textures.get('puzzle-source');
    const sourceW = texture.source[0].width;
    const sourceH = texture.source[0].height;

    // Use the smaller dimension for a square crop
    const cropSize = Math.min(sourceW, sourceH);
    const offsetX = Math.floor((sourceW - cropSize) / 2);
    const offsetY = Math.floor((sourceH - cropSize) / 2);

    const sliceW = Math.floor(cropSize / GRID);
    const sliceH = Math.floor(cropSize / GRID);

    // Create 9 frames on the base texture (3×3 grid)
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const name = `piece${row * GRID + col}`;
        texture.add(name, 0,
          offsetX + col * sliceW, offsetY + row * sliceH,
          sliceW, sliceH
        );
      }
    }

    // ── 2. Define Target Slots (Center, auto-fit to screen) ──────────
    const centerX = screenW / 2;
    const centerY = screenH / 2;

    // Auto-scale: assembled puzzle should fit ~60% of the smaller screen dimension
    const maxPuzzlePx = Math.min(screenW, screenH - 80) * 0.6;
    this.fitScale = maxPuzzlePx / (sliceW * GRID);
    const displayW = sliceW * this.fitScale;
    const displayH = sliceH * this.fitScale;

    const targets: { id: number; x: number; y: number }[] = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        targets.push({
          id: row * GRID + col,
          x: centerX + (col - 1) * displayW,
          y: centerY + (row - 1) * displayH,
        });
      }
    }

    // Draw target slots outlines
    targets.forEach(t => {
      const slot = this.add.rectangle(t.x, t.y, displayW, displayH);
      slot.setStrokeStyle(2, 0x888888, 0.4);
      slot.setFillStyle(0xffffff, 0.05);
    });

    // ── 3. Create Draggable Pieces ────────────────────────────────────
    // Scatter initial positions around the edges
    const scatterPositions = targets.map((_, i) => ({
      x: screenW * (0.1 + Math.random() * 0.2) + (i % 2 === 0 ? 0 : screenW * 0.55),
      y: screenH * (0.15 + (i / (GRID * GRID)) * 0.7),
    }));

    this.puzzlePieces = targets.map((t, index) => {
      const piece = this.add.image(
        scatterPositions[index].x,
        scatterPositions[index].y,
        'puzzle-source',
        `piece${t.id}`
      );

      piece.setScale(this.fitScale);
      piece.setInteractive({ useHandCursor: true });
      piece.setData('targetX', t.x);
      piece.setData('targetY', t.y);
      piece.setData('isLocked', false);
      piece.setData('isSnapping', false);
      piece.setDepth(5);

      return piece;
    });

    // ── 4. Subscribe to Zustand Global Gesture Store ──────────────────
    this.unsubscribeStore = useGestureStore.subscribe((state, prevState) => {
      if (
        state.x !== prevState.x ||
        state.y !== prevState.y ||
        state.isPinching !== prevState.isPinching
      ) {
        this.handleGestureUpdate(state.x, state.y, state.isPinching);
      }
    });

    // ── 5. Initialize Halo Cursor ───────────────────────────────────────
    this.debugCursor = this.add.graphics();
    this.debugCursor.setDepth(100);
    this.drawCursorRing(0xff0000, 20);
    this.startBreathing();
  }

  private drawCursorRing(color: number, radius: number) {
    this.debugCursor.clear();
    // Inner solid ring
    this.debugCursor.lineStyle(2, color, 1);
    this.debugCursor.strokeCircle(0, 0, radius);

    // Outer halo ring (simulating soft gradient edge)
    this.debugCursor.lineStyle(6, color, 0.3);
    this.debugCursor.strokeCircle(0, 0, radius + 2);
  }

  private startBreathing() {
    if (this.cursorTween) this.cursorTween.stop();
    this.debugCursor.setScale(1);
    this.debugCursor.setAlpha(0.6);

    this.cursorTween = this.tweens.add({
      targets: this.debugCursor,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update() {
    // Continuous drag follows the hand's world coordinates
    if (this.draggedPiece) {
      this.draggedPiece.setPosition(this.worldX, this.worldY);
    }
    if (this.debugCursor) {
      this.debugCursor.setPosition(this.worldX, this.worldY);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Physics & Dragging Logic                                           */
  /* ------------------------------------------------------------------ */

  private handleGestureUpdate(viewportX: number, viewportY: number, isPinching: boolean) {
    // Guard: scene may not be fully ready or may be shutting down
    if (!this.cameras || !this.cameras.main || !this.game || !this.game.canvas) return;

    // 1. Convert Viewport to World Coordinates
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const canvasX = (viewportX - canvasRect.left) * scaleX;
    const canvasY = (viewportY - canvasRect.top) * scaleY;

    const worldPoint = this.cameras.main.getWorldPoint(canvasX, canvasY);
    this.worldX = worldPoint.x;
    this.worldY = worldPoint.y;

    // 2. Pinch Start (Grab)
    if (isPinching && !this.wasPinching) {
      if (!this.draggedPiece) {
        // Iterate backwards so pieces visually on top are grabbed first
        for (let i = this.puzzlePieces.length - 1; i >= 0; i--) {
          const piece = this.puzzlePieces[i];

          if (piece.getData('isLocked') || piece.getData('isSnapping')) continue;

          const bounds = piece.getBounds();
          if (Phaser.Geom.Rectangle.Contains(bounds, this.worldX, this.worldY)) {
            this.draggedPiece = piece;
            piece.setDepth(10); // Bring to front
            piece.setScale(this.fitScale * 1.1); // Visual lift
            piece.setAlpha(0.9);
            break;
          }
        }
      }

      // Cursor transition: Pinched (shrink, high opacity, green)
      this.drawCursorRing(0x00ff00, 15);
      if (this.cursorTween) this.cursorTween.stop();

      this.tweens.add({
        targets: this.debugCursor,
        scaleX: 0.8,
        scaleY: 0.8,
        alpha: 0.9,
        duration: 150,
        ease: 'Cubic.easeOut'
      });
    }

    // 3. Pinch End (Release)
    if (!isPinching && this.wasPinching) {
      if (this.draggedPiece) {
        const piece = this.draggedPiece;

        piece.setScale(this.fitScale);
        piece.setAlpha(1);
        piece.setDepth(5);

        // Snap to grid logic
        const targetX = piece.getData('targetX');
        const targetY = piece.getData('targetY');
        const dist = Phaser.Math.Distance.Between(piece.x, piece.y, targetX, targetY);

        const SNAP_THRESHOLD = 80;

        if (dist <= SNAP_THRESHOLD) {
          piece.setData('isSnapping', true);

          this.tweens.add({
            targets: piece,
            x: targetX,
            y: targetY,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
              piece.disableInteractive();
              piece.setData('isLocked', true);
              piece.setData('isSnapping', false);

              // Subtly flash to confirm successful placement
              this.tweens.add({
                targets: piece,
                scaleX: this.fitScale * 1.05,
                scaleY: this.fitScale * 1.05,
                yoyo: true,
                duration: 150,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  piece.setScale(this.fitScale);
                  this.checkCompletion();
                }
              });
            }
          });
        }

        this.draggedPiece = null;
      }

      // Cursor transition: Unpinched (restore large breathing red halo)
      this.drawCursorRing(0xff0000, 20);
      this.startBreathing();
    }

    this.wasPinching = isPinching;
  }

  private checkCompletion() {
    const allLocked = this.puzzlePieces.every(p => p.getData('isLocked'));
    if (allLocked) {
      this.events.emit('PuzzleCompleted');
      console.log(`Puzzle Completed! All ${GRID * GRID} pieces locked.`);

      // Save completion to localStorage
      const provinceId = this.registry.get('provinceId') || 'beijing';
      const fragments = Array.from({ length: GRID * GRID }, (_, i) => i);
      localStorage.setItem(`fragments_${provinceId}`, JSON.stringify(fragments));
      localStorage.setItem(`learn_progress_${provinceId}`, '100');

      // Celebratory glow
      this.puzzlePieces.forEach(p => {
        this.tweens.add({
          targets: p,
          alpha: 0.8,
          yoyo: true,
          repeat: 1,
          duration: 300
        });
      });
    }
  }

  shutdown() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
  }

  destroy() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
  }
}
