import Phaser from "phaser";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import chinaMapUrl from "../map/official-china-map-gs2024-1234.png";
import { useNavigate } from "react-router-dom";
import { useDirectionalGesture, startMediaPipeDirectionRecognizer } from "./gesture";
import type {
  Direction,
  PetOnMapHandle,
  PetOnMapProps,
  PetPosition,
  PetSkin,
  ProvinceNode,
} from "./petTypes";

const DEFAULT_NODES: ProvinceNode[] = [
  { id: "beijing", name: "北京", x: 160, y: 128, neighbors: ["shanxi", "hebei"], description: "故宫、皇家营造" },
  { id: "hebei", name: "河北", x: 260, y: 182, neighbors: ["beijing", "shanxi", "shandong"], description: "赵州桥、古城墙" },
  { id: "shanxi", name: "山西", x: 224, y: 286, neighbors: ["beijing", "hebei", "henan", "shaanxi"], description: "平遥古城、晋商大院" },
  { id: "shandong", name: "山东", x: 366, y: 176, neighbors: ["hebei", "henan", "jiangsu"], description: "曲阜孔庙、海岱古建" },
  { id: "henan", name: "河南", x: 308, y: 328, neighbors: ["shanxi", "shandong", "hubei", "shaanxi"], description: "龙门石窟、中原古建" },
  { id: "shaanxi", name: "陕西", x: 176, y: 344, neighbors: ["shanxi", "henan", "sichuan"], description: "西安城墙、唐风古韵" },
  { id: "hubei", name: "湖北", x: 356, y: 416, neighbors: ["henan", "hunan", "jiangxi", "chongqing"], description: "荆楚风格、古桥古塔" },
  { id: "hunan", name: "湖南", x: 328, y: 500, neighbors: ["hubei", "jiangxi", "guangdong", "chongqing"], description: "岳阳楼、湖湘民居" },
  { id: "jiangxi", name: "江西", x: 446, y: 438, neighbors: ["hubei", "hunan", "zhejiang", "guangdong"], description: "景德镇、徽派延展" },
  { id: "zhejiang", name: "浙江", x: 514, y: 332, neighbors: ["shandong", "jiangsu", "jiangxi", "fujian"], description: "江南园林、白墙黛瓦" },
  { id: "jiangsu", name: "江苏", x: 460, y: 260, neighbors: ["shandong", "zhejiang", "anhui"], description: "苏州园林、江南水乡" },
  { id: "anhui", name: "安徽", x: 418, y: 360, neighbors: ["jiangsu", "zhejiang", "henan", "fujian"], description: "徽派建筑、马头墙" },
];

const DEFAULT_SKINS: PetSkin[] = [
  { id: "scholar", label: "书生", accent: "#C58B54", robe: "#F2E7D8", glow: "#F7DFA3", eye: "#2F2520" },
  { id: "monk", label: "小僧", accent: "#D6A33C", robe: "#E7E0D3", glow: "#E6D9AB", eye: "#2C2927" },
  { id: "lady", label: "青衣", accent: "#8D9CB8", robe: "#E9EEF7", glow: "#C9D7EE", eye: "#2C3037" },
];

type PetMapSceneParams = {
  nodes: ProvinceNode[];
  skins: PetSkin[];
  initialProvinceId: string;
  onStateChange?: (state: PetPosition) => void;
  onProvinceEnter?: (provinceId: string) => void;
  onReady?: (scene: PetMapScene) => void;
};

class PetMapScene extends Phaser.Scene {
  private nodes: ProvinceNode[];
  private nodesById: Map<string, ProvinceNode>;
  private skins: PetSkin[];
  private currentNodeId: string;
  private onStateChange?: (state: PetPosition) => void;
  private onProvinceEnter?: (provinceId: string) => void;
  private onReady?: (scene: PetMapScene) => void;
  private petSprite?: Phaser.GameObjects.Image;
  private currentSkinId: string;
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private markers = new Map<string, Phaser.GameObjects.Container>();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private isMoving = false;
  private floatTween?: Phaser.Tweens.Tween;

  constructor(params: PetMapSceneParams) {
    super("PetMapScene");
    this.nodes = params.nodes;
    this.nodesById = new Map(params.nodes.map((node) => [node.id, node]));
    this.skins = params.skins;
    this.currentNodeId = params.initialProvinceId;
    this.currentSkinId = params.skins[0]?.id ?? "scholar";
    this.onStateChange = params.onStateChange;
    this.onProvinceEnter = params.onProvinceEnter;
    this.onReady = params.onReady;
  }

  preload() {
    this.load.image('china-map', chinaMapUrl);
  }

  create() {
    this.drawBackdrop();
    this.createTextures();
    this.createNodes();
    this.createPet();
    this.createParticles();
    this.bindSceneEvents();
    this.syncState();
    this.onReady?.(this);
  }

  private drawBackdrop() {
    const { width, height } = this.scale;
    const mapImg = this.add.image(width / 2, height / 2, 'china-map');
    // 自动适配比例并居中
    const scale = Math.min(width / mapImg.width, height / mapImg.height) * 0.9;
    mapImg.setScale(scale);
  }

  private createTextures() {
    this.skins.forEach((skin) => {
      const g = this.add.graphics();
      g.clear();

      g.fillStyle(0xffffff, 0.15);
      g.fillEllipse(72, 74, 110, 118);

      g.fillStyle(0x3c3630, 0.95);
      g.lineStyle(5, 0x3c3630, 0.86);
      g.strokeEllipse(72, 72, 102, 110);

      g.fillStyle(Phaser.Display.Color.HexStringToColor(skin.robe).color, 1);
      g.fillRoundedRect(38, 56, 68, 72, 18);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(skin.accent).color, 1);
      g.fillTriangle(46, 62, 72, 28, 98, 62);
      g.fillStyle(0xffd9b0, 1);
      g.fillCircle(72, 38, 30);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(skin.eye).color, 1);
      g.fillCircle(61, 38, 3.5);
      g.fillCircle(83, 38, 3.5);
      g.lineStyle(3, Phaser.Display.Color.HexStringToColor(skin.eye).color, 1);
      g.beginPath();
      g.moveTo(60, 49);
      g.lineTo(72, 54);
      g.lineTo(84, 49);
      g.strokePath();
      g.fillStyle(Phaser.Display.Color.HexStringToColor(skin.glow).color, 0.35);
      g.fillCircle(72, 74, 62);
      g.generateTexture(`pet-skin-${skin.id}`, 144, 144);
      g.destroy();
    });

    const petGlow = this.add.graphics();
    petGlow.fillStyle(0xf9f0cc, 1);
    petGlow.fillCircle(16, 16, 16);
    petGlow.generateTexture("pet-glow", 32, 32);
    petGlow.destroy();

    const nodeTex = this.add.graphics();
    nodeTex.fillStyle(0xc49d63, 0.86);
    nodeTex.fillCircle(14, 14, 14);
    nodeTex.lineStyle(3, 0x4f3a26, 0.9);
    nodeTex.strokeCircle(14, 14, 14);
    nodeTex.generateTexture("node-marker", 28, 28);
    nodeTex.destroy();

    const spark = this.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillCircle(7, 7, 7);
    spark.fillStyle(0xf0d48a, 0.45);
    spark.fillCircle(7, 7, 4);
    spark.generateTexture("spark-dot", 14, 14);
    spark.destroy();
  }

  private createNodes() {
    const mapWidth = this.scale.width;
    const mapHeight = this.scale.height;
    const border = this.add.graphics();
    border.lineStyle(2, 0xc5b18c, 0.75);
    border.strokeRoundedRect(22, 22, mapWidth - 44, mapHeight - 44, 26);

    this.nodes.forEach((node) => {
      const marker = this.add.container(node.x, node.y);
      const ring = this.add.image(0, 0, "node-marker");
      ring.setScale(1);
      ring.setAlpha(0.72);

      const label = this.add.text(0, 28, node.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: "#49392A",
        backgroundColor: "rgba(255,255,255,0.28)",
        padding: { left: 7, right: 7, top: 2, bottom: 2 },
      });
      label.setOrigin(0.5, 0.5);

      marker.add([ring, label]);
      marker.setSize(34, 34);
      marker.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
      marker.on("pointerdown", () => this.moveToProvince(node.id, true));
      marker.on("pointerover", () => ring.setScale(1.14));
      marker.on("pointerout", () => ring.setScale(1));
      this.markers.set(node.id, marker);
      this.labels.set(node.id, label);
    });
  }

  private startFloatAnimation() {
    if (this.floatTween) this.floatTween.stop();
    this.floatTween = this.tweens.add({
      targets: this.petSprite,
      y: this.petSprite!.y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private createPet() {
    const node = this.nodesById.get(this.currentNodeId) ?? this.nodes[0];
    this.petSprite = this.add.image(node.x, node.y - 34, `pet-skin-${this.currentSkinId}`);
    this.petSprite.setScale(0.78);
    this.petSprite.setInteractive(
      new Phaser.Geom.Ellipse(0, 12, 86, 96),
      Phaser.Geom.Ellipse.Contains,
    );
    this.petSprite.on("pointerdown", () => {
      this.onProvinceEnter?.(this.currentNodeId);
    });

    this.startFloatAnimation();

    this.tweens.add({
      targets: this.petSprite,
      angle: { from: -1.2, to: 1.2 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private createParticles() {
    this.particleEmitter = this.add.particles(0, 0, "spark-dot", {
      follow: this.petSprite,
      followOffset: { x: 0, y: 20 },
      lifespan: 1000,
      speed: { min: 6, max: 26 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      frequency: 70,
      quantity: 1,
      blendMode: "ADD",
    });
  }

  private bindSceneEvents() {
    this.events.on("change-skin", (skinId: string) => this.applySkin(skinId));
    this.events.on("move-direction", (direction: Direction) => this.moveByDirection(direction));
    this.events.on("move-province", (provinceId: string) => this.moveToProvince(provinceId, false));
  }

  private updateMarkerHighlights() {
    this.markers.forEach((marker, id) => {
      const active = id === this.currentNodeId;
      marker.setScale(active ? 1.12 : 1);
      marker.setAlpha(active ? 1 : 0.78);
      const label = this.labels.get(id);
      label?.setColor(active ? "#2F251F" : "#49392A");
    });
  }

  private setCurrentProvince(provinceId: string) {
    this.currentNodeId = provinceId;
    const node = this.nodesById.get(provinceId);
    if (!node || !this.petSprite) return;
    this.petSprite.setPosition(node.x, node.y - 34);
    this.particleEmitter?.startFollow(this.petSprite);
    this.updateMarkerHighlights();
    this.syncState();
  }

  private syncState() {
    const node = this.nodesById.get(this.currentNodeId);
    if (!node || !this.petSprite) return;
    this.updateMarkerHighlights();
    this.onStateChange?.({
      provinceId: node.id,
      x: Math.round(this.petSprite.x),
      y: Math.round(this.petSprite.y),
    });
  }

  public applySkin(skinId: string) {
    if (!this.petSprite) return;
    if (!this.skins.some((skin) => skin.id === skinId)) return;
    this.currentSkinId = skinId;
    this.petSprite.setTexture(`pet-skin-${skinId}`);
    this.petSprite.setScale(0.78);
  }

  public moveByDirection(direction: Direction) {
    if (this.isMoving) return;
    const current = this.nodesById.get(this.currentNodeId);
    if (!current) return;

    const candidates = current.neighbors
      .map((id) => this.nodesById.get(id))
      .filter((node): node is ProvinceNode => Boolean(node));

    if (candidates.length === 0) return;

    const directional = candidates.filter((node) => {
      if (direction === "left") return node.x < current.x;
      if (direction === "right") return node.x > current.x;
      if (direction === "up") return node.y < current.y;
      return node.y > current.y;
    });

    const target =
      directional.sort((a, b) => {
        const da = Math.abs(a.x - current.x) + Math.abs(a.y - current.y);
        const db = Math.abs(b.x - current.x) + Math.abs(b.y - current.y);
        return da - db;
      })[0] ?? candidates.sort((a, b) => {
        const da = Math.hypot(a.x - current.x, a.y - current.y);
        const db = Math.hypot(b.x - current.x, b.y - current.y);
        return da - db;
      })[0];

    if (target) this.moveToProvince(target.id, false);
  }

  public moveToProvince(provinceId: string, triggerEnter = false) {
    const target = this.nodesById.get(provinceId);
    if (!target || !this.petSprite || this.isMoving || target.id === this.currentNodeId) {
      if (triggerEnter && target?.id === this.currentNodeId) {
        this.onProvinceEnter?.(target.id);
      }
      return;
    }

    this.isMoving = true;
    this.floatTween?.stop();
    const startX = this.petSprite.x;
    const startY = this.petSprite.y;
    const targetX = target.x;
    const targetY = target.y - 34;
    const arcHeight = -42;

      this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 620,
      ease: "Sine.inOut",
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        const x = Phaser.Math.Linear(startX, targetX, progress);
        const y = Phaser.Math.Linear(startY, targetY, progress) + Math.sin(progress * Math.PI) * arcHeight;
        this.petSprite?.setPosition(x, y);
      },
      onComplete: () => {
        this.isMoving = false;
        this.setCurrentProvince(target.id);
        this.startFloatAnimation();
        if (triggerEnter) this.onProvinceEnter?.(target.id);
      },
    });
  }

  public getCurrentProvinceId() {
    return this.currentNodeId;
  }

  public getPosition(): PetPosition {
    return {
      provinceId: this.currentNodeId,
      x: Math.round(this.petSprite?.x ?? 0),
      y: Math.round(this.petSprite?.y ?? 0),
    };
  }
}

export const PetOnMap = forwardRef<PetOnMapHandle, PetOnMapProps>(function PetOnMap(
  {
    className,
    style,
    width = "100%",
    height = 660,
    nodes = DEFAULT_NODES,
    skins = DEFAULT_SKINS,
    initialProvinceId = DEFAULT_NODES[0]?.id ?? "beijing",
    gestureMode = "auto",
    enableCamera = false,
    onProvinceEnter,
    onStateChange,
    onReady,
  },
  ref,
) {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const phaserHostRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [selectedSkinId, setSelectedSkinId] = useState(skins[0]?.id ?? "scholar");
  const [state, setState] = useState<PetPosition>({
    provinceId: initialProvinceId,
    x: 0,
    y: 0,
  });
  const [cameraStatus, setCameraStatus] = useState<"idle" | "starting" | "running" | "fallback">("idle");
  const sceneRef = useRef<PetMapScene | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const currentNode = useMemo(
    () => nodes.find((node) => node.id === state.provinceId) ?? nodes[0],
    [nodes, state.provinceId],
  );

  const gesture = useDirectionalGesture({
    enabled: true,
    onDirection: (direction) => {
      sceneRef.current?.events.emit("move-direction", direction);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      getCurrentProvinceId: () => sceneRef.current?.getCurrentProvinceId() ?? initialProvinceId,
      getPosition: () => sceneRef.current?.getPosition() ?? state,
      moveByDirection: (direction) => sceneRef.current?.events.emit("move-direction", direction),
      setSkin: (skinId) => {
        setSelectedSkinId(skinId);
        sceneRef.current?.events.emit("change-skin", skinId);
      },
      moveToProvince: (provinceId) => sceneRef.current?.events.emit("move-province", provinceId),
    }),
    [initialProvinceId, state],
  );

  useEffect(() => {
    if (!phaserHostRef.current) return;

    const scene = new PetMapScene({
      nodes,
      skins,
      initialProvinceId,
      onStateChange: (nextState) => {
        setState(nextState);
        onStateChange?.(nextState);
      },
      onProvinceEnter: (provinceId) => {
        onProvinceEnter?.(provinceId);
        navigate('/province/' + provinceId);
      },
      onReady: (createdScene) => {
        sceneRef.current = createdScene;
      },
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: phaserHostRef.current,
      backgroundColor: "#f4ecdf",
      transparent: false,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: phaserHostRef.current.clientWidth || 960,
        height: phaserHostRef.current.clientHeight || 660,
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },
      scene,
    });

    gameRef.current = game;
    sceneRef.current = scene;
    onReady?.({
      getCurrentProvinceId: () => scene.getCurrentProvinceId(),
      getPosition: () => scene.getPosition(),
      moveByDirection: (direction) => scene.events?.emit("move-direction", direction),
      setSkin: (skinId) => scene.events?.emit("change-skin", skinId),
      moveToProvince: (provinceId) => scene.events?.emit("move-province", provinceId),
    });

    return () => {
      sceneRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [initialProvinceId, nodes, onProvinceEnter, onReady, onStateChange, skins]);

  useEffect(() => {
    if (!sceneRef.current || !sceneRef.current.events) return;
    sceneRef.current.events.emit("change-skin", selectedSkinId);
  }, [selectedSkinId]);

  useEffect(() => {
    const current = sceneRef.current;
    if (!current) return;

    let stopped = false;
    // AI辅助优化： [你的AI模型] , 2026-04-24
    const bootCamera = async () => {
      if (!enableCamera || !videoRef.current) {
        setCameraStatus("fallback");
        return;
      }

      try {
        setCameraStatus("starting");
        const stop = await startMediaPipeDirectionRecognizer({
          enabled: true,
          video: videoRef.current,
          onDirection: (direction) => current.events.emit("move-direction", direction),
        });
        if (stopped) {
          stop();
          return;
        }
        setCameraStatus("running");
        return stop;
      } catch {
        setCameraStatus("fallback");
      }
      return undefined;
    };

    let stopCamera: (() => void) | undefined;
    bootCamera().then((stop) => {
      stopCamera = stop;
    });

    return () => {
      stopped = true;
      stopCamera?.();
    };
  }, [enableCamera, gestureMode]);

  useEffect(() => {
    const host = phaserHostRef.current;
    if (!host) return;
    const resizeObserver = new ResizeObserver(() => {
      const game = gameRef.current;
      if (!game) return;
      const { clientWidth, clientHeight } = host;
      game.scale.resize(clientWidth, clientHeight);
    });
    resizeObserver.observe(host);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 28,
        overflow: "hidden",
        background: "linear-gradient(180deg, #f6efe4 0%, #ebe1d1 100%)",
        boxShadow: "0 22px 50px rgba(72, 55, 33, 0.18)",
        touchAction: "none",
        userSelect: "none",
        ...style,
      }}
      onPointerDown={gesture.onPointerDown}
      onPointerUp={gesture.onPointerUp}
      onTouchStart={gesture.onTouchStart}
      onTouchEnd={gesture.onTouchEnd}
    >
      <div
        ref={phaserHostRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 18,
          top: 18,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          zIndex: 2,
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255, 248, 236, 0.84)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(122, 103, 74, 0.22)",
            color: "#49392A",
            fontSize: 13,
          }}
        >
          当前省份: <strong>{currentNode?.name ?? "-"}</strong> / ID: <code>{state.provinceId}</code>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255, 248, 236, 0.84)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(122, 103, 74, 0.22)",
            color: "#49392A",
            fontSize: 13,
          }}
        >
          坐标: <strong>{state.x}</strong>, <strong>{state.y}</strong>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(255, 248, 236, 0.84)",
            border: "1px solid rgba(122, 103, 74, 0.22)",
            color: "#49392A",
            fontSize: 13,
          }}
        >
          手势: {gestureMode}
        </div>
        {enableCamera && gestureMode !== "pointer" ? (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255, 248, 236, 0.84)",
              border: "1px solid rgba(122, 103, 74, 0.22)",
              color: "#49392A",
              fontSize: 13,
            }}
          >
            摄像头: {cameraStatus}
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          right: 18,
          top: 18,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          zIndex: 2,
        }}
      >
        {skins.map((skin) => (
          <button
            key={skin.id}
            type="button"
            onClick={() => {
              setSelectedSkinId(skin.id);
              sceneRef.current?.events.emit("change-skin", skin.id);
            }}
            style={{
              minWidth: 72,
              padding: "9px 12px",
              borderRadius: 999,
              border: selectedSkinId === skin.id ? "1px solid rgba(60, 46, 29, 0.6)" : "1px solid rgba(122, 103, 74, 0.24)",
              background: selectedSkinId === skin.id ? "rgba(255, 243, 218, 0.96)" : "rgba(255, 248, 236, 0.84)",
              color: "#3f3226",
              fontSize: 13,
              cursor: "pointer",
              boxShadow: selectedSkinId === skin.id ? "0 8px 22px rgba(65, 49, 27, 0.14)" : "none",
            }}
          >
            {skin.label}
          </button>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 18,
          maxWidth: 360,
          zIndex: 2,
          padding: "10px 12px",
          borderRadius: 18,
          background: "rgba(255, 248, 236, 0.84)",
          border: "1px solid rgba(122, 103, 74, 0.22)",
          color: "#49392A",
          lineHeight: 1.55,
          fontSize: 13,
        }}
      >
        向上/下/左/右滑动或用摄像头手势触发移动，点击桌宠或节点进入省份科普页。桌宠会围绕节点移动，并发出柔和粒子拖尾。
      </div>

      <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
    </div>
  );
});

export { DEFAULT_NODES, DEFAULT_SKINS };
