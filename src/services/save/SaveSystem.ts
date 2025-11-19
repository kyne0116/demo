import { SaveData, GameState, Position, ScoreStats } from '../../types/game'
import { EventEmitter } from '../event/EventEmitter'

// 存档槽位
export interface SaveSlot {
  id: string
  name: string
  thumbnail?: string
  lastModified: Date
  data: SaveData
}

// 存档事件
export interface SaveEvent {
  type: 'save_completed' | 'load_completed' | 'delete_completed' | 'error'
  slotId?: string
  data?: SaveData | SaveSlot[]
  error?: Error
}

// 存档配置
export interface SaveConfig {
  storageKey: string
  maxSlots: number
  autoSaveInterval: number // 自动保存间隔（毫秒）
  compressionEnabled: boolean
  encryptionEnabled: boolean
}

// 存档系统类
export class SaveSystem extends EventEmitter {
  private config: SaveConfig
  private currentSlot: SaveSlot | null = null
  private autoSaveTimer: NodeJS.Timeout | null = null
  private isAutoSaving: boolean = false

  constructor(config?: Partial<SaveConfig>) {
    super()
    this.config = {
      storageKey: 'metal_slug_game',
      maxSlots: 3,
      autoSaveInterval: 30000, // 30秒
      compressionEnabled: false,
      encryptionEnabled: false,
      ...config
    }
  }

  // 初始化存档系统
  async initialize(): Promise<void> {
    try {
      // 检查LocalStorage支持
      this.checkLocalStorageSupport()
      
      // 验证现有存档
      await this.validateAllSaves()

      // 启动自动保存
      this.startAutoSave()

      this.emit('saveEvent', {
        type: 'save_completed',
        data: this.getAllSlots()
      } as SaveEvent)

    } catch (error) {
      console.error('存档系统初始化失败:', error)
      this.emit('saveEvent', {
        type: 'error',
        error: error as Error
      } as SaveEvent)
    }
  }

  // 检查LocalStorage支持
  private checkLocalStorageSupport(): void {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
    } catch (error) {
      throw new Error('LocalStorage不可用，无法保存游戏进度')
    }
  }

  // 验证所有存档
  private async validateAllSaves(): Promise<void> {
    const slots = this.getAllSlots()
    
    for (const slot of slots) {
      try {
        this.validateSaveData(slot.data)
      } catch (error) {
        console.warn(`存档槽 ${slot.id} 损坏，将被删除:`, error)
        this.deleteSlot(slot.id)
      }
    }
  }

  // 验证存档数据
  private validateSaveData(data: SaveData): void {
    if (!data.version) {
      throw new Error('存档数据缺少版本信息')
    }
    
    if (!data.timestamp) {
      throw new Error('存档数据缺少时间戳')
    }
    
    if (typeof data.currentLevel !== 'number' || data.currentLevel < 1) {
      throw new Error('存档数据关卡信息无效')
    }
    
    if (!data.score || typeof data.score.total !== 'number') {
      throw new Error('存档数据分数信息无效')
    }
    
    // 检查武器数据
    if (!Array.isArray(data.unlockedWeapons)) {
      throw new Error('存档数据武器信息无效')
    }
  }

  // 创建存档槽位
  createSlot(name: string, data?: SaveData): SaveSlot {
    const slotId = this.generateSlotId()
    const timestamp = new Date()
    
    const slot: SaveSlot = {
      id: slotId,
      name: name || `存档 ${slotId}`,
      lastModified: timestamp,
      data: data || this.createDefaultSaveData()
    }

    this.saveSlotToStorage(slot)
    return slot
  }

  // 创建默认存档数据
  private createDefaultSaveData(): SaveData {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      currentLevel: 1,
      highestLevel: 1,
      totalScore: 0,
      unlockedWeapons: ['pistol'],
      playTime: 0,
      achievements: []
    }
  }

  // 生成槽位ID
  private generateSlotId(): string {
    const slots = this.getAllSlots()
    const usedIds = new Set(slots.map(slot => slot.id))
    
    for (let i = 1; i <= this.config.maxSlots; i++) {
      const id = `slot_${i}`
      if (!usedIds.has(id)) {
        return id
      }
    }
    
    throw new Error('所有存档槽位已满')
  }

  // 保存到指定槽位
  async saveToSlot(slotId: string, gameStateManager: any): Promise<SaveSlot> {
    try {
      const existingSlot = this.getSlot(slotId)
      const saveData = this.createSaveDataFromGameState(gameStateManager)
      
      const slot: SaveSlot = {
        id: slotId,
        name: existingSlot?.name || `存档 ${slotId}`,
        lastModified: new Date(),
        data: saveData
      }

      this.saveSlotToStorage(slot)
      this.currentSlot = slot

      this.emit('saveEvent', {
        type: 'save_completed',
        slotId,
        data: saveData
      } as SaveEvent)

      return slot

    } catch (error) {
      console.error(`保存到槽位 ${slotId} 失败:`, error)
      this.emit('saveEvent', {
        type: 'error',
        slotId,
        error: error as Error
      } as SaveEvent)
      throw error
    }
  }

  // 从游戏状态管理器创建存档数据
  private createSaveDataFromGameState(gameStateManager: any): SaveData {
    const stateData = gameStateManager.getStateData()
    
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      currentLevel: stateData.currentLevel,
      highestLevel: Math.max(stateData.currentLevel, stateData.highestLevel || 1),
      totalScore: stateData.score.total,
      unlockedWeapons: [...stateData.unlockedWeapons],
      playTime: stateData.gameTime,
      achievements: [...stateData.achievements]
    }
  }

  // 从槽位加载
  async loadFromSlot(slotId: string): Promise<SaveData | null> {
    try {
      const slot = this.getSlot(slotId)
      if (!slot) {
        throw new Error(`存档槽位 ${slotId} 不存在`)
      }

      this.validateSaveData(slot.data)
      this.currentSlot = slot

      this.emit('saveEvent', {
        type: 'load_completed',
        slotId,
        data: slot.data
      } as SaveEvent)

      return slot.data

    } catch (error) {
      console.error(`从槽位 ${slotId} 加载失败:`, error)
      this.emit('saveEvent', {
        type: 'error',
        slotId,
        error: error as Error
      } as SaveEvent)
      throw error
    }
  }

  // 删除槽位
  deleteSlot(slotId: string): boolean {
    try {
      const storageKey = `${this.config.storageKey}_${slotId}`
      localStorage.removeItem(storageKey)
      
      if (this.currentSlot?.id === slotId) {
        this.currentSlot = null
      }

      this.emit('saveEvent', {
        type: 'delete_completed',
        slotId
      } as SaveEvent)

      return true

    } catch (error) {
      console.error(`删除槽位 ${slotId} 失败:`, error)
      this.emit('saveEvent', {
        type: 'error',
        slotId,
        error: error as Error
      } as SaveEvent)
      return false
    }
  }

  // 获取指定槽位
  getSlot(slotId: string): SaveSlot | null {
    try {
      const storageKey = `${this.config.storageKey}_${slotId}`
      const data = localStorage.getItem(storageKey)
      
      if (!data) return null

      const parsed = JSON.parse(data)
      return {
        id: slotId,
        name: parsed.name,
        lastModified: new Date(parsed.lastModified),
        data: parsed.data
      }

    } catch (error) {
      console.error(`获取槽位 ${slotId} 失败:`, error)
      return null
    }
  }

  // 获取所有槽位
  getAllSlots(): SaveSlot[] {
    const slots: SaveSlot[] = []
    
    for (let i = 1; i <= this.config.maxSlots; i++) {
      const slotId = `slot_${i}`
      const slot = this.getSlot(slotId)
      if (slot) {
        slots.push(slot)
      }
    }
    
    return slots.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  }

  // 保存槽位到存储
  private saveSlotToStorage(slot: SaveSlot): void {
    try {
      const storageKey = `${this.config.storageKey}_${slot.id}`
      const dataToSave = {
        name: slot.name,
        lastModified: slot.lastModified.toISOString(),
        data: slot.data
      }

      const serialized = this.serializeData(JSON.stringify(dataToSave))
      localStorage.setItem(storageKey, serialized)

    } catch (error) {
      throw new Error(`保存槽位到存储失败: ${error}`)
    }
  }

  // 数据序列化
  private serializeData(data: string): string {
    if (this.config.compressionEnabled) {
      // 这里可以添加压缩逻辑
      // return LZString.compressToUTF16(data)
    }
    
    if (this.config.encryptionEnabled) {
      // 这里可以添加加密逻辑
      // return CryptoJS.AES.encrypt(data, this.config.encryptionKey).toString()
    }
    
    return data
  }

  // 数据反序列化
  private deserializeData(data: string): string {
    try {
      if (this.config.encryptionEnabled) {
        // 这里可以添加解密逻辑
        // const decrypted = CryptoJS.AES.decrypt(data, this.config.encryptionKey)
        // data = decrypted.toString(CryptoJS.enc.Utf8)
      }
      
      if (this.config.compressionEnabled) {
        // 这里可以添加解压缩逻辑
        // return LZString.decompressFromUTF16(data)
      }
      
      return data
    } catch (error) {
      throw new Error(`数据反序列化失败: ${error}`)
    }
  }

  // 启动自动保存
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    
    this.autoSaveTimer = setInterval(() => {
      this.performAutoSave()
    }, this.config.autoSaveInterval)
  }

  // 执行自动保存
  private async performAutoSave(): Promise<void> {
    if (this.isAutoSaving || !this.currentSlot) {
      return
    }

    try {
      this.isAutoSaving = true
      // 这里需要传入游戏状态管理器，实际使用时会在游戏类中设置
      // await this.saveToSlot(this.currentSlot.id, gameStateManager)
    } catch (error) {
      console.warn('自动保存失败:', error)
    } finally {
      this.isAutoSaving = false
    }
  }

  // 停止自动保存
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  // 获取当前槽位
  getCurrentSlot(): SaveSlot | null {
    return this.currentSlot
  }

  // 设置当前槽位
  setCurrentSlot(slot: SaveSlot): void {
    this.currentSlot = slot
  }

  // 导出存档
  exportSave(slotId: string): string | null {
    try {
      const slot = this.getSlot(slotId)
      if (!slot) {
        throw new Error(`存档槽位 ${slotId} 不存在`)
      }

      const exportData = {
        slot: slot,
        exportDate: new Date().toISOString(),
        gameVersion: '1.0.0'
      }

      return JSON.stringify(exportData, null, 2)

    } catch (error) {
      console.error(`导出存档 ${slotId} 失败:`, error)
      return null
    }
  }

  // 导入存档
  importSave(saveString: string): SaveSlot | null {
    try {
      const importData = JSON.parse(saveString)
      
      if (!importData.slot || !importData.slot.data) {
        throw new Error('导入数据格式无效')
      }

      // 验证导入的数据
      this.validateSaveData(importData.slot.data)

      // 创建新槽位
      const slot = this.createSlot(importData.slot.name, importData.slot.data)
      
      return slot

    } catch (error) {
      console.error('导入存档失败:', error)
      this.emit('saveEvent', {
        type: 'error',
        error: error as Error
      } as SaveEvent)
      return null
    }
  }

  // 清理损坏的存档
  cleanupCorruptedSaves(): number {
    let cleaned = 0
    const slots = this.getAllSlots()
    
    for (const slot of slots) {
      try {
        this.validateSaveData(slot.data)
      } catch (error) {
        this.deleteSlot(slot.id)
        cleaned++
      }
    }
    
    return cleaned
  }

  // 获取存储使用情况
  getStorageInfo(): { used: number; available: number; total: number } {
    try {
      let used = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(this.config.storageKey)) {
          used += localStorage[key].length
        }
      }

      // 估算可用空间（通常是5-10MB）
      const available = 5 * 1024 * 1024 // 5MB估算值
      const total = used + available

      return { used, available, total }

    } catch (error) {
      console.error('获取存储信息失败:', error)
      return { used: 0, available: 0, total: 0 }
    }
  }

  // 设置配置
  setConfig(config: Partial<SaveConfig>): void {
    this.config = { ...this.config, ...config }
    
    // 如果自动保存间隔改变，重新启动定时器
    if (config.autoSaveInterval !== undefined) {
      this.startAutoSave()
    }
  }

  // 获取配置
  getConfig(): SaveConfig {
    return { ...this.config }
  }

  // 清理所有存档
  clearAllSaves(): void {
    const slots = this.getAllSlots()
    for (const slot of slots) {
      this.deleteSlot(slot.id)
    }
    
    this.currentSlot = null
  }

  // 清理
  destroy(): void {
    this.stopAutoSave()
    this.currentSlot = null
    super.destroy()
  }
}
