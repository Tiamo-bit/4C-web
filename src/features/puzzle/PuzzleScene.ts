import * as Phaser from 'phaser';
import { useGestureStore } from '../../store/useGestureStore';

// We import the static asset via Vite to get the resolved URL
import testBuildingUrl from '../../assets/buildings/test-building.png';

export class PuzzleScene extends Phaser.Scene {
  private draggedPiece: Phaser.GameObjects.Image | null = null;
  private puzzlePieces: Phaser.GameObjects.Image[] = [];
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
    this.load.image('test-building', testBuildingUrl);
  }

  create() {
    const { width: screenW, height: screenH } = this.scale;

    // ── 1. Image Slicing Logic ────────────────────────────────────────
    const texture = this.textures.get('test-building');
    const sourceW = texture.source[0].width;
    const sourceH = texture.source[0].height;

    const halfW = sourceW / 2;
    const halfH = sourceH / 2;

    // Create 4 frames on the base texture (2x2 grid)
    // img.add(name, sourceIndex, x, y, width, height)
    texture.add('piece0', 0, 0, 0, halfW, halfH);         // Top-Left
    texture.add('piece1', 0, halfW, 0, halfW, halfH);     // Top-Right
    texture.add('piece2', 0, 0, halfH, halfW, halfH);     // Bottom-Left
    texture.add('piece3', 0, halfW, halfH, halfW, halfH); // Bottom-Right

    // ── 2. Define Target Slots (Center of the screen) ─────────────────
    const centerX = screenW / 2;
    const centerY = screenH / 2;

    const targets = [
      { id: 0, x: centerX - halfW / 2, y: centerY - halfH / 2 },
      { id: 1, x: centerX + halfW / 2, y: centerY - halfH / 2 },
      { id: 2, x: centerX - halfW / 2, y: centerY + halfH / 2 },
      { id: 3, x: centerX + halfW / 2, y: centerY + halfH / 2 },
    ];

    // Draw target slots outlines
    targets.forEach(t => {
      const slot = this.add.rectangle(t.x, t.y, halfW, halfH);
      slot.setStrokeStyle(2, 0x888888, 0.4);
      slot.setFillStyle(0xffffff, 0.05);
    });

    // ── 3. Create Draggable Pieces ────────────────────────────────────
    // Scatter initial positions around the edges randomly or fixed
    const scatterPositions = [
      { x: screenW * 0.15, y: screenH * 0.3 }, // Left top
      { x: screenW * 0.85, y: screenH * 0.7 }, // Right bottom
      { x: screenW * 0.15, y: screenH * 0.7 }, // Left bottom
      { x: screenW * 0.85, y: screenH * 0.3 }, // Right top
    ];

    this.puzzlePieces = targets.map((t, index) => {
      const piece = this.add.image(
        scatterPositions[index].x,
        scatterPositions[index].y,
        'test-building',
        `piece${t.id}`
      );

      // Setup piece state and interactions
      piece.setInteractive({ useHandCursor: true });
      piece.setData('targetX', t.x);
      piece.setData('targetY', t.y);
      piece.setData('isLocked', false);
      piece.setData('isSnapping', false);
      piece.setDepth(5);

      // Optional: Add a slight shadow or border to make it pop like a puzzle piece
      // Phaser images don't have borders, but we can tint or use drop shadow plugins.

      return piece;
    });

    // ── 4. Subscribe to Zustand Global Gesture Store ──────────────────
    // Transient update prevents React re-renders while giving us 60fps data
    this.unsubscribeStore = useGestureStore.subscribe((state, prevState) => {
      // Only process if pinch state changed or coordinates moved
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
            piece.setScale(1.1); // Visual lift
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

        piece.setScale(1);
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
                scaleX: 1.05,
                scaleY: 1.05,
                yoyo: true,
                duration: 150,
                ease: 'Sine.easeInOut',
                onComplete: () => {
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
      console.log('Puzzle Completed! All 4 pieces locked.');

      // Optional: Add a celebratory full-image glow or particle effect
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
