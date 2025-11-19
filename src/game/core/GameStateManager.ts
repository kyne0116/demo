import { GameState, Position, ScoreStats } from '../../types/game'
import { EventEmitter } from '../../services/event/EventEmitter'

// 游戏状态事件
export interface StateChangeEvent {
  from: GameState
  to: GameState
  reason?: string
  data?: any
}

// 游戏状态数据
export interface GameStateData {
  currentLevel: number
  playerHealth: number
  playerMaxHealth: number
  score: ScoreStats
  playerPosition: Position
  isPaused: boolean
  gameTime: number
  checkpoints: Position[]
  unlockedWeapons: string[]
  achievements: string[]
}

// 状态管理器事件
export interface StateManagerEvent {
  type: 'state_change' | 'data_update' | 'checkpoint_reached' | 'save_loaded'
  data?: any
}

// 游戏状态管理器类
export class GameStateManager extends EventEmitter {
  private currentState: GameState = GameState.MAIN_MENU
  private stateData: GameStateData
  private stateHistory: { state: GameState; data: GameStateData; timestamp: number }[] = []
  private maxHistorySize: number = 10

  constructor(initialData?: Partial<GameStateData>) {
    super()
    
    // 初始化状态数据
    this.stateData = {
      currentLevel: 1,
      playerHealth: 100,
      playerMaxHealth: 100,
      score: {
        total: 0,
        enemyKills: 0,
        itemsCollected: 0,
        timeBonus: 0
      },
      playerPosition: { x: 100, y: 400 },
      isPaused: false,
      gameTime: 0,
      checkpoints: [],
      unlockedWeapons: ['pistol'],
      achievements: [],
      ...initialData
    }
  }

  // 获取当前状态
  getState(): GameState {
    return this.currentState
  }

  // 获取状态数据
  getStateData(): GameStateData {
    return { ...this.stateData }
  }

  // 切换状态
  changeState(newState: GameState, reason?: string, data?: any): void {
    if (this.currentState === newState) {
      return
    }

    const oldState = this.currentState
    this.currentState = newState

    // 保存历史记录
    this.saveToHistory()

    // 触发状态变化事件
    const event: StateChangeEvent = {
      from: oldState,
      to: newState,
      reason,
      data
    }
    
    this.emit('stateChange', event)

    // 处理特定状态变化
    this.handleStateTransition(oldState, newState, data)

    // 触发通用状态事件
    const managerEvent: StateManagerEvent = {
      type: 'state_change',
      data: event
    }
    this.emit('stateManagerEvent', managerEvent)
  }

  // 处理状态转换
  private handleStateTransition(from: GameState, to: GameState, data?: any): void {
    switch (to) {
      case GameState.PLAYING:
        if (from === GameState.PAUSED) {
          this.resumeGame()
        } else if (from === GameState.MAIN_MENU || from === GameState.GAME_OVER) {
          this.startNewGame(data)
        }
        break

      case GameState.PAUSED:
        this.pauseGame()
        break

      case GameState.MAIN_MENU:
      case GameState.GAME_OVER:
        this.endGame()
        break

      case GameState.LEVEL_COMPLETE:
        this.completeLevel()
        break
    }
  }

  // 开始新游戏
  private startNewGame(data?: any): void {
    this.stateData = {
      currentLevel: data?.startLevel || 1,
      playerHealth: 100,
      playerMaxHealth: 100,
      score: {
        total: 0,
        enemyKills: 0,
        itemsCollected: 0,
        timeBonus: 0
      },
      playerPosition: { x: 100, y: 400 },
      isPaused: false,
      gameTime: 0,
      checkpoints: [],
      unlockedWeapons: ['pistol'],
      achievements: []
    }

    this.emit('dataUpdate', { type: 'new_game', data: this.stateData })
  }

  // 暂停游戏
  private pauseGame(): void {
    this.stateData.isPaused = true
    this.emit('dataUpdate', { type: 'pause', data: this.stateData })
  }

  // 恢复游戏
  private resumeGame(): void {
    this.stateData.isPaused = false
    this.emit('dataUpdate', { type: 'resume', data: this.stateData })
  }

  // 结束游戏
  private endGame(): void {
    this.stateData.isPaused = false
    this.stateData.gameTime = 0
    this.emit('dataUpdate', { type: 'game_end', data: this.stateData })
  }

  // 完成关卡
  private completeLevel(): void {
    // 计算时间奖励
    const timeBonus = Math.max(0, 300 - Math.floor(this.stateData.gameTime))
    this.stateData.score.timeBonus += timeBonus
    this.stateData.score.total += timeBonus

    this.stateData.currentLevel++
    
    const managerEvent: StateManagerEvent = {
      type: 'state_change',
      data: { 
        type: 'level_complete',
        level: this.stateData.currentLevel - 1,
        timeBonus
      }
    }
    this.emit('stateManagerEvent', managerEvent)
  }

  // 更新玩家生命值
  updatePlayerHealth(health: number): void {
    this.stateData.playerHealth = Math.max(0, Math.min(health, this.stateData.playerMaxHealth))
    
    // 检查玩家死亡
    if (this.stateData.playerHealth <= 0) {
      this.changeState(GameState.GAME_OVER, 'player_died')
    }

    this.emit('dataUpdate', { 
      type: 'health_change', 
      data: { 
        health: this.stateData.playerHealth,
        maxHealth: this.stateData.playerMaxHealth
      }
    })
  }

  // 设置玩家位置
  setPlayerPosition(position: Position): void {
    this.stateData.playerPosition = { ...position }
    this.emit('dataUpdate', { type: 'position_change', data: position })
  }

  // 添加分数
  addScore(points: number, type: 'enemy_kills' | 'items_collected' | 'time_bonus' = 'enemy_kills'): void {
    this.stateData.score.total += points
    
    switch (type) {
      case 'enemy_kills':
        this.stateData.score.enemyKills += points
        break
      case 'items_collected':
        this.stateData.score.itemsCollected += points
        break
      case 'time_bonus':
        this.stateData.score.timeBonus += points
        break
    }

    this.emit('dataUpdate', { type: 'score_change', data: { ...this.stateData.score } })
  }

  // 更新游戏时间
  updateGameTime(deltaTime: number): void {
    if (this.currentState === GameState.PLAYING && !this.stateData.isPaused) {
      this.stateData.gameTime += deltaTime
    }
  }

  // 设置检查点
  setCheckpoint(position: Position): void {
    this.stateData.checkpoints.push({ ...position })
    
    const managerEvent: StateManagerEvent = {
      type: 'checkpoint_reached',
      data: { position, checkpointCount: this.stateData.checkpoints.length }
    }
    this.emit('stateManagerEvent', managerEvent)
  }

  // 获取最近的检查点
  getLastCheckpoint(): Position | null {
    return this.stateData.checkpoints.length > 0 
      ? { ...this.stateData.checkpoints[this.stateData.checkpoints.length - 1] }
      : null
  }

  // 解锁武器
  unlockWeapon(weaponType: string): void {
    if (!this.stateData.unlockedWeapons.includes(weaponType)) {
      this.stateData.unlockedWeapons.push(weaponType)
      this.emit('dataUpdate', { type: 'weapon_unlock', data: { weaponType } })
    }
  }

  // 解锁成就
  unlockAchievement(achievementId: string): void {
    if (!this.stateData.achievements.includes(achievementId)) {
      this.stateData.achievements.push(achievementId)
      this.emit('dataUpdate', { type: 'achievement_unlock', data: { achievementId } })
    }
  }

  // 检查成就条件
  checkAchievements(): void {
    // 检查分数成就
    if (this.stateData.score.total >= 1000 && !this.stateData.achievements.includes('score_1000')) {
      this.unlockAchievement('score_1000')
    }

    // 检查关卡成就
    if (this.stateData.currentLevel >= 3 && !this.stateData.achievements.includes('level_3')) {
      this.unlockAchievement('level_3')
    }

    // 检查完美通关成就（无伤害）
    if (this.stateData.currentLevel > 1 && this.stateData.playerHealth === this.stateData.playerMaxHealth) {
      if (!this.stateData.achievements.includes('perfect_level')) {
        this.unlockAchievement('perfect_level')
      }
    }
  }

  // 保存到历史记录
  private saveToHistory(): void {
    const historyEntry = {
      state: this.currentState,
      data: { ...this.stateData },
      timestamp: Date.now()
    }

    this.stateHistory.push(historyEntry)

    // 限制历史记录大小
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift()
    }
  }

  // 获取状态历史
  getStateHistory(): { state: GameState; data: GameStateData; timestamp: number }[] {
    return [...this.stateHistory]
  }

  // 恢复到上一个状态
  undoState(): boolean {
    if (this.stateHistory.length > 1) {
      const previousState = this.stateHistory[this.stateHistory.length - 2]
      this.currentState = previousState.state
      this.stateData = { ...previousState.data }
      
      this.emit('stateManagerEvent', {
        type: 'state_change',
        data: { type: 'undo', state: previousState.state }
      })
      
      return true
    }
    return false
  }

  // 获取当前分数
  getCurrentScore(): ScoreStats {
    return { ...this.stateData.score }
  }

  // 获取当前关卡
  getCurrentLevel(): number {
    return this.stateData.currentLevel
  }

  // 获取玩家位置
  getPlayerPosition(): Position {
    return { ...this.stateData.playerPosition }
  }

  // 检查游戏状态
  isPlaying(): boolean {
    return this.currentState === GameState.PLAYING && !this.stateData.isPaused
  }

  isPaused(): boolean {
    return this.stateData.isPaused
  }

  isGameOver(): boolean {
    return this.currentState === GameState.GAME_OVER
  }

  // 序列化状态数据
  serialize(): string {
    return JSON.stringify({
      state: this.currentState,
      data: this.stateData,
      history: this.stateHistory.slice(-5) // 只保存最近5条历史记录
    })
  }

  // 反序列化状态数据
  deserialize(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString)
      
      this.currentState = data.state
      this.stateData = data.data
      this.stateHistory = data.history || []

      this.emit('stateManagerEvent', {
        type: 'save_loaded',
        data: { state: this.currentState }
      })

      return true
    } catch (error) {
      console.error('反序列化状态数据失败:', error)
      return false
    }
  }

  // 重置到初始状态
  reset(): void {
    this.currentState = GameState.MAIN_MENU
    this.stateData = {
      currentLevel: 1,
      playerHealth: 100,
      playerMaxHealth: 100,
      score: {
        total: 0,
        enemyKills: 0,
        itemsCollected: 0,
        timeBonus: 0
      },
      playerPosition: { x: 100, y: 400 },
      isPaused: false,
      gameTime: 0,
      checkpoints: [],
      unlockedWeapons: ['pistol'],
      achievements: []
    }
    this.stateHistory = []

    this.emit('stateManagerEvent', {
      type: 'state_change',
      data: { type: 'reset' }
    })
  }
}
