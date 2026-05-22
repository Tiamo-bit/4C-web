# 手势系统架构文档

## 阅读前：先认识几个"演员"

这个项目的核心功能是**用摄像头手势来控制拼图**。在深入代码前，先了解每个"演员"是谁、做什么：

| 演员 | 大白话解释 | 类比 |
|------|-----------|------|
| **MediaPipe** | Google 免费开源的「AI 眼睛」。给它一段视频，它能看出你的手在画面里的哪个位置、每根手指指节在哪儿。 | 像足球比赛里的鹰眼系统——不用装传感器，纯靠摄像头画面就够。 |
| **WASM (WebAssembly)** | 一种让浏览器跑「高性能代码」的技术。MediaPipe 的 AI 模型是用 C++ 写的，编译成 WASM 后就能在网页上接近原生速度运行。 | 浏览器原本只能跑 JavaScript（小汽车）；WASM 让它也能跑 C++（卡车）。 |
| **Landmarks (关键点)** | MediaPipe 在每只手上标出 21 个点——手腕、每个指节的关节、指尖。landmark[4] 是大拇指尖，landmark[8] 是食指尖。 | 就像电影里给演员身上贴的动作捕捉小球——每个球代表一个关节位置。 |
| **Zustand** | 一个「数据共享中心」（状态管理库）。应用的任何部分都能往里存数据、从中取数据。它有一个特别的能力：**不用 React 也能订阅数据变化**。 | 像公司微信群——发一条消息，所有人都能看到。Zustand 的 `subscribe` 就像「特别关注」，消息一到自动提醒你。 |
| **Phaser** | 一个 2D 游戏框架。它管着画面上的 `<canvas>` 元素，负责画拼图碎片、处理碰撞检测、播放动画（tween）。 | 像话剧舞台的布景师——搬道具、打灯光、管演员走位。 |
| **requestAnimationFrame (rAF)** | 浏览器提供的「每帧执行一次」定时器。屏幕刷新一次它就触发一次（通常一秒 60 次）。 | 像列车时刻表——屏幕每次刷新就是一班车，你的代码准时搭上这班车。 |
| **节流 (Throttle)** | 「别太频繁」策略。如果你每秒有 60 帧数据，但 UI 不需要每帧都更新（人眼也分辨不了那么快），就隔几帧才通知一次。 | 像门卫——不是每个人进门都通知你，而是每隔一段固定时间才报告一次。 |
| **归一化坐标 (Normalized Coordinates)** | 把实际像素坐标压缩到 0~1 之间。`(0,0)` 是画面左上角，`(1,1)` 是右下角。不管你屏幕多大（手机 or 大屏），归一化坐标都一样。 | 像百分比——"画面正中间"永远是 `(0.5, 0.5)`，跟设备分辨率无关。 |
| **Phaser Tween** | Phaser 的「平滑动画引擎」。你说「把这个东西从 A 移动到 B，花 200 毫秒」，它自动每一帧计算中间位置。 | 像电梯——你不是瞬间从 1 楼到 10 楼，而是经过 2、3、4...平滑过渡。 |

---

## 总览：数据像水一样流过这些管道

用一句话概括：**摄像头画面进入浏览器 → AI 识别手的位置 → 数据存到共享中心 → 拼图游戏读取数据 → 你动手指，碎片就跟着动。**

下面是整个流程，从 App.tsx 开始，一步步往下走：

```
你的手指（现实世界）
      │
      ▼
  【摄像头】  useCameraStream()
      │      创建隐藏的 <video> 元素，打开前置摄像头
      │      产出: 视频流（每一帧是一张照片）
      │
      ▼
  【AI 眼睛】  useHandTrackingEngine()
      │      MediaPipe 加载 AI 模型（public/wasm/ + public/models/）
      │      每帧执行: detectForVideo() → 找到 21 个手部关键点
      │      判断: 食指和拇指靠得够近吗？→ 是 = "捏合" / 否 = "松开"
      │      产出: 手指在屏幕上的像素坐标 (x, y) + 是否在捏 (true/false)
      │
      ├──────────────────────────┐
      ▼ (每帧都在写)              ▼ (每 100ms 才写一次)
  【飞快通道 - physics】      【慢速通道 - display】
   {x, y, isPinching}        {coords, isPinching, handCount}
      │                            │
      ▼                            ▼
  【拼图游戏引擎】             【React UI 界面】
   PuzzleScene                App.tsx 里的 JSX
   用 subscribe() 订阅         用 useStore() 订阅
   每帧跟随手指移动碎片         画光标光晕 + 状态指示灯

   pinch 开始 → 抓起碎片
   pinch 持续 → 拖拽碎片
   pinch 结束 → 放下碎片 → 离目标近就"咔嗒"吸过去
```

> **记住这个核心模式**：摄像头 → AI 识别 → Zustand 共享中心 → Phaser 拼图 + React UI。中间任何一环出问题都不会影响其他环节。

---

## 1. 摄像头如何启动

**一句话**：App 加载时，在页面角落里放一个不可见的 `<video>` 标签，让它偷偷播放前置摄像头的画面。

文件：[src/features/camera/useCameraStream.ts](../src/features/camera/useCameraStream.ts)

### 新手理解

React 本身不能直接「看到」摄像头。浏览器的 `navigator.mediaDevices.getUserMedia()` 是访问摄像头的唯一方式，它会弹出一个权限对话框让用户同意。画面数据必须绑定到一个 `<video>` 标签上才能被后续程序读取——即使这个标签是看不见的。

### 完整流程

```
1. 页面加载
   ↓
2. React 渲染 App 组件
   ↓
3. useCameraStream() 被调用
   ├── 创建一个 <video> 元素（不可见，0 像素宽高）
   ├── 把它插入到 <body> 里
   ├── 调 getUserMedia({ video: { facingMode: 'user' } })
   │   → 浏览器弹出权限对话框："是否允许访问摄像头？"
   ├── 用户点"允许"
   ├── 拿到摄像头流 → 绑定到 video.srcObject
   ├── video.play() 开始播放
   ├── 状态变 ready
   └── 返回 { videoElement, status, error }
```

### 关键代码位置

| 步骤 | 文件 | 行 |
|------|------|-----|
| hook 定义 | `useCameraStream.ts` | `export function useCameraStream()` |
| App.tsx 调用 | `App.tsx` | `const { videoElement, ... } = useCameraStream()` |
| video 传给 MediaPipe | `App.tsx` | `useHandTrackingEngine(videoElement)` |

---

## 2. MediaPipe 如何初始化

**一句话**：先把 AI 模型文件下载到浏览器，然后启动一个循环——每次屏幕刷新时拍一张视频帧交给 AI 分析。

文件：[src/features/gesture/useHandTrackingEngine.ts](../src/features/gesture/useHandTrackingEngine.ts)

### 新手理解：什么是"AI 模型初始化"？

AI 模型不是魔法。它是一堆数学公式 + 训练好的参数（一个 `.task` 文件）。初始化就是：
1. 把这些文件下载到浏览器里
2. 在浏览器里"搭建"一个 AI 引擎（通过 WASM）
3. 告诉引擎："以后我每秒给你 60 张图，你告诉我手在哪"

### 完整流程

```
useHandTrackingEngine(videoElement)
  ↓
  videoElement 存在吗？
  ├── 不存在 → 等待（等摄像头准备好）
  └── 存在 → 开始初始化
       ↓
  Step 1: setStatus('loading')      ← UI 显示"加载中..."转圈
       ↓
  Step 2: FilesetResolver.forVisionTasks(wasmPath)
       │  加载 public/wasm/ 下的 .wasm 文件
       │  (这些是 C++ 代码编译后的产物，让 JS 跑高性能 AI)
       │  时间: 1~3 秒
       ↓
  Step 3: HandLandmarker.createFromOptions(vision, {
             baseOptions: { modelAssetPath, delegate: "GPU" },
             runningMode: 'VIDEO',
             numHands: 2               ← 最多识别两只手
          })
       │  加载 public/models/hand_landmarker.task
       │  (这是一个用 3 万张手部图片训练出来的 AI 模型)
       │  时间: < 1 秒
       ↓
  Step 4: setStatus('ready')         ← UI 显示"Tracking · 0 hand(s)"
       ↓
  Step 5: requestAnimationFrame(detect)
       │  启动循环: 每帧调一次 detect()
       │  detect() 做的事见下一章
       ↓
  (循环运行，直到用户离开页面)
```

### 如果初始化失败怎么办？

代码里有 `try/catch` 包裹，失败后会 `setStatus('error')`，UI 会显示错误信息。

### 卸载时会发生什么？

用户离开页面时，React 的 cleanup 函数执行：
- `cancelAnimationFrame` → 停掉检测循环
- `handLandmarker.close()` → 释放 GPU 内存
- `cancelled = true` → 防止异步初始化完成后继续操作

---

## 3. Landmarks（手部关键点）如何处理

**一句话**：每帧从 AI 拿到的 21 个关键点中，我们只关心两个——大拇指尖 (15号点) 和食指尖 (8号点) 的距离，以及食指的位置。

### 新手理解

MediaPipe 做了最难的活——从像素里"看懂"手。我们只需要用它的结果：
- 食指尖在哪儿 → 这就是"手指的位置"（光标跟着它）
- 食指尖和大拇指尖挨得近不近 → 这就是"捏合手势"（用来抓拼图碎片）

```
手部 21 个关键点示意:

       8(食指尖)           12(中指尖)
   7       11         16(无名指尖)
       6       10         20(小指尖)
   5       9       15
       14      19
   4(拇指尖)  13      18
       3
   2                           0(手腕)
       1
```

实际只需关注:
- **landmark[4]** — 大拇指尖 (THUMB_TIP)
- **landmark[8]** — 食指尖 (INDEX_FINGER_TIP)

### 完整流程

```
detect() 函数（每帧调用一次）
  │
  ├─ 1. 检查视频是否就绪
  │     videoElement.readyState >= HAVE_CURRENT_DATA ?
  │     └─ 否 → 跳过本帧
  │
  ├─ 2. 调用 AI 检测
  │     result = handLandmarker.detectForVideo(videoElement, timestamp)
  │     注意: timestamp 必须每帧不同，否则 MediaPipe 不会重新检测
  │     产出: result.landmarks — 一个数组，每个元素是一只手的 21 个关键点
  │     例: [[手1的21个点], [手2的21个点]] 或 [[手1的21个点]] 或 []
  │
  ├─ 3. 判断捏合手势 (Pinch Detection)
  │     for (const hand of result.landmarks) {
  │       拇指尖 = hand[4]
  │       食指尖 = hand[8]
  │       距离 = √((拇指尖.x - 食指尖.x)² + (拇指尖.y - 食指尖.y)²)
  │       if (距离 < 0.1) → 判定为"捏合"
  │     }
  │     注意: 任何一只手捏合就算。坐标是归一化的(0~1)，所以 0.1 约是画面宽度的 10%
  │
  ├─ 4. 提取食指位置（只取第一只手）
  │     lm = result.landmarks[0][8]  // 第一只手的食指尖
  │     // 水平镜像（因为前置摄像头是镜像画面）
  │     normCoords = { x: 1 - lm.x, y: lm.y }
  │     // 转为屏幕像素坐标
  │     physicsX = normCoords.x * window.innerWidth
  │     physicsY = normCoords.y * window.innerHeight
  │
  └─ 5. 写入 Zustand 共享数据
        ├─ 每帧写入 physics: { x, y, isPinching }     ← 飞快通道，供 Phaser 用
        └─ 每 100ms 写入 display: { coords, handCount }  ← 慢速通道，供 React UI 用
```

### 为什么有两层写入（快通道 / 慢通道）？

```
快通道 (physics, 每帧约 60 次/秒):
  用途: 拼图碎片跟随手指移动
  消费方: PuzzleScene (通过 subscribe)
  为什么快: 碎片要丝滑跟手，必须每帧更新位置

慢通道 (display, 每秒约 10 次):
  用途: React 组件更新（光标光环、手数提示）
  消费方: App.tsx 的 JSX (通过 useStore)
  为什么慢: React 每渲染一次有成本，人眼看 UI 也不需要 60fps
            100ms 节流 = 每秒只触发 10 次 React 渲染
```

---

## 4. Zustand Store 存了什么

**一句话**：一个全局 JS 对象，存着手指坐标、捏合状态、引擎状态。分了"快车道"和"慢车道"两层。

文件：[src/store/useGestureStore.ts](../src/store/useGestureStore.ts)

### 新手理解：Zustand 和普通 React state 有什么不同？

| 特性 | React useState | Zustand |
|------|---------------|---------|
| 作用范围 | 单个组件内 | 全局（任何地方都能访问） |
| 订阅方式 | 只有组件能读 | 组件用 `useStore()`，非组件 JS 用 `subscribe()` |
| 触发渲染 | 每次变化都渲染 | 只渲染用了对应字段的组件 |
| 适用场景 | 按钮开关、表单输入 | 游戏坐标、多组件共享的数据 |

Zustand 是本项目的"合同层"——手势识别模块只管往里写数据，拼图模块只管往里读数据，两方不用知道对方的存在。

### Store 结构详解

```
useGestureStore (一个 Zustand store)
│
├─ 快车道 (每帧更新，不给 React 用)
│   ├─ x: number           手指在屏幕上的 X 坐标（像素），例: 683
│   ├─ y: number           手指在屏幕上的 Y 坐标（像素），例: 412
│   └─ isPinching: boolean 用户是否在做捏合手势，true/false
│
├─ 慢车道 (每 100ms 更新，专门给 React 用)
│   └─ display: {
│        coords: { x, y } | null   归一化坐标 (0~1)，null = 没有手
│        isPinching: boolean
│        handCount: number         检测到几只手 (0, 1, 2)
│      }
│
├─ 引擎状态
│   ├─ status: 'idle' | 'loading' | 'ready' | 'error'
│   └─ error: string | null
│
└─ 操作方法
    ├─ setTrackingData(physics, uiUpdate?)
    │   第一个参数必填 → 更新快车道
    │   第二个参数选填 → 同时更新慢车道（只在达到节流时间时才填）
    └─ setStatus(status, error?)
        更新引擎状态，UI 显示加载/就绪/错误
```

### 不同消费者怎么读数据？

```
【消费者 A: React UI (App.tsx)】
  const display = useGestureStore(state => state.display)
  // 只在 display 变化时重渲染，约 10 次/秒

【消费者 B: Phaser 拼图 (PuzzleScene.ts)】
  useGestureStore.subscribe((state, prevState) => { ... })
  // 不是 React 组件，用 vanilla JS 订阅
  // 每次 store 变化都触发回调，约 60 次/秒
```

---

## 5. PuzzleScene 如何订阅手势数据

**一句话**：PuzzleScene 是一个 Phaser 场景类（不是 React 组件），它用 Zustand 的 `subscribe()` API 监听数据变化，从而让拼图碎片跟随手指。

文件：[src/features/puzzle/PuzzleScene.ts](../src/features/puzzle/PuzzleScene.ts)

### 新手理解：为什么 PuzzleScene 不能用 React 的 useStore？

PuzzleScene 继承自 `Phaser.Scene`，由 Phaser 框架管理生命周期。它不是一个 React 组件——不能使用 `useState`、`useEffect`、`useStore()` 等 React hook。但 Zustand 提供了 `.subscribe()`，这是一个**纯 JavaScript API**，在任何地方都能用。

### 完整流程

```
PuzzleScene.create() — Phaser 场景启动时调用
  │
  ├─ 1. 加载图片 → 切成 2×2 = 4 块碎片
  │       原图: test-building.png
  │       产出: piece0 (左上), piece1 (右上), piece2 (左下), piece3 (右下)
  │
  ├─ 2. 设定目标位置（屏幕正中央，拼对的最终位置）
  │       每个碎片有 targetX 和 targetY
  │
  ├─ 3. 把 4 块碎片随机丢到屏幕四角
  │
  └─ 4. 订阅手势数据 ⬇
        this.unsubscribeStore = useGestureStore.subscribe(
          (state, prevState) => {
            // 检查是否真的有变化（如果手指没动就跳过）
            if (x变了 || y变了 || pinch变了) {
              this.handleGestureUpdate(x, y, isPinching)
            }
          }
        )

每帧调用流程:
  subscribe 回调 (60次/秒) → handleGestureUpdate → update() 移动碎片位置 → 屏幕刷新
```

### 坐标转换（为什么需要三步转换？）

手指在屏幕上的像素位置不能直接用于 Phaser 世界。因为：
- Phaser 的 canvas 可能比窗口小（有缩放比）
- Phaser 的 camera 可能被移动/缩放（世界坐标 ≠ 屏幕坐标）

```
原始数据: 手指在浏览器窗口里的像素坐标 → (640, 360)

Step 1 — 窗口坐标 → Canvas 坐标
   canvas 的物理尺寸可能和 CSS 显示尺寸不一样
   scaleX = canvas.width / canvasRect.width
   canvasX = (640 - canvasRect.left) * scaleX

Step 2 — Canvas 坐标 → Phaser 世界坐标
   camera 可能缩放或平移了，需要转换
   worldPoint = camera.getWorldPoint(canvasX, canvasY)

Step 3 — 将世界坐标写入 this.worldX / this.worldY
   update() 里每帧: draggedPiece.setPosition(worldX, worldY)
```

---

## 6. Pinch（捏合手势）如何触发拖拽和释放

**一句话**：捏合 → 抓起碎片，移动手指 → 碎片跟着走，松开 → 碎片掉落——离正确位置近就自动吸附。

### 新手理解：状态机

这是一个简单的「三态」状态机：

```
    (手指远离 → idle 闲置)
         │
         │ 捏合开始
         ▼
    (抓起碎片 → 跟着手指移动)
         │
         │ 松手
         ▼
    (放下碎片 → 计算距离 → 近就吸附/远就原地放)
         │
         ▼
    (回到 idle)
```

实现方式：用 `wasPinching`（上一帧是否捏合）和 `isPinching`（当前帧是否捏合）对比，判断是"刚捏上"还是"刚松开"。

### 完整流程

```
handleGestureUpdate(x, y, isPinching) — 每次手势数据变化时调用

┌── 坐标转换 ──────────────────────────┐
│ 视口像素 → canvas 坐标 → 世界坐标      │
│ 结果存到 this.worldX / this.worldY   │
└──────────────────────────────────────┘

▎阶段 1 — Pinch Start（刚捏上手指）

  条件: isPinching === true  且  wasPinching === false
                (现在捏着)            (上一帧没捏)

  动作:
  1. 遍历所有 puzzlePieces（从上层往下层找）
     ├─ 跳过已经锁定的 (isLocked === true)
     ├─ 跳过正在吸附动画中的 (isSnapping === true)
     └─ 检查: 手指位置是否在碎片的矩形范围内？
            Phaser.Geom.Rectangle.Contains(piece.getBounds(), worldX, worldY)

  2. 命中 → 抓起这块碎片:
     ├─ this.draggedPiece = piece        ← 记录"谁被抓着"
     ├─ piece.setDepth(10)               ← 提到画面最上层
     ├─ piece.setScale(1.1)              ← 稍微放大，视觉反馈
     └─ piece.setAlpha(0.9)              ← 稍微变透明

  3. 光标变化:
     红色光环(大) → 绿色圆点(小)
     表示"正在抓取"

  4. wasPinching = true（记录状态，下次循环用）

▎阶段 2 — Dragging（拖拽中）

  在 update() 方法里，Phaser 每帧自动调用:

  if (this.draggedPiece) {
    this.draggedPiece.setPosition(this.worldX, this.worldY)
    // 碎片位置 = 手指位置
  }
  this.debugCursor.setPosition(this.worldX, this.worldY)
  // 光标也跟着手指走

▎阶段 3 — Pinch End（松开手指）

  条件: isPinching === false  且  wasPinching === true
               (现在没捏)             (上一帧捏着)

  动作:
  1. 恢复碎片外观:
     piece.setScale(1)     ← 回到正常大小
     piece.setAlpha(1)     ← 回到完全不透明
     piece.setDepth(5)     ← 回到正常层级

  2. 计算距离:
     dist = Phaser.Math.Distance.Between(piece.x, piece.y, targetX, targetY)
     // 碎片当前位置 vs 正确答案的位置

  3. 判断:

     dist ≤ 80 像素？
     ├─ 是 → 吸附！(Snap)
     │   ├─ piece.setData('isSnapping', true)    ← 标记"正在吸附中"
     │   ├─ Tween 动画: 碎片平滑滑到目标位置 (200ms, 回弹缓动)
     │   ├─ 动画完成:
     │   │   ├─ piece.disableInteractive()       ← 以后不能再抓了
     │   │   ├─ piece.setData('isLocked', true)  ← 标记"已锁定"
     │   │   └─ checkCompletion()                ← 检查: 4 块都锁定了吗?
     │   └─ 闪缩动画 (scale 1→1.05→1, 150ms)
     │
     └─ 否 → 留在原地（用户放错位置了）

  4. 光标变化:
     绿色圆点(小) → 红色光环(大，呼吸动画)
     表示"已释放"

  5. this.draggedPiece = null（不再抓着任何东西）
  6. wasPinching = false

▎阶段 4 — 全部完成检测

  checkCompletion():
    if (所有 4 块都是 isLocked) {
      触发事件 PuzzleCompleted
      所有碎片闪烁庆祝
    }
```

### 视觉反馈对照表

| 状态 | 碎片 | 光标 | 含义 |
|------|------|------|------|
| 闲置 | 正常大小 | 红色大光环 + 呼吸动画 | 等待你的手靠近 |
| 抓起 | 放大 1.1 倍 | 绿色小圆点 | 正在抓着碎片 |
| 吸附 | 平滑滑入目标 | 红色大光环 | 放对了，自动归位 |
| 完成 | 全部闪烁 | — | 拼图完成！ |

---

## 7. 当前结构的主要问题

### 7.1 架构层面

| # | 问题 | 通俗解释 |
|---|------|----------|
| **A** | **没有"手势翻译官"** | 现在 AI 说"食指在 (0.3, 0.5)"，拼图模块要自己理解"哦这是要拖东西"。如果以后想做"双击"或"滑动切建筑"，需要在很多地方改代码。理想情况是有一个中间层把原始坐标翻译成 "Tap"、"Drag"、"Swipe" 这些标准动作。 |
| **B** | **PuzzleScene 干太多活了** | 一个 ~300 行的类同时管理：图片加载、切割碎片、拖拽逻辑、光标动画、吸附判定、完成检查。就像一个厨师同时切菜、炒菜、摆盘、收银——任何改动都要进这个厨房。 |
| **C** | **浪费了双手识别能力** | MediaPipe 配置了 `numHands: 2`（识别两只手），Zustand 也记录了 `handCount`，但拼图代码里只读了 `hands[0]`（第一只手）。双手操作的潜力（如左右手各抓一块碎片同时拼）完全没用上。 |

### 7.2 健壮性

| # | 问题 | 通俗解释 |
|---|------|----------|
| **D** | **AI 检测循环没有"安全网"** | `detect()` 函数里如果 `detectForVideo` 突然报错（比如 GPU 崩溃），没有任何 try/catch 保护。循环会静默停止——用户会发现手势突然失灵了，但界面上没有任何报错提示。 |
| **E** | **捏合判定对不同人不公平** | 捏合阈值是固定值 `0.1`（归一化坐标，大约是画面宽度的 10%）。问题是：小孩手小 → 归一化后手指间距小 → 容易捏合；大人手大 → 间距大 → 难捏合。理想做法是根据手掌实际大小动态计算阈值。 |
| **F** | **"快慢通道"是口头约定，不是硬规则** | 如果以后有另一个模块需要"每 50ms 更新一次"的节流速率，现在的代码做不到——节流逻辑写死在 hook 里，不是可配置参数。 |

### 7.3 耦合（模块之间太相互依赖）

| # | 问题 | 通俗解释 |
|---|------|----------|
| **G** | **拼图模块硬绑定了 Zustand** | PuzzleScene 直接 `import { useGestureStore } from '../../store/useGestureStore'`。如果将来想把 Zustand 换成 Redux 或其他方案，拼图代码必须跟着改。理想情况是拼图模块不知道数据来自哪里——只要有人给它喂数据就行。 |
| **H** | **坐标转换逻辑不能复用** | viewport→canvas→world 这 10 行坐标转换写在 PuzzleScene 里。如果以后做第二个小游戏（比如"宠物跟随手指"），需要再写一遍。应该抽成一个独立工具函数。 |

### 7.4 数据效率

| # | 问题 | 通俗解释 |
|---|------|----------|
| **I** | **手指不动时也在疯狂写数据** | 即使手指完全静止，每帧（60次/秒）仍在往 Zustand 写 `{x, y, isPinching}`。虽然 PuzzleScene 那边做了去重检查（值没变就不处理），但 Zustand 内部的 `set()` 调用和对象创建本身是浪费的。 |
| **J** | **坐标计算绑死了屏幕尺寸** | 代码直接用 `window.innerWidth` 和 `window.innerHeight`。如果未来 canvas 不等于窗口大小（比如页面嵌入 iframe、或者变成手机竖屏），坐标就会算错。 |

---

## 改进方向建议（暂不实施）

这些是可能的演进方向，当前不改代码，只作为后续讨论的起点：

1. **加一个"手势翻译官"** — 在 AI 识别和 Zustand 之间加一层，输出 `Idle / Grab / Release / Swipe` 等标准动作词，而不是原始像素坐标。
2. **给 PuzzleScene 减负** — 把拖拽逻辑、光标绘制、吸附判定拆成独立的小模块，每个只管一件事。
3. **坐标转换做成公共工具** — 把 viewport→world 转换抽成一个函数，所有 Scene 都能调用。
4. **捏合阈值改用相对值** — 根据手掌宽度（`landmark[0]` 到 `landmark[17]` 的距离）动态计算阈值，不同手大小的人体验一致。
5. **检测循环加 try/catch** — 出错时降级到 error 状态，UI 显示错误，甚至可以尝试重启。
6. **用状态机替代 wasPinching 布尔值** — `gesturePhase: 'idle' | 'grabbing' | 'dragging' | 'releasing'`，代码更易读，也能支持更多手势状态。

---

## 附：技术词汇速查表

| 术语 | 一句话解释 |
|------|-----------|
| **Hook** | React 的函数式组件里复用逻辑的方式（`useState`、`useEffect` 都是 hook） |
| **useEffect** | React hook：在组件渲染后执行副作用（如初始化摄像头、启动循环） |
| **useRef** | React hook：存一个不会触发重渲染的值，常用于存 DOM 节点或定时器 ID |
| **useCallback** | React hook：缓存一个函数，避免每次渲染都创建新函数 |
| **useMemo** | React hook：缓存一个计算结果，依赖不变就不重算 |
| **cleanup function** | useEffect 里 `return () => { ... }` 的函数，组件卸载时执行。用于关摄像头、停循环等。 |
| **Canvas** | HTML 的 `<canvas>` 标签，浏览器里的"画布"。Phaser 在它上面画游戏画面。 |
| **GPU 加速** | 把计算任务交给显卡处理。MediaPipe 设置 `delegate: "GPU"`，AI 检测速度大幅提升。 |
| **Tween** | "补间动画"——你指定起点和终点，引擎自动计算中间每一帧的过渡。比手动计算流畅得多。 |
| **碰撞检测 (Hit Test)** | 判断"手指有没有点中碎片"。这里用了 Phaser 自带的矩形包含检测。 |
| **镜像 (Mirror)** | 前置摄像头拍出来是左右颠倒的。`x = 1 - lm.x` 这行就是在做镜像修正。 |
| **WASM (WebAssembly)** | 让浏览器能跑接近原生速度的编译代码。没有它，AI 模型在网页上根本跑不动。 |
