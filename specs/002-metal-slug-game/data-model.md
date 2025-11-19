# Data Model: 合金弹头风格2D横版射击游戏

**Created**: 2025-11-19
**Feature**: 合金弹头风格2D横版射击游戏
**Status**: Design Phase

## 核心实体设计

### 1. Player (玩家角色)

```typescript
interface Player {
  id: string
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  health: HealthStatus
  weapons: Weapon[]
  inventory: Item[]
  state: PlayerState
  controls: ControlMapping
}

interface HealthStatus {
  current: number
  max: number
  invulnerable: boolean
  invulnerabilityTimer: number
}

interface PlayerState {
  moving: boolean
  jumping: boolean
  shooting: boolean
  direction: 'left' | 'right'
  animationFrame: number
}
```

### 2. Enemy (敌人实体)

```typescript
interface Enemy {
  id: string
  type: EnemyType
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  health: number
  maxHealth: number
  ai: AIBehavior
  state: EnemyState
  damage: number
  reward: number
}

enum EnemyType {
  BASIC_INFANTRY = 'basic_infantry',    // 基础步兵
  HEAVY_TANK = 'heavy_tank',            // 重型坦克
  FAST_JET = 'fast_jet',                // 快速飞机
  BOSS = 'boss'                         // Boss敌人
}

interface AIBehavior {
  type: 'patrol' | 'chase' | 'shoot' | 'stationary'
  target?: { x: number; y: number }
  stateMachine: StateMachine
  parameters: Record<string, number>
}
```

### 3. Weapon (武器系统)

```typescript
interface Weapon {
  id: string
  name: string
  type: WeaponType
  damage: number
  fireRate: number // 每秒射击次数
  bulletSpeed: number
  bulletCount: number // 每次射击子弹数
  range: number
  ammo?: number // 无限弹药时为undefined
  effects: WeaponEffect[]
}

enum WeaponType {
  PISTOL = 'pistol',           // 手枪
  RIFLE = 'rifle',             // 步枪
  SHOTGUN = 'shotgun',         // 散弹枪
  MACHINE_GUN = 'machine_gun', // 机枪
  ROCKET = 'rocket'            // 火箭筒
}

interface WeaponEffect {
  type: 'spread' | 'piercing' | 'explosive' | 'freeze'
  value: number
  duration?: number
}
```

### 4. Item (道具系统)

```typescript
interface Item {
  id: string
  type: ItemType
  name: string
  description: string
  position: { x: number; y: number }
  collected: boolean
  effect: ItemEffect
  rarity: Rarity
}

enum ItemType {
  HEALTH_PACK = 'health_pack',        // 生命恢复
  AMMO_PACK = 'ammo_pack',           // 弹药包
  WEAPON_UPGRADE = 'weapon_upgrade', // 武器升级
  POWER_UP = 'power_up',             // 能力增强
  SCORE_BONUS = 'score_bonus'        // 分数加成
}

interface ItemEffect {
  type: 'heal' | 'upgrade' | 'power' | 'score'
  value: number
  duration?: number // 持续性效果
}
```

### 5. Bullet (子弹系统)

```typescript
interface Bullet {
  id: string
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  damage: number
  weaponId: string
  owner: 'player' | 'enemy'
  lifetime: number
  effects: BulletEffect[]
}

interface BulletEffect {
  type: 'piercing' | 'explosive' | 'burn' | 'slow'
  value: number
}
```

### 6. Level (关卡系统)

```typescript
interface Level {
  id: string
  name: string
  difficulty: number
  layout: LevelLayout
  enemies: EnemySpawn[]
  items: ItemSpawn[]
  objectives: LevelObjective[]
  timeLimit?: number
}

interface LevelLayout {
  width: number
  height: number
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
  platforms: Platform[]
  obstacles: Obstacle[]
}

interface EnemySpawn {
  position: { x: number; y: number }
  type: EnemyType
  count: number
  spawnDelay: number // 敌人出现延迟
  wave?: number // 波次出现
}

interface LevelObjective {
  type: 'survive' | 'eliminate' | 'reach_end' | 'collect'
  target: number
  description: string
  completed: boolean
}
```

### 7. GameState (游戏状态)

```typescript
interface GameState {
  currentLevel: number
  player: Player
  score: number
  gameTime: number
  level: Level
  entities: {
    enemies: Enemy[]
    bullets: Bullet[]
    items: Item[]
  }
  saveData: SaveData
  settings: GameSettings
}

interface SaveData {
  highestLevel: number
  totalScore: number
  unlockedWeapons: string[]
  achievements: Achievement[]
  lastPlayed: string
}

interface GameSettings {
  audio: {
    masterVolume: number
    sfxVolume: number
    musicVolume: number
  }
  graphics: {
    quality: 'low' | 'medium' | 'high'
    fullscreen: boolean
  }
  controls: ControlMapping
}
```

### 8. Achievement (成就系统)

```typescript
interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedDate?: string
  progress: number
  maxProgress: number
}
```

## 数据关系

### 实体关系图

```
GameState (1:1)
├── Player (1:1)
│   ├── HealthStatus (1:1)
│   ├── Weapon[] (1:n)
│   └── Item[] (1:n)
├── Level (1:1)
│   ├── EnemySpawn[] (1:n)
│   ├── ItemSpawn[] (1:n)
│   └── LevelObjective[] (1:n)
└── Entities (1:n)
    ├── Enemy[] (0:n)
    ├── Bullet[] (0:n)
    └── Item[] (0:n)
```

### 状态转换

#### Player状态机
```
Idle → Moving → Shooting
  ↑      ↓         ↓
Jumping ← Hurt ←→ Dead
```

#### Enemy状态机
```
Patrol → Chase → Attack
  ↑        ↓        ↓
Stunned ← Hurt ←→ Dead
```

#### Game状态机
```
MainMenu → Playing → Paused
     ↓         ↓         ↓
  GameOver ← EndLevel ← Settings
```

## 数据验证规则

### 位置验证
- 玩家和敌人不能超出关卡边界
- 道具必须放置在有效位置上
- 子弹超出范围自动移除

### 数值约束
- 健康值范围: 0 ≤ health ≤ maxHealth
- 武器伤害: 1 ≤ damage ≤ 100
- 分数: 0 ≤ score ≤ 无限制
- 时间: 0 ≤ gameTime ≤ 无限制

### 状态一致性
- 玩家死亡时不能继续游戏
- 敌人死亡后从活跃列表中移除
- 道具被收集后标记为已使用

## 存储方案

### LocalStorage数据结构

```typescript
interface SaveFile {
  version: string // 存档版本号
  data: SaveData
  checksum: string // 数据校验
  timestamp: string
}
```

### 数据压缩策略
- 去除重复数据
- 使用数字ID替代字符串
- JSON压缩
- Base64编码存储

## 性能优化考虑

### 内存管理
- 对象池复用子弹和特效对象
- 按需加载关卡资源
- 及时清理未使用的实体

### 渲染优化
- 空间分区用于碰撞检测
- 视锥剔除不可见对象
- 脏矩形更新减少重绘

### 网络优化(如有)
- 状态同步间隔控制
- 数据量最小化
- 增量更新策略
