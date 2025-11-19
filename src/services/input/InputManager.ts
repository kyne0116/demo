import { InputEventType, Position } from '../../types/game'
import { EventEmitter } from '../event/EventEmitter'

// 输入事件接口
export interface InputEvent {
  type: InputEventType
  key?: string
  mouseX?: number
  mouseY?: number
  delta?: number
  timestamp: number
}

// 输入映射配置
export interface InputMapping {
  [action: string]: string[]
}

// 输入管理器类
export class InputManager extends EventEmitter {
  private keys: Map<string, boolean>
  private keysPressed: Set<string>
  private mousePosition: Position
  private mouseButtons: Map<number, boolean>
  private mouseButtonsPressed: Set<number>
  private inputMapping: InputMapping
  private canvas: HTMLCanvasElement | null = null

  constructor() {
    super()
    this.keys = new Map()
    this.keysPressed = new Set()
    this.mousePosition = { x: 0, y: 0 }
    this.mouseButtons = new Map()
    this.mouseButtonsPressed = new Set()
    this.inputMapping = this.createDefaultMapping()
    
    this.initializeEventListeners()
  }

  // 创建默认输入映射
  private createDefaultMapping(): InputMapping {
    return {
      // 移动
      moveUp: ['w', 'W', 'ArrowUp'],
      moveDown: ['s', 'S', 'ArrowDown'],
      moveLeft: ['a', 'A', 'ArrowLeft'],
      moveRight: ['d', 'D', 'ArrowRight'],
      
      // 动作
      jump: [' ', 'Spacebar'], // 空格键
      shoot: ['j', 'J', 'Mouse0'], // J键或鼠标左键
      reload: ['r', 'R'],
      
      // 游戏控制
      pause: ['Escape', 'p', 'P'],
      start: ['Enter'],
      restart: ['Enter'],
      
      // 菜单导航
      menuUp: ['ArrowUp', 'w', 'W'],
      menuDown: ['ArrowDown', 's', 'S'],
      menuLeft: ['ArrowLeft', 'a', 'A'],
      menuRight: ['ArrowRight', 'd', 'D'],
      menuSelect: ['Enter', ' '],
      menuBack: ['Escape']
    }
  }

  // 初始化事件监听器
  private initializeEventListeners(): void {
    // 键盘事件
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    
    // 鼠标事件
    window.addEventListener('mousedown', this.handleMouseDown.bind(this))
    window.addEventListener('mouseup', this.handleMouseUp.bind(this))
    window.addEventListener('mousemove', this.handleMouseMove.bind(this))
    window.addEventListener('wheel', this.handleWheel.bind(this))
    
    // 防止上下文菜单
    window.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  // 设置Canvas元素（用于鼠标坐标计算）
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
  }

  // 处理键盘按下事件
  private handleKeyDown(event: KeyboardEvent): void {
    event.preventDefault()
    
    const key = event.key
    if (!this.keys.get(key)) {
      this.keysPressed.add(key)
      this.keys.set(key, true)
      
      // 触发输入事件
      const inputEvent: InputEvent = {
        type: InputEventType.KEY_DOWN,
        key,
        timestamp: Date.now()
      }
      
      this.emit('input', inputEvent)
    }
  }

  // 处理键盘释放事件
  private handleKeyUp(event: KeyboardEvent): void {
    event.preventDefault()
    
    const key = event.key
    this.keys.set(key, false)
    
    // 触发输入事件
    const inputEvent: InputEvent = {
      type: InputEventType.KEY_UP,
      key,
      timestamp: Date.now()
    }
    
    this.emit('input', inputEvent)
  }

  // 处理鼠标按下事件
  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault()
    
    const button = event.button
    if (!this.mouseButtons.get(button)) {
      this.mouseButtonsPressed.add(button)
      this.mouseButtons.set(button, true)
      
      // 触发输入事件
      const inputEvent: InputEvent = {
        type: InputEventType.MOUSE_DOWN,
        key: `Mouse${button}`,
        mouseX: event.clientX,
        mouseY: event.clientY,
        timestamp: Date.now()
      }
      
      this.emit('input', inputEvent)
    }
  }

  // 处理鼠标释放事件
  private handleMouseUp(event: MouseEvent): void {
    event.preventDefault()
    
    const button = event.button
    this.mouseButtons.set(button, false)
    
    // 触发输入事件
    const inputEvent: InputEvent = {
      type: InputEventType.MOUSE_UP,
      key: `Mouse${button}`,
      mouseX: event.clientX,
      mouseY: event.clientY,
      timestamp: Date.now()
    }
    
    this.emit('input', inputEvent)
  }

  // 处理鼠标移动事件
  private handleMouseMove(event: MouseEvent): void {
    // 计算鼠标相对于Canvas的位置
    const rect = this.canvas?.getBoundingClientRect()
    if (rect) {
      this.mousePosition.x = event.clientX - rect.left
      this.mousePosition.y = event.clientY - rect.top
    } else {
      this.mousePosition.x = event.clientX
      this.mousePosition.y = event.clientY
    }
    
    // 触发输入事件
    const inputEvent: InputEvent = {
      type: InputEventType.MOUSE_MOVE,
      mouseX: this.mousePosition.x,
      mouseY: this.mousePosition.y,
      timestamp: Date.now()
    }
    
    this.emit('input', inputEvent)
  }

  // 处理鼠标滚轮事件
  private handleWheel(event: WheelEvent): void {
    event.preventDefault()
    
    const inputEvent: InputEvent = {
      type: InputEventType.MOUSE_MOVE,
      delta: event.deltaY,
      mouseX: this.mousePosition.x,
      mouseY: this.mousePosition.y,
      timestamp: Date.now()
    }
    
    this.emit('input', inputEvent)
  }

  // 检查按键是否被按下（持续按下）
  isKeyDown(key: string): boolean {
    return this.keys.get(key) || false
  }

  // 检查按键是否刚刚被按下（一次性）
  isKeyPressed(key: string): boolean {
    if (this.keysPressed.has(key)) {
      this.keysPressed.delete(key)
      return true
    }
    return false
  }

  // 检查鼠标按钮是否被按下（持续按下）
  isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.get(button) || false
  }

  // 检查鼠标按钮是否刚刚被按下（一次性）
  isMouseButtonPressed(button: number): boolean {
    if (this.mouseButtonsPressed.has(button)) {
      this.mouseButtonsPressed.delete(button)
      return true
    }
    return false
  }

  // 获取鼠标位置
  getMousePosition(): Position {
    return { ...this.mousePosition }
  }

  // 检查动作是否被触发
  getAction(action: string): boolean {
    const keys = this.inputMapping[action] || []
    for (const key of keys) {
      if (this.isKeyDown(key)) {
        return true
      }
      // 检查鼠标按钮
      if (key.startsWith('Mouse')) {
        const button = parseInt(key.replace('Mouse', ''))
        if (this.isMouseButtonDown(button)) {
          return true
        }
      }
    }
    return false
  }

  // 检查动作是否刚刚被触发
  getActionPressed(action: string): boolean {
    const keys = this.inputMapping[action] || []
    for (const key of keys) {
      if (this.isKeyPressed(key)) {
        return true
      }
      // 检查鼠标按钮
      if (key.startsWith('Mouse')) {
        const button = parseInt(key.replace('Mouse', ''))
        if (this.isMouseButtonPressed(button)) {
          return true
        }
      }
    }
    return false
  }

  // 设置输入映射
  setKeyMapping(action: string, keys: string[]): void {
    this.inputMapping[action] = keys
  }

  // 获取所有按下的按键（用于调试）
  getPressedKeys(): string[] {
    return Array.from(this.keys.keys()).filter(key => this.keys.get(key))
  }

  // 获取所有刚刚按下的按键（用于调试）
  getJustPressedKeys(): string[] {
    return Array.from(this.keysPressed)
  }

  // 清理输入状态
  clearInput(): void {
    this.keys.clear()
    this.keysPressed.clear()
    this.mouseButtons.clear()
    this.mouseButtonsPressed.clear()
  }

  // 销毁事件监听器
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    window.removeEventListener('wheel', this.handleWheel.bind(this))
    
    super.destroy()
  }
}
