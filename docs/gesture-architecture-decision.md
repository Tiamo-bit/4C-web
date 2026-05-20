# 当前手势架构决策

本项目以后以 `feat/frontend-optimization` 的业务流程作为主要产品基线，同时保留旧架构中更清晰的手势运行时边界。

## 架构决策

保留多页面应用、省份学习页和省份拼图流程，但摄像头和 AI 手势识别引擎不放进 `PhaserGame`。

当前职责边界：

```text
Route/App 层
  -> useCameraStream()
  -> useHandTrackingEngine(videoElement)
  -> 将手势数据写入 useGestureStore
  -> 渲染轻量的 React 状态/光标 UI

PhaserGame
  -> 只创建和销毁 Phaser.Game 实例
  -> 不请求摄像头权限
  -> 不运行 MediaPipe
  -> 不接收 provinceId 等业务 props

PuzzleScene
  -> 从 useGestureStore 消费手势数据
  -> 渲染并控制拼图碎片
  -> 根据当前路由解析省份，用于拼图素材和进度存储
```

## 文件职责

- `src/App.tsx`
  - 负责路由设置。
  - 只在 `/puzzle/:id` 页面挂载手势运行时。
  - 通过 hooks 启动摄像头和 MediaPipe。
  - 显示手势状态和光标 UI。

- `src/features/camera/useCameraStream.ts`
  - 负责浏览器摄像头生命周期。
  - 创建隐藏的 video 元素。
  - 在清理阶段停止摄像头 tracks。

- `src/features/gesture/useHandTrackingEngine.ts`
  - 负责 MediaPipe 初始化和检测循环。
  - 将手部关键点转换为指针坐标和捏合状态。
  - 将高频物理数据和低频 UI 数据写入 `useGestureStore`。

- `src/store/useGestureStore.ts`
  - 是唯一的手势数据共享通道。
  - React UI 通过 hook API 读取。
  - Phaser 场景通过 `subscribe()` 读取。

- `src/components/PhaserGame.tsx`
  - 必须保持为纯 Phaser 宿主组件。
  - 不应导入摄像头 hooks、MediaPipe hooks 或路由参数。

- `src/features/puzzle/PuzzleScene.ts`
  - 负责拼图渲染、拖拽和吸附行为。
  - 从 `useGestureStore` 读取手势数据。
  - 不启动摄像头，也不启动 AI 检测。

## 为什么这样划分

旧 `main` 分支的手势架构更清晰，但它不包含当前完整业务流程。

`feat/frontend-optimization` 分支包含当前主要业务：路由、地图、学习页和省份拼图页。这条业务基线应当保留。

为了避免后续混乱，当前架构同时满足两个目标：

- 保留 `feat/frontend-optimization` 的产品流程。
- 将手势采集放在 React/runtime 层，而不是放进 Phaser 渲染组件。

## 后续修改规则

1. 不要把摄像头启动逻辑移入 `PhaserGame`。
2. 不要在 `PuzzleScene` 里直接运行 MediaPipe。
3. 不要向 `PhaserGame` 传入 `provinceId`。
4. React 和 Phaser 之间只通过 `useGestureStore` 共享手势数据。
5. 如果拼图路由发生变化，应在路由/runtime 层或小型 helper 中更新省份解析逻辑，不要让 `PhaserGame` 变成业务组件。

## 合并提示

将 `feat/frontend-optimization` 合并进 `main` 时，预期结果应是多页面业务应用，而不是旧的单页 `main` 应用。

如果合并冲突涉及手势或拼图文件，优先保留以下职责划分：

```text
摄像头/AI runtime 在 React 层
手势数据在 Zustand
PhaserGame 是纯宿主组件
PuzzleScene 是游戏场景
```

除非团队明确决定采用另一套架构，否则以上就是当前项目约定。
