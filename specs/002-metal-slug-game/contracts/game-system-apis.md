# Game System APIs: 合金弹头风格2D射击游戏

**Created**: 2025-11-19
**Feature**: 合金弹头风格2D横版射击游戏
**API Version**: 1.0.0

## 系统架构概览

游戏系统采用模块化设计，各系统通过明确的接口进行通信：

```
Input System → Game Loop → Game Systems → Rendering System
     ↓              ↓           ↓              ↓
Event System → State Management → Audio System → Save System
```

## 核心系统API

### 1. Input System (输入系统)

```typescript
// 输入事件定义
interface InputEvent {
  type: InputEventType
  key?: string
  mouseX?: number
  mouseY?: number
  delta?: number
  timestamp: number
}

enum InputEventType {
  KEY_DOWN = 'key_down',
  KEY_UP = 'key_up',
  MOUSE_DOWN = 'mouse_down',
  MOUSE_UP = 'mouse_up',
  MOUSE_MOVE = 'mouse_move',
  WHEEL = 'wheel'
}

// 输入系统接口
interface InputSystem {
  // 事件处理
  onInput(event: InputEvent): void
  
  // 按键状态查询
  isKeyDown(key: string): boolean
  isKeyPressed(key: string): boolean
  getMousePosition(): { x: number; y: number }
  
  // 输入映射
  getAction(action: string): boolean
  setKeyMapping(action: string, keys: string[]): void
  
  // 输入清理
  clearInput(): void
}
```

### 2. Physics System (物理系统)

```typescript
// 物理实体接口
interface PhysicsEntity {
  id: string
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  size: { width: number; height: number }
  mass: number
  static: boolean
}

// 碰撞检测接口
interface Collision {
  entityA: PhysicsEntity
  entityB: PhysicsEntity
  normal: { x: number; y: number }
  depth: number
}

// 物理系统接口
interface PhysicsSystem {
  // 实体管理
  addEntity(entity: PhysicsEntity): void
  removeEntity(id: string): void
  getEntity(id: string): PhysicsEntity | null
  
  // 碰撞检测
  detectCollisions(): Collision[]
  resolveCollision(collision: Collision): void
  
  // 物理更新
  update(deltaTime: number): void
  
  // 场景查询
  queryAABB(bounds: BoundingBox): PhysicsEntity[]
  queryPoint(point: { x: number; y: number }): PhysicsEntity[]
}
```

### 3. Render System (渲染系统)

```typescript
// 渲染对象接口
interface Renderable {
  id: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  visible: boolean
  
  // 渲染方法
  render(ctx: CanvasRenderingContext2D, camera: Camera): void
}

// 相机接口
interface Camera {
  x: number
  y: number
  zoom: number
  
  // 相机控制
  follow(target: { x: number; y: number }): void
  setBounds(bounds: BoundingBox): void
  worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number }
  screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number }
}

// 渲染系统接口
interface RenderSystem {
  // 画布管理
  initialize(canvas: HTMLCanvasElement): void
  resize(width: number, height: number): void
  
  // 渲染对象管理
  addObject(obj: Renderable): void
  removeObject(id: string): void
  
  // 相机控制
  setCamera(camera: Camera): void
  getCamera(): Camera
  
  // 渲染循环
  render(): void
  
  // 性能监控
  getFPS(): number
  getFrameTime(): number
}
```

### 4. Audio System (音频系统)

```typescript
// 音频资源接口
interface AudioResource {
  id: string
  url: string
  loaded: boolean
  duration: number
}

// 音频播放接口
interface AudioPlayback {
  id: string
  resourceId: string
  volume: number
  loop: boolean
  playing: boolean
  
  play(): void
  pause(): void
  stop(): void
  setVolume(volume: number): void
}

// 音频系统接口
interface AudioSystem {
  // 资源管理
  loadAudio(id: string, url: string): Promise<void>
  unloadAudio(id: string): void
  
  // 播放控制
  playSFX(id: string, volume?: number): AudioPlayback | null
  playMusic(id: string, volume?: number, loop?: boolean): AudioPlayback | null
  
  // 全局控制
  setMasterVolume(volume: number): void
  pauseAll(): void
  resumeAll(): void
  stopAll(): void
}
```

### 5. Save System (存档系统)

```typescript
// 存档数据接口
interface SaveData {
  version: string
  timestamp: string
  checksum: string
  data: {
    playerProgress: PlayerProgress
    settings: GameSettings
    achievements: Achievement[]
  }
}

// 存档系统接口
interface SaveSystem {
  // 存档操作
  save(slot: number, data: SaveData): Promise<boolean>
  load(slot: number): Promise<SaveData | null>
  delete(slot: number): Promise<boolean>
  listSlots(): SaveSlotInfo[]
  
  // 自动保存
  autoSave(): Promise<boolean>
  enableAutoSave(interval: number): void
  disableAutoSave(): void
  
  // 数据验证
  validateSave(data: SaveData): boolean
  repairSave(data: SaveData): SaveData | null
}
```

### 6. Game Loop System (游戏循环系统)

```typescript
// 游戏系统基接口
interface GameSystem {
  name: string
  priority: number
  
  initialize(): Promise<void>
  update(deltaTime: number): void
  cleanup(): void
}

// 游戏循环接口
interface GameLoop {
  // 状态管理
  start(): void
  pause(): void
  resume(): void
  stop(): void
  
  // 系统管理
  addSystem(system: GameSystem): void
  removeSystem(name: string): void
  getSystem(name: string): GameSystem | null
  
  // 时间控制
  setTimeScale(scale: number): void
  getCurrentTime(): number
  getDeltaTime(): number
  
  // 事件处理
  dispatchEvent(event: GameEvent): void
  onEvent(eventType: string, handler: EventHandler): void
}
```

### 7. Event System (事件系统)

```typescript
// 游戏事件接口
interface GameEvent {
  type: string
  data: any
  timestamp: number
  source: string
}

// 事件处理器
interface EventHandler {
  (event: GameEvent): void
}

// 事件系统接口
interface EventSystem {
  // 事件监听
  on(eventType: string, handler: EventHandler): void
  off(eventType: string, handler: EventHandler): void
  once(eventType: string, handler: EventHandler): void
  
  // 事件派发
  emit(event: GameEvent): void
  emitSync(eventType: string, data: any, source?: string): void
  
  // 事件队列
  enqueue(event: GameEvent): void
  processQueue(): void
  
  // 事件过滤
  filter(predicate: (event: GameEvent) => boolean): GameEvent[]
}
```

### 8. Level Management System (关卡管理系统)

```typescript
// 关卡数据接口
interface LevelData {
  id: string
  name: string
  config: LevelConfig
  entities: LevelEntity[]
  metadata: LevelMetadata
}

// 关卡管理系统接口
interface LevelSystem {
  // 关卡加载
  loadLevel(levelId: string): Promise<boolean>
  unloadLevel(): void
  getCurrentLevel(): LevelData | null
  
  // 关卡进度
  setCheckpoint(position: { x: number; y: number }): void
  getCheckpoint(): { x: number; y: number } | null
  restartLevel(): void
  nextLevel(): void
  
  // 目标检查
  checkObjectives(): ObjectiveResult[]
  completeObjective(objectiveId: string): void
  
  // 关卡事件
  onLevelStart(handler: () => void): void
  onLevelComplete(handler: () => void): void
  onLevelFail(handler: () => void): void
}
```

## 系统集成接口

### 消息总线接口

```typescript
// 系统间通信接口
interface MessageBus {
  // 发布订阅模式
  publish(topic: string, message: any): void
  subscribe(topic: string, handler: (message: any) => void): () => void
  
  // 请求响应模式
  request(request: RequestMessage): Promise<ResponseMessage>
  handleRequest(handler: RequestHandler): void
}
```

### 状态管理器接口

```typescript
// 游戏状态管理
interface StateManager {
  // 状态操作
  setState(state: GameState): void
  getState(): GameState | null
  updateState(patch: Partial<GameState>): void
  
  // 状态历史
  pushState(): void
  popState(): void
  canUndo(): boolean
  canRedo(): boolean
  
  // 状态监听
  onStateChange(handler: (oldState: GameState, newState: GameState) => void): void
}
```

## 性能监控接口

```typescript
// 性能监控接口
interface PerformanceMonitor {
  // 帧率统计
  getFPS(): number
  getAverageFPS(): number
  getFrameTime(): number
  
  // 内存使用
  getMemoryUsage(): MemoryStats
  
  // 系统负载
  getSystemLoad(): SystemLoadStats
  
  // 性能警告
  onPerformanceWarning(threshold: number, handler: (metric: string, value: number) => void): void
}
```

## 错误处理接口

```typescript
// 错误处理接口
interface ErrorHandler {
  // 错误捕获
  catch(error: GameError): void
  handleSystemError(system: string, error: Error): void
  
  // 错误恢复
  tryRecover(error: GameError): boolean
  
  // 错误日志
  logError(error: GameError): void
  reportError(error: GameError): void
}
```

## API使用示例

### 系统初始化

```typescript
// 游戏初始化
async function initializeGame() {
  const inputSystem = new InputSystem()
  const renderSystem = new RenderSystem(canvas)
  const audioSystem = new AudioSystem()
  const saveSystem = new SaveSystem()
  
  // 初始化系统
  await renderSystem.initialize(canvas)
  await audioSystem.initialize()
  
  // 创建游戏循环
  const gameLoop = new GameLoop()
  gameLoop.addSystem(new PhysicsSystem())
  gameLoop.addSystem(new LevelSystem())
  gameLoop.addSystem(new EntitySystem())
  
  // 启动游戏
  gameLoop.start()
}
```

### 输入处理

```typescript
// 输入事件处理
inputSystem.onInput((event) => {
  switch (event.type) {
    case InputEventType.KEY_DOWN:
      if (event.key === 'Space') {
        emitEvent({ type: 'PLAYER_SHOOT' })
      }
      break
    case InputEventType.MOUSE_MOVE:
      emitEvent({ type: 'PLAYER_AIM', data: { x: event.mouseX, y: event.mouseY } })
      break
  }
})
```

这个API设计确保了游戏系统的模块化、可测试性和可扩展性，同时保持简洁高效的性能特征。
