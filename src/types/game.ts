// 基础游戏类型定义

// 位置和向量
export interface Position {
  x: number
  y: number
}

export interface Vector2 {
  x: number
  y: number
}

// 大小和边界
export interface Size {
  width: number
  height: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// 游戏状态枚举
export enum GameState {
  MAIN_MENU = 'main_menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  LEVEL_COMPLETE = 'level_complete'
}

// 游戏实体基类接口
export interface GameEntity {
  id: string
  position: Position
  velocity: Vector2
  size: Size
  active: boolean
  zIndex: number
  update(deltaTime: number): void
  render(ctx: CanvasRenderingContext2D): void
}

// 物理实体接口
export interface PhysicsEntity extends GameEntity {
  mass: number
  static: boolean
  onCollision?: (other: PhysicsEntity) => void
}

// 渲染实体接口
export interface RenderableEntity extends GameEntity {
  sprite?: string
  visible: boolean
  opacity: number
}

// 玩家类型枚举
export enum PlayerType {
  MARCO = 'marco',
  TARMA = 'tarma',
  ERI = 'eri',
  FIODOR = 'fiodor'
}

// 武器类型枚举
export enum WeaponType {
  PISTOL = 'pistol',
  RIFLE = 'rifle',
  SHOTGUN = 'shotgun',
  MACHINE_GUN = 'machine_gun',
  ROCKET = 'rocket'
}

// 敌人类型枚举
export enum EnemyType {
  BASIC_INFANTRY = 'basic_infantry',
  HEAVY_TANK = 'heavy_tank',
  FAST_JET = 'fast_jet',
  BOSS = 'boss'
}

// 道具类型枚举
export enum ItemType {
  HEALTH_PACK = 'health_pack',
  AMMO_PACK = 'ammo_pack',
  WEAPON_UPGRADE = 'weapon_upgrade',
  POWER_UP = 'power_up',
  SCORE_BONUS = 'score_bonus'
}

// 输入事件类型
export enum InputEventType {
  KEY_DOWN = 'key_down',
  KEY_UP = 'key_up',
  MOUSE_DOWN = 'mouse_down',
  MOUSE_UP = 'mouse_up',
  MOUSE_MOVE = 'mouse_move'
}

// 游戏事件类型
export enum GameEventType {
  PLAYER_SHOOT = 'player_shoot',
  ENEMY_DIED = 'enemy_died',
  ITEM_COLLECTED = 'item_collected',
  LEVEL_COMPLETED = 'level_completed',
  GAME_OVER = 'game_over'
}

// 基础游戏事件接口
export interface GameEvent {
  type: GameEventType
  data: any
  timestamp: number
  source: string
}

// 玩家状态接口
export interface PlayerState {
  moving: boolean
  jumping: boolean
  shooting: boolean
  direction: 'left' | 'right'
  health: number
  maxHealth: number
}

// 敌人状态接口
export interface EnemyState {
  health: number
  maxHealth: number
  aiState: 'patrol' | 'chase' | 'attack' | 'dead'
  lastAttackTime: number
}

// 关卡配置接口
export interface LevelConfig {
  id: string
  name: string
  width: number
  height: number
  startPosition: Position
  endPosition: Position
  enemies: EnemySpawn[]
  items: ItemSpawn[]
  difficulty: number
}

// 敌人生成配置
export interface EnemySpawn {
  position: Position
  type: EnemyType
  count: number
  spawnDelay: number
}

// 道具生成配置
export interface ItemSpawn {
  position: Position
  type: ItemType
  spawnDelay: number
}

// 分数统计
export interface ScoreStats {
  total: number
  enemyKills: number
  itemsCollected: number
  timeBonus: number
}

// 保存数据接口
export interface SaveData {
  version: string
  timestamp: string
  currentLevel: number
  highestLevel: number
  totalScore: number
  unlockedWeapons: WeaponType[]
  playTime: number
  achievements: string[]
}
