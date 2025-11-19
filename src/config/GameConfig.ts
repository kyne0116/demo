import { EventEmitter } from '../services/event/EventEmitter'

// 游戏配置接口
export interface GameConfigData {
  // 音频配置
  audio: {
    masterVolume: number
    sfxVolume: number
    musicVolume: number
    mute: boolean
  }

  // 视频配置
  video: {
    width: number
    height: number
    fullscreen: boolean
    vsync: boolean
    renderScale: number // 渲染缩放因子
    pixelPerfect: boolean
  }

  // 控制配置
  controls: {
    keyBindings: {
      [action: string]: string[]
    }
    mouseSensitivity: number
    invertY: boolean
    showCursor: boolean
  }

  // 游戏配置
  gameplay: {
    difficulty: 'easy' | 'normal' | 'hard'
    autoSave: boolean
    showFPS: boolean
    showDebugInfo: boolean
    language: string
    bloodEffects: boolean
    screenShake: boolean
  }

  // 性能配置
  performance: {
    targetFPS: number
    maxConcurrentSounds: number
    particleLimit: number
    entityLimit: number
    useLOD: boolean
  }

  // 存档配置
  save: {
    autoSaveInterval: number
    maxSlots: number
    compressSaves: boolean
    encryptSaves: boolean
  }
}

// 配置更改事件
export interface ConfigChangeEvent {
  category: keyof GameConfigData
  key: string
  oldValue: any
  newValue: any
  timestamp: number
}

// 默认配置
const DEFAULT_CONFIG: GameConfigData = {
  audio: {
    masterVolume: 1.0,
    sfxVolume: 0.8,
    musicVolume: 0.6,
    mute: false
  },
  video: {
    width: 800,
    height: 600,
    fullscreen: false,
    vsync: true,
    renderScale: 1.0,
    pixelPerfect: false
  },
  controls: {
    keyBindings: {
      moveUp: ['w', 'W', 'ArrowUp'],
      moveDown: ['s', 'S', 'ArrowDown'],
      moveLeft: ['a', 'A', 'ArrowLeft'],
      moveRight: ['d', 'D', 'ArrowRight'],
      jump: [' ', 'Spacebar'],
      shoot: ['j', 'J', 'Mouse0'],
      reload: ['r', 'R'],
      pause: ['Escape', 'p', 'P'],
      start: ['Enter'],
      restart: ['Enter']
    },
    mouseSensitivity: 1.0,
    invertY: false,
    showCursor: true
  },
  gameplay: {
    difficulty: 'normal',
    autoSave: true,
    showFPS: true,
    showDebugInfo: false,
    language: 'zh-CN',
    bloodEffects: true,
    screenShake: true
  },
  performance: {
    targetFPS: 60,
    maxConcurrentSounds: 16,
    particleLimit: 500,
    entityLimit: 100,
    useLOD: false
  },
  save: {
    autoSaveInterval: 30000,
    maxSlots: 3,
    compressSaves: false,
    encryptSaves: false
  }
}

// 配置验证规则
const CONFIG_VALIDATION = {
  audio: {
    masterVolume: { min: 0, max: 1 },
    sfxVolume: { min: 0, max: 1 },
    musicVolume: { min: 0, max: 1 }
  },
  video: {
    width: { min: 320, max: 3840 },
    height: { min: 240, max: 2160 },
    renderScale: { min: 0.5, max: 2.0 }
  },
  controls: {
    mouseSensitivity: { min: 0.1, max: 3.0 }
  },
  gameplay: {
    difficulty: ['easy', 'normal', 'hard']
  },
  performance: {
    targetFPS: { min: 30, max: 144 },
    maxConcurrentSounds: { min: 1, max: 32 },
    particleLimit: { min: 50, max: 2000 },
    entityLimit: { min: 10, max: 500 }
  },
  save: {
    autoSaveInterval: { min: 5000, max: 300000 }
  }
}

// 游戏配置管理器类
export class GameConfig extends EventEmitter {
  private config: GameConfigData
  private configKey: string = 'metal_slug_config'
  private isDirty: boolean = false
  private autoSaveTimer: NodeJS.Timeout | null = null
  private loaded: boolean = false

  constructor(config?: Partial<GameConfigData>) {
    super()
    
    // 深度合并默认配置和传入配置
    this.config = this.deepMerge(DEFAULT_CONFIG, config || {})
    
    this.initializeAutoSave()
  }

  // 深度合并对象
  private deepMerge(target: any, source: any): any {
    const result = { ...target }
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' && 
          source[key] !== null && 
          !Array.isArray(source[key]) &&
          typeof target[key] === 'object' &&
          target[key] !== null &&
          !Array.isArray(target[key])
        ) {
          result[key] = this.deepMerge(target[key], source[key])
        } else {
          result[key] = source[key]
        }
      }
    }
    
    return result
  }

  // 初始化配置
  async initialize(): Promise<void> {
    try {
      await this.load()
      this.loaded = true
    } catch (error) {
      console.warn('加载配置失败，使用默认配置:', error)
      this.config = { ...DEFAULT_CONFIG }
    }
  }

  // 加载配置
  async load(): Promise<void> {
    try {
      const saved = localStorage.getItem(this.configKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        this.config = this.deepMerge(DEFAULT_CONFIG, parsed)
        this.validateAndFixConfig()
      }
    } catch (error) {
      throw new Error(`加载配置失败: ${error}`)
    }
  }

  // 保存配置
  async save(): Promise<void> {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(this.config))
      this.isDirty = false
    } catch (error) {
      throw new Error(`保存配置失败: ${error}`)
    }
  }

  // 初始化自动保存
  private initializeAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      if (this.isDirty) {
        this.save().catch(error => console.warn('自动保存失败:', error))
      }
    }, 10000) // 每10秒检查一次
  }

  // 验证并修复配置
  private validateAndFixConfig(): void {
    this.config = this.validateConfig(this.config)
  }

  // 验证配置
  private validateConfig(config: GameConfigData): GameConfigData {
    const validated = { ...config }

    // 验证音频设置
    validated.audio.masterVolume = this.validateNumber(
      'audio.masterVolume',
      config.audio.masterVolume,
      0,
      1
    )
    validated.audio.sfxVolume = this.validateNumber(
      'audio.sfxVolume',
      config.audio.sfxVolume,
      0,
      1
    )
    validated.audio.musicVolume = this.validateNumber(
      'audio.musicVolume',
      config.audio.musicVolume,
      0,
      1
    )

    // 验证视频设置
    validated.video.width = this.validateNumber(
      'video.width',
      config.video.width,
      320,
      3840
    )
    validated.video.height = this.validateNumber(
      'video.height',
      config.video.height,
      240,
      2160
    )
    validated.video.renderScale = this.validateNumber(
      'video.renderScale',
      config.video.renderScale,
      0.5,
      2.0
    )

    // 验证控制设置
    validated.controls.mouseSensitivity = this.validateNumber(
      'controls.mouseSensitivity',
      config.controls.mouseSensitivity,
      0.1,
      3.0
    )

    // 验证游戏设置
    if (!['easy', 'normal', 'hard'].includes(config.gameplay.difficulty)) {
      validated.gameplay.difficulty = 'normal'
    }

    // 验证性能设置
    validated.performance.targetFPS = this.validateNumber(
      'performance.targetFPS',
      config.performance.targetFPS,
      30,
      144
    )
    validated.performance.maxConcurrentSounds = this.validateNumber(
      'performance.maxConcurrentSounds',
      config.performance.maxConcurrentSounds,
      1,
      32
    )
    validated.performance.particleLimit = this.validateNumber(
      'performance.particleLimit',
      config.performance.particleLimit,
      50,
      2000
    )
    validated.performance.entityLimit = this.validateNumber(
      'performance.entityLimit',
      config.performance.entityLimit,
      10,
      500
    )

    // 验证存档设置
    validated.save.autoSaveInterval = this.validateNumber(
      'save.autoSaveInterval',
      config.save.autoSaveInterval,
      5000,
      300000
    )

    return validated
  }

  // 验证数值
  private validateNumber(path: string, value: number, min: number, max: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`配置项 ${path} 的值无效，使用默认值:`, value)
      return this.getDefaultValueForPath(path)
    }
    
    return Math.max(min, Math.min(max, value))
  }

  // 获取路径的默认值
  private getDefaultValueForPath(path: string): number {
    const pathMap: { [key: string]: number } = {
      'audio.masterVolume': DEFAULT_CONFIG.audio.masterVolume,
      'audio.sfxVolume': DEFAULT_CONFIG.audio.sfxVolume,
      'audio.musicVolume': DEFAULT_CONFIG.audio.musicVolume,
      'video.width': DEFAULT_CONFIG.video.width,
      'video.height': DEFAULT_CONFIG.video.height,
      'video.renderScale': DEFAULT_CONFIG.video.renderScale,
      'controls.mouseSensitivity': DEFAULT_CONFIG.controls.mouseSensitivity,
      'performance.targetFPS': DEFAULT_CONFIG.performance.targetFPS,
      'performance.maxConcurrentSounds': DEFAULT_CONFIG.performance.maxConcurrentSounds,
      'performance.particleLimit': DEFAULT_CONFIG.performance.particleLimit,
      'performance.entityLimit': DEFAULT_CONFIG.performance.entityLimit,
      'save.autoSaveInterval': DEFAULT_CONFIG.save.autoSaveInterval
    }
    
    return pathMap[path] || 0
  }

  // 设置配置值
  set<K extends keyof GameConfigData>(category: K, key: keyof GameConfigData[K], value: any): void {
    const oldValue = this.config[category][key]
    
    // 验证值
    if (!this.validateValue(category, key as string, value)) {
      console.warn(`配置值无效: ${category}.${key} = ${value}`)
      return
    }

    this.config[category][key] = value
    this.isDirty = true

    // 触发更改事件
    const event: ConfigChangeEvent = {
      category,
      key: key as string,
      oldValue,
      newValue: value,
      timestamp: Date.now()
    }
    
    this.emit('configChange', event)

    // 特殊处理某些配置更改
    this.handleSpecialConfigChange(category, key as string, value)
  }

  // 获取配置值
  get<K extends keyof GameConfigData>(category: K, key: keyof GameConfigData[K]): any {
    return this.config[category][key]
  }

  // 获取整个配置类别
  getCategory<K extends keyof GameConfigData>(category: K): GameConfigData[K] {
    return { ...this.config[category] }
  }

  // 获取完整配置
  getConfig(): GameConfigData {
    return { ...this.config }
  }

  // 验证单个值
  private validateValue(category: keyof GameConfigData, key: string, value: any): boolean {
    const rules = CONFIG_VALIDATION[category]
    
    if (!rules || !rules[key as keyof typeof rules]) {
      return true // 没有验证规则时允许设置
    }

    const rule = rules[key as keyof typeof rules]
    
    if (typeof rule === 'object' && 'min' in rule && 'max' in rule) {
      return typeof value === 'number' && value >= rule.min && value <= rule.max
    }
    
    if (Array.isArray(rule)) {
      return rule.includes(value)
    }

    return true
  }

  // 处理特殊配置更改
  private handleSpecialConfigChange(category: keyof GameConfigData, key: string, value: any): void {
    switch (category) {
      case 'video':
        if (key === 'fullscreen') {
          this.handleFullscreenChange(value)
        } else if (key === 'renderScale') {
          this.handleRenderScaleChange(value)
        }
        break
        
      case 'audio':
        if (key === 'masterVolume') {
          this.handleMasterVolumeChange(value)
        }
        break
        
      case 'save':
        if (key === 'autoSaveInterval') {
          this.handleAutoSaveIntervalChange(value)
        }
        break
    }
  }

  // 处理全屏更改
  private handleFullscreenChange(fullscreen: boolean): void {
    if (fullscreen) {
      this.enterFullscreen()
    } else {
      this.exitFullscreen()
    }
  }

  // 进入全屏
  private async enterFullscreen(): Promise<void> {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch (error) {
      console.warn('进入全屏失败:', error)
      this.config.video.fullscreen = false
    }
  }

  // 退出全屏
  private async exitFullscreen(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.warn('退出全屏失败:', error)
    }
  }

  // 处理渲染缩放更改
  private handleRenderScaleChange(scale: number): void {
    // 这里可以触发渲染系统的更新
    this.emit('renderScaleChange', { scale })
  }

  // 处理主音量更改
  private handleMasterVolumeChange(volume: number): void {
    // 这里可以触发音频系统的更新
    this.emit('masterVolumeChange', { volume })
  }

  // 处理自动保存间隔更改
  private handleAutoSaveIntervalChange(interval: number): void {
    // 重新设置自动保存定时器
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    this.initializeAutoSave()
  }

  // 重置到默认值
  reset(category?: keyof GameConfigData): void {
    if (category) {
      // 重置特定类别
      this.config[category] = { ...DEFAULT_CONFIG[category] }
      this.emit('configReset', { category })
    } else {
      // 重置所有配置
      this.config = { ...DEFAULT_CONFIG }
      this.emit('configReset', {})
    }
    
    this.isDirty = true
  }

  // 导出配置
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  // 导入配置
  importConfig(configString: string): boolean {
    try {
      const imported = JSON.parse(configString)
      this.config = this.validateConfig(this.deepMerge(DEFAULT_CONFIG, imported))
      this.isDirty = true
      this.emit('configImport', { config: this.config })
      return true
    } catch (error) {
      console.error('导入配置失败:', error)
      return false
    }
  }

  // 检查配置是否已加载
  isLoaded(): boolean {
    return this.loaded
  }

  // 检查配置是否已修改（未保存）
  isDirty(): boolean {
    return this.isDirty
  }

  // 强制保存
  forceSave(): Promise<void> {
    return this.save()
  }

  // 获取默认配置
  static getDefaultConfig(): GameConfigData {
    return { ...DEFAULT_CONFIG }
  }

  // 清理
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    super.destroy()
  }
}
