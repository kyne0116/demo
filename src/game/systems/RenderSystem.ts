import { GameEntity, Position, Size } from '../../types/game'
import { Vector2 as Vec2, MathUtils } from '../../utils/math'
import { EventEmitter } from '../../services/event/EventEmitter'

// 可渲染对象接口
export interface Renderable {
  id: string
  position: Position
  size: Size
  zIndex: number
  visible: boolean
  opacity: number
  sprite?: string
  color?: string
  rotation: number
  scale: number

  render(ctx: CanvasRenderingContext2D, camera: Camera): void
  getBounds(): { x: number; y: number; width: number; height: number }
}

// 相机接口
export interface Camera {
  position: Position
  zoom: number
  width: number
  height: number
  target?: GameEntity

  // 相机控制
  follow(target: Position): void
  setBounds(bounds: { x: number; y: number; width: number; height: number }): void
  worldToScreen(worldPos: Position): Position
  screenToWorld(screenPos: Position): Position
  
  // 相机移动
  move(x: number, y: number): void
  setPosition(x: number, y: number): void
  
  // 缩放控制
  setZoom(zoom: number): void
  getZoom(): number
  
  // 获取视口
  getViewBounds(): { x: number; y: number; width: number; height: number }
}

// 相机类
export class CameraImpl implements Camera {
  position: Position
  zoom: number
  width: number
  height: number
  target?: GameEntity
  private bounds: { x: number; y: number; width: number; height: number }
  private smoothing: number = 0.1 // 相机跟随平滑度

  constructor(x: number, y: number, width: number, height: number, zoom: number = 1) {
    this.position = { x, y }
    this.zoom = zoom
    this.width = width
    this.height = height
    this.bounds = { x: 0, y: 0, width: width, height: height }
  }

  follow(target: Position): void {
    if (this.target) {
      // 平滑跟随
      const targetX = target.x
      const targetY = target.y
      
      this.position.x += (targetX - this.position.x) * this.smoothing
      this.position.y += (targetY - this.position.y) * this.smoothing
      
      // 限制在边界内
      this.constrainToBounds()
    }
  }

  setBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    this.bounds = bounds
  }

  worldToScreen(worldPos: Position): Position {
    return {
      x: (worldPos.x - this.position.x) * this.zoom,
      y: (worldPos.y - this.position.y) * this.zoom
    }
  }

  screenToWorld(screenPos: Position): Position {
    return {
      x: screenPos.x / this.zoom + this.position.x,
      y: screenPos.y / this.zoom + this.position.y
    }
  }

  move(x: number, y: number): void {
    this.position.x += x
    this.position.y += y
    this.constrainToBounds()
  }

  setPosition(x: number, y: number): void {
    this.position.x = x
    this.position.y = y
    this.constrainToBounds()
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(5, zoom)) // 限制缩放范围
  }

  getZoom(): number {
    return this.zoom
  }

  getViewBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x - (this.width / 2) / this.zoom,
      y: this.position.y - (this.height / 2) / this.zoom,
      width: this.width / this.zoom,
      height: this.height / this.zoom
    }
  }

  private constrainToBounds(): void {
    const viewBounds = this.getViewBounds()
    
    if (viewBounds.x < this.bounds.x) {
      this.position.x = this.bounds.x + (this.width / 2) / this.zoom
    }
    if (viewBounds.y < this.bounds.y) {
      this.position.y = this.bounds.y + (this.height / 2) / this.zoom
    }
    if (viewBounds.x + viewBounds.width > this.bounds.x + this.bounds.width) {
      this.position.x = this.bounds.x + this.bounds.width - (this.width / 2) / this.zoom
    }
    if (viewBounds.y + viewBounds.height > this.bounds.y + this.bounds.height) {
      this.position.y = this.bounds.y + this.bounds.height - (this.height / 2) / this.zoom
    }
  }
}

// 渲染系统事件
export interface RenderEvent {
  type: 'frame_start' | 'frame_end' | 'render_complete'
  fps: number
  frameTime: number
}

// 渲染系统类
export class RenderSystem extends EventEmitter {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private renderables: Map<string, Renderable> = new Map()
  private camera: CameraImpl
  private backgroundColor: string = '#1a1a2e'
  private fps: number = 60
  private frameTime: number = 0
  private lastFrameTime: number = 0
  private smoothedFPS: number = 60
  private fpsSmoothing: number = 0.9 // FPS平滑系数

  constructor(canvas: HTMLCanvasElement, camera: CameraImpl) {
    super()
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    
    if (!this.ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }
    
    this.camera = camera
    this.initialize()
  }

  private initialize(): void {
    // 设置Canvas属性
    this.canvas.width = this.camera.width
    this.canvas.height = this.camera.height
    
    // 配置渲染上下文
    this.ctx.imageSmoothingEnabled = true
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.font = '16px monospace'
  }

  // 初始化Canvas
  initialize(canvas?: HTMLCanvasElement): void {
    if (canvas) {
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')!
    }
    
    this.initialize()
  }

  // 调整Canvas大小
  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.camera.width = width
    this.camera.height = height
  }

  // 添加渲染对象
  addObject(obj: Renderable): void {
    this.renderables.set(obj.id, obj)
  }

  // 移除渲染对象
  removeObject(id: string): void {
    this.renderables.delete(id)
  }

  // 获取渲染对象
  getObject(id: string): Renderable | undefined {
    return this.renderables.get(id)
  }

  // 设置相机
  setCamera(camera: Camera): void {
    if (camera instanceof CameraImpl) {
      this.camera = camera
    }
  }

  // 获取相机
  getCamera(): CameraImpl {
    return this.camera
  }

  // 渲染循环
  render(deltaTime?: number): void {
    const now = performance.now()
    
    // 计算FPS
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime
      this.frameTime = frameTime
      this.fps = 1000 / frameTime
      this.smoothedFPS = this.smoothedFPS * this.fpsSmoothing + this.fps * (1 - this.fpsSmoothing)
    }
    this.lastFrameTime = now

    // 触发帧开始事件
    this.emit('frameStart', { fps: this.smoothedFPS, frameTime: this.frameTime })

    // 清空画布
    this.clear()

    // 设置相机变换
    this.setupCamera()

    // 渲染所有对象（按z-index排序）
    this.renderObjects()

    // 重置变换
    this.resetTransform()

    // 触发帧结束事件
    this.emit('frameEnd', { fps: this.smoothedFPS, frameTime: this.frameTime })
  }

  // 清空画布
  private clear(): void {
    this.ctx.fillStyle = this.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 设置相机变换
  private setupCamera(): void {
    this.ctx.save()
    
    // 相机位置和缩放
    this.ctx.translate(
      this.canvas.width / 2 - this.camera.position.x * this.camera.zoom,
      this.canvas.height / 2 - this.camera.position.y * this.camera.zoom
    )
    this.ctx.scale(this.camera.zoom, this.camera.zoom)
  }

  // 重置变换
  private resetTransform(): void {
    this.ctx.restore()
  }

  // 渲染对象
  private renderObjects(): void {
    // 按z-index排序
    const sortedObjects = Array.from(this.renderables.values())
      .sort((a, b) => a.zIndex - b.zIndex)

    // 视锥剔除
    const viewBounds = this.camera.getViewBounds()
    const visibleObjects = sortedObjects.filter(obj => {
      if (!obj.visible) return false
      
      const bounds = obj.getBounds()
      return MathUtils.rectsIntersect(bounds, viewBounds)
    })

    // 渲染可见对象
    for (const obj of visibleObjects) {
      obj.render(this.ctx, this.camera)
    }
  }

  // 设置背景颜色
  setBackgroundColor(color: string): void {
    this.backgroundColor = color
  }

  // 获取当前FPS
  getFPS(): number {
    return this.smoothedFPS
  }

  // 获取帧时间
  getFrameTime(): number {
    return this.frameTime
  }

  // 渲染调试信息
  renderDebugInfo(): void {
    this.resetTransform()
    
    this.ctx.fillStyle = 'white'
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`FPS: ${Math.round(this.smoothedFPS)}`, 10, 20)
    this.ctx.fillText(`Camera: (${Math.round(this.camera.position.x)}, ${Math.round(this.camera.position.y)})`, 10, 35)
    this.ctx.fillText(`Zoom: ${this.camera.getZoom().toFixed(2)}`, 10, 50)
  }

  // 渲染边框
  renderBorder(color: string = '#333', lineWidth: number = 2): void {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 渲染网格
  renderGrid(cellSize: number = 50, color: string = '#444', lineWidth: number = 1): void {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth

    // 渲染垂直线
    for (let x = 0; x <= this.canvas.width; x += cellSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
      this.ctx.stroke()
    }

    // 渲染水平线
    for (let y = 0; y <= this.canvas.height; y += cellSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }
  }

  // 获取所有渲染对象
  getAllObjects(): Renderable[] {
    return Array.from(this.renderables.values())
  }

  // 按z-index范围获取对象
  getObjectsInZRange(minZ: number, maxZ: number): Renderable[] {
    return this.getAllObjects().filter(obj => 
      obj.zIndex >= minZ && obj.zIndex <= maxZ
    )
  }

  // 按位置获取对象
  getObjectsAtPosition(position: Position): Renderable[] {
    const result: Renderable[] = []
    
    for (const obj of this.renderables.values()) {
      const bounds = obj.getBounds()
      if (MathUtils.pointInRect(position, bounds)) {
        result.push(obj)
      }
    }
    
    return result
  }

  // 清理
  destroy(): void {
    this.renderables.clear()
    super.destroy()
  }
}
