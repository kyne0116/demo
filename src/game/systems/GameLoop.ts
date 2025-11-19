import { EventEmitter } from '../../services/event/EventEmitter'

// 游戏系统基接口
export interface GameSystem {
  name: string
  priority: number
  enabled: boolean

  initialize(): Promise<void>
  update(deltaTime: number): void
  cleanup(): void
  onEnable?(): void
  onDisable?(): void
}

// 游戏循环事件
export interface GameLoopEvent {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'update' | 'error'
  deltaTime: number
  timestamp: number
  systemName?: string
  error?: Error
}

// 性能统计
export interface PerformanceStats {
  fps: number
  frameTime: number
  averageFrameTime: number
  minFrameTime: number
  maxFrameTime: number
  deltaTime: number
}

// 游戏循环类
export class GameLoop extends EventEmitter {
  private isRunning: boolean = false
  private isPaused: boolean = false
  private lastTime: number = 0
  private currentTime: number = 0
  private systems: Map<string, GameSystem> = new Map()
  private systemOrder: GameSystem[] = []
  private animationFrameId: number | null = null
  private maxDeltaTime: number = 1 / 30 // 最大帧时间 (30 FPS)
  private targetFPS: number = 60
  private timeScale: number = 1.0
  private performanceStats: PerformanceStats = {
    fps: 60,
    frameTime: 0,
    averageFrameTime: 0,
    minFrameTime: Infinity,
    maxFrameTime: 0,
    deltaTime: 0
  }
  private frameCount: number = 0
  private lastFPSUpdate: number = 0

  constructor() {
    super()
  }

  // 添加游戏系统
  addSystem(system: GameSystem): void {
    this.systems.set(system.name, system)
    this.updateSystemOrder()
  }

  // 移除游戏系统
  removeSystem(name: string): void {
    const system = this.systems.get(name)
    if (system) {
      if (system.enabled) {
        system.cleanup()
      }
      this.systems.delete(name)
      this.updateSystemOrder()
    }
  }

  // 获取游戏系统
  getSystem<T extends GameSystem>(name: string): T | undefined {
    return this.systems.get(name) as T | undefined
  }

  // 启用/禁用系统
  setSystemEnabled(name: string, enabled: boolean): void {
    const system = this.systems.get(name)
    if (system) {
      if (system.enabled !== enabled) {
        system.enabled = enabled
        if (enabled && system.onEnable) {
          system.onEnable()
        } else if (!enabled && system.onDisable) {
          system.onDisable()
        }
      }
    }
  }

  // 更新系统排序
  private updateSystemOrder(): void {
    this.systemOrder = Array.from(this.systems.values())
      .sort((a, b) => a.priority - b.priority)
  }

  // 启动游戏循环
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('游戏循环已经在运行')
      return
    }

    try {
      // 初始化所有系统
      for (const system of this.systems.values()) {
        await system.initialize()
        system.enabled = true
      }

      this.isRunning = true
      this.isPaused = false
      this.lastTime = performance.now()
      this.lastFPSUpdate = this.lastTime

      // 触发启动事件
      const event: GameLoopEvent = {
        type: 'start',
        deltaTime: 0,
        timestamp: Date.now()
      }
      this.emit('start', event)

      // 开始主循环
      this.gameLoop()

    } catch (error) {
      console.error('游戏循环启动失败:', error)
      const event: GameLoopEvent = {
        type: 'error',
        deltaTime: 0,
        timestamp: Date.now(),
        error: error as Error
      }
      this.emit('error', event)
    }
  }

  // 暂停游戏循环
  pause(): void {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true
      const event: GameLoopEvent = {
        type: 'pause',
        deltaTime: this.performanceStats.deltaTime,
        timestamp: Date.now()
      }
      this.emit('pause', event)
    }
  }

  // 恢复游戏循环
  resume(): void {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false
      this.lastTime = performance.now() // 重置时间基准
      const event: GameLoopEvent = {
        type: 'resume',
        deltaTime: this.performanceStats.deltaTime,
        timestamp: Date.now()
      }
      this.emit('resume', event)
    }
  }

  // 停止游戏循环
  stop(): void {
    if (this.isRunning) {
      this.isRunning = false
      this.isPaused = false
      
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }

      // 清理所有系统
      for (const system of this.systems.values()) {
        system.cleanup()
      }

      const event: GameLoopEvent = {
        type: 'stop',
        deltaTime: this.performanceStats.deltaTime,
        timestamp: Date.now()
      }
      this.emit('stop', event)
    }
  }

  // 主游戏循环
  private gameLoop = (): void => {
    if (!this.isRunning) return

    const now = performance.now()
    this.currentTime = now

    // 计算deltaTime
    let deltaTime = (now - this.lastTime) / 1000 * this.timeScale
    this.lastTime = now

    // 限制最大deltaTime防止物理穿透
    deltaTime = Math.min(deltaTime, this.maxDeltaTime)
    
    // 更新性能统计
    this.updatePerformanceStats(deltaTime)

    if (!this.isPaused) {
      // 更新所有系统
      this.updateSystems(deltaTime)

      // 触发更新事件
      const event: GameLoopEvent = {
        type: 'update',
        deltaTime,
        timestamp: Date.now()
      }
      this.emit('update', event)
    }

    // 继续下一帧
    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  // 更新性能统计
  private updatePerformanceStats(deltaTime: number): void {
    this.performanceStats.deltaTime = deltaTime
    this.performanceStats.frameTime = deltaTime * 1000
    this.performanceStats.fps = 1 / deltaTime

    // 更新平均帧时间
    const alpha = 0.1
    this.performanceStats.averageFrameTime = 
      this.performanceStats.averageFrameTime * (1 - alpha) + deltaTime * alpha

    // 更新最小/最大帧时间
    this.performanceStats.minFrameTime = Math.min(this.performanceStats.minFrameTime, deltaTime)
    this.performanceStats.maxFrameTime = Math.max(this.performanceStats.maxFrameTime, deltaTime)

    // 更新FPS显示（每0.5秒更新一次）
    if (this.currentTime - this.lastFPSUpdate > 500) {
      this.performanceStats.fps = Math.round(1 / this.performanceStats.averageFrameTime)
      this.lastFPSUpdate = this.currentTime
    }
  }

  // 更新所有系统
  private updateSystems(deltaTime: number): void {
    for (const system of this.systemOrder) {
      if (system.enabled) {
        try {
          system.update(deltaTime)
        } catch (error) {
          console.error(`系统 ${system.name} 更新失败:`, error)
          
          // 发送错误事件
          const event: GameLoopEvent = {
            type: 'error',
            deltaTime,
            timestamp: Date.now(),
            systemName: system.name,
            error: error as Error
          }
          this.emit('error', event)
        }
      }
    }
  }

  // 设置时间缩放
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale)
  }

  // 获取时间缩放
  getTimeScale(): number {
    return this.timeScale
  }

  // 获取当前时间
  getCurrentTime(): number {
    return this.currentTime
  }

  // 获取deltaTime
  getDeltaTime(): number {
    return this.performanceStats.deltaTime
  }

  // 获取FPS
  getFPS(): number {
    return this.performanceStats.fps
  }

  // 获取性能统计
  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats }
  }

  // 检查是否运行中
  isGameRunning(): boolean {
    return this.isRunning
  }

  // 检查是否暂停
  isGamePaused(): boolean {
    return this.isPaused
  }

  // 设置目标FPS
  setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, fps)
  }

  // 获取目标FPS
  getTargetFPS(): number {
    return this.targetFPS
  }

  // 设置最大deltaTime
  setMaxDeltaTime(maxDeltaTime: number): void {
    this.maxDeltaTime = Math.max(1 / 120, maxDeltaTime)
  }

  // 获取最大deltaTime
  getMaxDeltaTime(): number {
    return this.maxDeltaTime
  }

  // 获取所有系统
  getAllSystems(): GameSystem[] {
    return [...this.systemOrder]
  }

  // 获取系统名称列表
  getSystemNames(): string[] {
    return Array.from(this.systems.keys())
  }

  // 清理
  destroy(): void {
    this.stop()
    this.systems.clear()
    this.systemOrder = []
    super.destroy()
  }
}
