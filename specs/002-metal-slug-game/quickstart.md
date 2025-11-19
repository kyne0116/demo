# Quick Start Guide: 合金弹头风格2D横版射击游戏

**Created**: 2025-11-19
**Version**: 1.0.0
**Technology Stack**: TypeScript + HTML5 Canvas + Vite

## 项目概述

这是一个基于Web浏览器的2D横版射击游戏，采用合金弹头风格设计，使用原生HTML5 Canvas和TypeScript开发，确保60FPS流畅运行。

### 核心特性
- 🎮 经典合金弹头风格游戏体验
- 🏃 流畅的角色移动和射击操作
- 👾 多样化的敌人类型和AI行为
- 🎁 丰富的道具收集和升级系统
- 💾 自动游戏进度保存
- 🎵 基础音效系统
- 📱 跨浏览器兼容性

## 技术栈详情

### 前端技术
- **TypeScript 5.0+**: 提供类型安全和现代化开发体验
- **HTML5 Canvas**: 高性能2D渲染，确保60FPS流畅运行
- **Vite**: 快速构建工具，支持热重载
- **ES2020+**: 现代JavaScript特性

### 核心依赖
- **无游戏引擎依赖**: 保持轻量级和高性能
- **原生Web APIs**: Canvas 2D API, Web Audio API, LocalStorage API

## 项目结构

```
metal-slug-game/
├── src/
│   ├── game/                 # 游戏核心逻辑
│   │   ├── entities/         # 游戏实体 (玩家、敌人、道具)
│   │   ├── systems/          # 游戏系统 (物理、渲染、输入)
│   │   ├── scenes/           # 游戏场景 (关卡)
│   │   ├── assets/           # 游戏资源 (图片、音效)
│   │   └── utils/            # 工具函数
│   ├── ui/                   # 用户界面
│   │   ├── menus/            # 游戏菜单
│   │   ├── hud/              # 游戏界面元素
│   │   └── components/       # UI组件
│   ├── services/             # 服务层
│   │   ├── save/             # 存档系统
│   │   ├── audio/            # 音频服务
│   │   └── input/            # 输入管理
│   └── config/               # 配置文件
├── public/                   # 静态资源
│   ├── assets/
│   │   ├── images/           # 游戏图片资源
│   │   ├── sounds/           # 游戏音效
│   │   └── data/             # 关卡数据
│   └── favicon.ico
└── tests/                    # 测试文件
    ├── unit/                 # 单元测试
    ├── integration/          # 集成测试
    └── e2e/                  # 端到端测试
```

## 快速开始

### 环境要求
- Node.js 18+ 
- npm 9+ 或 yarn 1.22+
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd metal-slug-game
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

4. **打开浏览器**
   ```
   http://localhost:5173
   ```

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建文件将输出到 `dist/` 目录。

## 开发指南

### 代码规范

#### TypeScript配置
- 严格模式开启
- 使用ES2020+目标
- 启用严格空值检查
- 路径别名: `@/` 映射到 `src/`

#### 代码风格
- 使用中文注释和文档
- 函数和类名使用描述性命名
- 遵循单一职责原则
- 优先使用组合而非继承

### 游戏开发模式

#### 1. 创建游戏实体
```typescript
// src/game/entities/Player.ts
export class Player extends GameEntity {
  private health: HealthStatus
  private weapons: Weapon[]
  
  constructor(position: Vector2) {
    super(position, EntityType.PLAYER)
    this.health = { current: 100, max: 100 }
    this.weapons = [new Weapon(WeaponType.PISTOL)]
  }
  
  update(deltaTime: number): void {
    // 游戏逻辑更新
    this.handleInput()
    this.updatePhysics()
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 渲染逻辑
    this.drawSprite(ctx, this.position)
    this.drawHealthBar(ctx)
  }
}
```

#### 2. 实现游戏系统
```typescript
// src/game/systems/PhysicsSystem.ts
export class PhysicsSystem {
  private entities: PhysicsEntity[] = []
  
  update(deltaTime: number): void {
    // 物理计算
    this.entities.forEach(entity => {
      entity.velocity += entity.acceleration * deltaTime
      entity.position += entity.velocity * deltaTime
    })
    
    // 碰撞检测
    this.detectCollisions()
  }
  
  private detectCollisions(): void {
    // 碰撞检测逻辑
  }
}
```

#### 3. 处理用户输入
```typescript
// src/services/input/InputManager.ts
export class InputManager {
  private keys: Set<string> = new Set()
  
  constructor() {
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
    })
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
    })
  }
  
  isKeyPressed(key: string): boolean {
    return this.keys.has(key)
  }
}
```

### 测试驱动开发

#### 单元测试示例
```typescript
// tests/unit/Player.test.ts
import { Player } from '@/game/entities/Player'
import { Vector2 } from '@/utils/Vector2'

describe('Player', () => {
  let player: Player
  
  beforeEach(() => {
    player = new Player(new Vector2(100, 100))
  })
  
  test('should take damage correctly', () => {
    player.takeDamage(25)
    expect(player.health.current).toBe(75)
  })
  
  test('should move correctly with input', () => {
    // 模拟输入
    player.handleInput('ArrowRight', true)
    player.update(0.016) // 16ms更新
    
    expect(player.velocity.x).toBeGreaterThan(0)
  })
})
```

#### 运行测试
```bash
npm run test
# 或
yarn test
```

## 游戏架构

### 核心循环
```typescript
// 主游戏循环
function gameLoop(timestamp: number): void {
  const deltaTime = (timestamp - lastTimestamp) / 1000
  
  // 更新阶段
  inputSystem.update()
  physicsSystem.update(deltaTime)
  gameState.update(deltaTime)
  collisionSystem.update()
  
  // 渲染阶段
  renderSystem.clear()
  renderSystem.render()
  
  requestAnimationFrame(gameLoop)
}
```

### 状态管理
```typescript
// 游戏状态枚举
enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  LEVEL_COMPLETE = 'level_complete'
}

// 状态管理器
class GameStateManager {
  private currentState: GameState = GameState.MENU
  
  transition(newState: GameState): void {
    // 状态转换逻辑
    this.onStateExit(this.currentState)
    this.currentState = newState
    this.onStateEnter(this.currentState)
  }
}
```

## 性能优化

### 渲染优化
1. **分层渲染**: 背景、实体、UI分离
2. **视锥剔除**: 只渲染可见区域内的对象
3. **对象池**: 复用子弹和特效对象
4. **离屏渲染**: 预渲染静态元素

### 内存管理
1. **及时清理**: 移除超出边界的实体
2. **资源卸载**: 异步加载和卸载资源
3. **垃圾回收**: 避免频繁的内存分配

### 帧率优化
1. **60FPS目标**: 使用requestAnimationFrame
2. **性能监控**: 实时监控帧时间
3. **降级方案**: 低性能设备自动降低特效

## 调试工具

### 开发调试
```typescript
// 启用调试模式
if (process.env.NODE_ENV === 'development') {
  window.gameDebug = {
    toggleWireframe: () => toggleWireframe(),
    showFPS: () => showFPS(),
    godMode: () => enableGodMode()
  }
}
```

### 性能分析
```typescript
// 性能监控
class PerformanceMonitor {
  private frameTimes: number[] = []
  
  recordFrame(): void {
    const frameTime = performance.now() - this.frameStart
    this.frameTimes.push(frameTime)
    
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift()
    }
    
    this.updateFPS()
  }
}
```

## 常见问题

### Q: 游戏运行缓慢怎么办？
A: 
1. 检查浏览器是否支持硬件加速
2. 关闭其他占用CPU的应用程序
3. 降低游戏质量设置
4. 确保使用现代浏览器

### Q: 如何自定义游戏设置？
A: 
1. 游戏设置保存在浏览器LocalStorage中
2. 修改 `src/config/game.config.ts` 文件
3. 重启游戏使设置生效

### Q: 如何添加新的敌人类型？
A: 
1. 在 `src/game/entities/enemies/` 创建新类
2. 在 `EnemyType` 枚举中添加新类型
3. 实现AI行为和渲染逻辑
4. 在关卡配置中指定敌人类型

### Q: 如何调试游戏逻辑？
A: 
1. 启用开发模式: `npm run dev`
2. 打开浏览器开发者工具
3. 使用 `window.gameDebug` 工具
4. 查看控制台日志和性能指标

## 部署指南

### 本地部署
```bash
npm run build
npm run preview
```

### 生产部署
```bash
# 构建
npm run build

# 部署dist目录到Web服务器
# 支持任何静态文件服务器
```

### 环境变量
- `NODE_ENV`: development/production
- `VITE_API_URL`: API服务器地址
- `VITE_GAME_VERSION`: 游戏版本号

## 贡献指南

### 开发工作流
1. 创建功能分支: `git checkout -b feature/new-feature`
2. 编写代码和测试
3. 运行测试: `npm run test`
4. 提交代码: `git commit -m "feat: 添加新功能"`
5. 推送分支: `git push origin feature/new-feature`
6. 创建Pull Request

### 代码评审
- 所有变更必须通过代码评审
- 确保测试覆盖率不低于80%
- 遵循项目代码规范
- 更新相关文档

## 版本历史

### v1.0.0 (2025-11-19)
- ✅ 基础游戏框架
- ✅ 玩家角色控制系统
- ✅ 敌人AI系统
- ✅ 道具收集系统
- ✅ 关卡系统
- ✅ 存档系统
- ✅ 音效系统

## 许可证

MIT License - 详见 LICENSE 文件

## 技术支持

如有问题，请查看：
1. [项目Wiki](https://github.com/project/wiki)
2. [问题追踪](https://github.com/project/issues)
3. 提交Issue或Pull Request

---

享受游戏开发的乐趣！🎮✨
