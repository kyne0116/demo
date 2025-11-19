import { EventEmitter } from '../event/EventEmitter'

// 音频资源接口
export interface AudioResource {
  id: string
  url: string
  loaded: boolean
  duration: number
  buffer?: AudioBuffer
}

// 音频播放接口
export interface AudioPlayback {
  id: string
  resourceId: string
  volume: number
  loop: boolean
  playing: boolean
  paused: boolean
  currentTime: number
  startTime: number

  play(): void
  pause(): void
  stop(): void
  setVolume(volume: number): void
  setLoop(loop: boolean): void
  getCurrentTime(): number
  getDuration(): number
}

// 音频事件
export interface AudioEvent {
  type: 'loaded' | 'playing' | 'paused' | 'stopped' | 'ended' | 'error'
  resourceId?: string
  playbackId?: string
  error?: Error
}

// 音频配置
export interface AudioConfig {
  masterVolume: number
  sfxVolume: number
  maxConcurrentSounds: number
}

// SFX类型枚举
export enum SFXType {
  SHOOT = 'shoot',
  EXPLOSION = 'explosion',
  ITEM_COLLECT = 'item_collect',
  ENEMY_HIT = 'enemy_hit',
  PLAYER_HURT = 'player_hurt',
  WEAPON_UPGRADE = 'weapon_upgrade',
  LEVEL_COMPLETE = 'level_complete',
  GAME_OVER = 'game_over'
}

// 音频播放类
export class AudioPlaybackImpl implements AudioPlayback {
  id: string
  resourceId: string
  volume: number
  loop: boolean
  playing: boolean = false
  paused: boolean = false
  currentTime: number = 0
  startTime: number = 0
  private audioElement: HTMLAudioElement
  private onEnded?: () => void

  constructor(
    id: string,
    resourceId: string,
    audioElement: HTMLAudioElement,
    volume: number = 1,
    loop: boolean = false
  ) {
    this.id = id
    this.resourceId = resourceId
    this.audioElement = audioElement
    this.volume = volume
    this.loop = loop
    
    this.audioElement.loop = loop
    this.audioElement.volume = volume
  }

  play(): void {
    if (this.paused) {
      this.audioElement.currentTime = this.currentTime
      this.paused = false
    }
    
    this.audioElement.play()
    this.playing = true
    this.startTime = Date.now()
  }

  pause(): void {
    this.audioElement.pause()
    this.currentTime = this.audioElement.currentTime
    this.paused = true
    this.playing = false
  }

  stop(): void {
    this.audioElement.pause()
    this.audioElement.currentTime = 0
    this.paused = false
    this.playing = false
    this.currentTime = 0
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    this.audioElement.volume = this.volume
  }

  setLoop(loop: boolean): void {
    this.loop = loop
    this.audioElement.loop = loop
  }

  getCurrentTime(): number {
    return this.audioElement.currentTime
  }

  getDuration(): number {
    return this.audioElement.duration
  }
}

// 基础音效系统类（仅SFX，不含音乐）
export class AudioSystem extends EventEmitter {
  private audioContext: AudioContext | null = null
  private resources: Map<string, AudioResource> = new Map()
  private playbacks: Map<string, AudioPlaybackImpl> = new Map()
  private config: AudioConfig = {
    masterVolume: 1.0,
    sfxVolume: 1.0,
    maxConcurrentSounds: 16
  }
  private sfxPaths: Map<SFXType, string> = new Map()
  private initialized: boolean = false

  constructor() {
    super()
    this.initializeSFXPaths()
  }

  // 初始化SFX路径映射
  private initializeSFXPaths(): void {
    this.sfxPaths.set(SFXType.SHOOT, '/assets/sounds/shoot.wav')
    this.sfxPaths.set(SFXType.EXPLOSION, '/assets/sounds/explosion.wav')
    this.sfxPaths.set(SFXType.ITEM_COLLECT, '/assets/sounds/item_collect.wav')
    this.sfxPaths.set(SFXType.ENEMY_HIT, '/assets/sounds/enemy_hit.wav')
    this.sfxPaths.set(SFXType.PLAYER_HURT, '/assets/sounds/player_hurt.wav')
    this.sfxPaths.set(SFXType.WEAPON_UPGRADE, '/assets/sounds/weapon_upgrade.wav')
    this.sfxPaths.set(SFXType.LEVEL_COMPLETE, '/assets/sounds/level_complete.wav')
    this.sfxPaths.set(SFXType.GAME_OVER, '/assets/sounds/game_over.wav')
  }

  // 初始化音频系统
  async initialize(): Promise<void> {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 如果音频上下文处于suspended状态，尝试恢复
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // 预加载SFX音效
      await this.preloadSFXSounds()

      this.initialized = true
      
      this.emit('audioEvent', {
        type: 'loaded',
        resourceId: 'system'
      } as AudioEvent)

    } catch (error) {
      console.warn('音频系统初始化失败:', error)
      this.emit('audioEvent', {
        type: 'error',
        error: error as Error
      } as AudioEvent)
    }
  }

  // 预加载SFX音效
  private async preloadSFXSounds(): Promise<void> {
    const loadPromises = Array.from(this.sfxPaths.entries()).map(([type, path]) =>
      this.loadAudio(type, path)
    )
    
    await Promise.allSettled(loadPromises)
  }

  // 加载音频资源
  async loadAudio(id: string, url: string): Promise<AudioResource | null> {
    try {
      const audioElement = new Audio()
      audioElement.src = url
      audioElement.preload = 'auto'

      // 等待音频加载完成
      await new Promise<void>((resolve, reject) => {
        audioElement.addEventListener('canplaythrough', () => resolve(), { once: true })
        audioElement.addEventListener('error', () => reject(new Error(`无法加载音频: ${url}`)), { once: true })
        
        // 设置超时
        setTimeout(() => reject(new Error(`音频加载超时: ${url}`)), 10000)
      })

      const resource: AudioResource = {
        id,
        url,
        loaded: true,
        duration: audioElement.duration
      }

      this.resources.set(id, resource)
      return resource

    } catch (error) {
      console.warn(`加载音频失败: ${url}`, error)
      return null
    }
  }

  // 卸载音频资源
  unloadAudio(id: string): void {
    const resource = this.resources.get(id)
    if (resource) {
      this.resources.delete(id)
      // 停止所有相关播放
      this.stopAllByResource(id)
    }
  }

  // 播放SFX音效
  playSFX(type: SFXType, volume: number = 1.0): AudioPlayback | null {
    const path = this.sfxPaths.get(type)
    if (!path) {
      console.warn(`未找到SFX音效: ${type}`)
      return null
    }

    return this.playAudio(type, Math.min(volume, 1.0) * this.config.sfxVolume * this.config.masterVolume)
  }

  // 播放通用音频
  playAudio(id: string, volume: number = 1.0, loop: boolean = false): AudioPlayback | null {
    const resource = this.resources.get(id)
    if (!resource) {
      console.warn(`音频资源未找到: ${id}`)
      return null
    }

    // 检查最大并发音效数
    if (this.playbacks.size >= this.config.maxConcurrentSounds) {
      this.stopOldestPlayback()
    }

    try {
      const audioElement = new Audio(resource.url)
      audioElement.volume = Math.min(volume, 1.0)
      audioElement.loop = loop

      const playbackId = `${id}_${Date.now()}_${Math.random()}`
      const playback = new AudioPlaybackImpl(playbackId, id, audioElement, volume, loop)

      // 添加事件监听器
      audioElement.addEventListener('ended', () => {
        this.playbacks.delete(playbackId)
        this.emit('audioEvent', {
          type: 'ended',
          resourceId: id,
          playbackId
        } as AudioEvent)
      })

      audioElement.addEventListener('play', () => {
        this.emit('audioEvent', {
          type: 'playing',
          resourceId: id,
          playbackId
        } as AudioEvent)
      })

      audioElement.addEventListener('pause', () => {
        this.emit('audioEvent', {
          type: 'paused',
          resourceId: id,
          playbackId
        } as AudioEvent)
      })

      audioElement.addEventListener('stop', () => {
        this.emit('audioEvent', {
          type: 'stopped',
          resourceId: id,
          playbackId
        } as AudioEvent)
      })

      this.playbacks.set(playbackId, playback)
      
      // 开始播放
      playback.play()

      return playback

    } catch (error) {
      console.error(`播放音频失败: ${id}`, error)
      this.emit('audioEvent', {
        type: 'error',
        resourceId: id,
        error: error as Error
      } as AudioEvent)
      return null
    }
  }

  // 停止最老的播放
  private stopOldestPlayback(): void {
    if (this.playbacks.size > 0) {
      const oldestId = Array.from(this.playbacks.keys())[0]
      const oldestPlayback = this.playbacks.get(oldestId)
      if (oldestPlayback) {
        oldestPlayback.stop()
        this.playbacks.delete(oldestId)
      }
    }
  }

  // 停止资源相关的所有播放
  private stopAllByResource(resourceId: string): void {
    const playbackIds = Array.from(this.playbacks.keys())
    for (const playbackId of playbackIds) {
      const playback = this.playbacks.get(playbackId)
      if (playback && playback.resourceId === resourceId) {
        playback.stop()
        this.playbacks.delete(playbackId)
      }
    }
  }

  // 停止所有播放
  stopAll(): void {
    for (const playback of this.playbacks.values()) {
      playback.stop()
    }
    this.playbacks.clear()
  }

  // 暂停所有播放
  pauseAll(): void {
    for (const playback of this.playbacks.values()) {
      if (playback.playing && !playback.paused) {
        playback.pause()
      }
    }
  }

  // 恢复所有播放
  resumeAll(): void {
    for (const playback of this.playbacks.values()) {
      if (playback.paused) {
        playback.play()
      }
    }
  }

  // 设置主音量
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  // 设置SFX音量
  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume))
  }

  // 更新所有播放的音量
  private updateAllVolumes(): void {
    for (const playback of this.playbacks.values()) {
      const resource = this.resources.get(playback.resourceId)
      if (resource && resource.id in SFXType) {
        // SFX音效应用SFX音量
        playback.setVolume(this.config.sfxVolume * this.config.masterVolume)
      }
    }
  }

  // 获取配置
  getConfig(): AudioConfig {
    return { ...this.config }
  }

  // 获取资源信息
  getResource(id: string): AudioResource | undefined {
    return this.resources.get(id)
  }

  // 获取所有资源
  getAllResources(): AudioResource[] {
    return Array.from(this.resources.values())
  }

  // 获取播放信息
  getPlayback(id: string): AudioPlayback | undefined {
    return this.playbacks.get(id)
  }

  // 获取所有播放
  getAllPlaybacks(): AudioPlayback[] {
    return Array.from(this.playbacks.values())
  }

  // 设置SFX路径
  setSFXPath(type: SFXType, path: string): void {
    this.sfxPaths.set(type, path)
  }

  // 获取SFX路径
  getSFXPath(type: SFXType): string | undefined {
    return this.sfxPaths.get(type)
  }

  // 检查系统是否已初始化
  isInitialized(): boolean {
    return this.initialized
  }

  // 检查资源是否已加载
  isResourceLoaded(id: string): boolean {
    const resource = this.resources.get(id)
    return resource ? resource.loaded : false
  }

  // 清理
  destroy(): void {
    this.stopAll()
    this.resources.clear()
    this.playbacks.clear()
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    super.destroy()
  }
}
