import { PhysicsEntity, Position, Vector2, BoundingBox } from '../../types/game'
import { Vector2 as Vec2, MathUtils } from '../../utils/math'
import { EventEmitter } from '../../services/event/EventEmitter'

// 碰撞检测结果
export interface Collision {
  entityA: PhysicsEntity
  entityB: PhysicsEntity
  normal: Vector2
  depth: number
  penetration: Vector2
}

// 物理世界边界
export interface WorldBounds {
  x: number
  y: number
  width: number
  height: number
}

// 物理系统事件
export interface PhysicsEvent {
  type: 'collision_start' | 'collision_end' | 'entity_moved'
  entityA?: PhysicsEntity
  entityB?: PhysicsEntity
  collision?: Collision
  entity?: PhysicsEntity
}

// 物理系统类
export class PhysicsSystem extends EventEmitter {
  private entities: Map<string, PhysicsEntity> = new Map()
  private collisionPairs: Set<string> = new Set()
  private worldBounds: WorldBounds
  private gravity: Vector2 = { x: 0, y: 980 } // 重力加速度 (px/s²)
  private airResistance: number = 0.98 // 空气阻力

  constructor(worldBounds: WorldBounds) {
    super()
    this.worldBounds = worldBounds
  }

  // 添加物理实体
  addEntity(entity: PhysicsEntity): void {
    this.entities.set(entity.id, entity)
  }

  // 移除物理实体
  removeEntity(id: string): void {
    const entity = this.entities.get(id)
    if (entity) {
      this.entities.delete(id)
      // 清理碰撞对
      this.collisionPairs.forEach(pairKey => {
        if (pairKey.includes(id)) {
          this.collisionPairs.delete(pairKey)
        }
      })
    }
  }

  // 获取物理实体
  getEntity(id: string): PhysicsEntity | undefined {
    return this.entities.get(id)
  }

  // 获取所有实体
  getAllEntities(): PhysicsEntity[] {
    return Array.from(this.entities.values())
  }

  // 更新物理系统
  update(deltaTime: number): void {
    // 限制deltaTime防止物理穿透
    const maxDelta = 1 / 30 // 最大30fps
    const clampedDelta = Math.min(deltaTime, maxDelta)

    // 更新所有实体
    for (const entity of this.entities.values()) {
      this.updateEntity(entity, clampedDelta)
    }

    // 碰撞检测
    this.detectCollisions()

    // 触发事件
    this.emit('physicsUpdate', { deltaTime: clampedDelta })
  }

  // 更新单个实体
  private updateEntity(entity: PhysicsEntity, deltaTime: number): void {
    if (entity.static) return

    // 应用重力（如果实体有质量）
    if (entity.mass > 0) {
      entity.velocity.x += this.gravity.x * deltaTime
      entity.velocity.y += this.gravity.y * deltaTime
    }

    // 应用空气阻力
    entity.velocity.x *= this.airResistance
    entity.velocity.y *= this.airResistance

    // 更新位置
    const newX = entity.position.x + entity.velocity.x * deltaTime
    const newY = entity.position.y + entity.velocity.y * deltaTime
    entity.position.x = newX
    entity.position.y = newY

    // 世界边界碰撞检测
    this.checkWorldBounds(entity)
  }

  // 世界边界碰撞检测
  private checkWorldBounds(entity: PhysicsEntity): void {
    const bounds = this.getEntityBounds(entity)

    // 左边界
    if (bounds.x < this.worldBounds.x) {
      entity.position.x = this.worldBounds.x
      entity.velocity.x = Math.max(0, -entity.velocity.x * 0.8) // 反弹
    }

    // 右边界
    if (bounds.x + bounds.width > this.worldBounds.x + this.worldBounds.width) {
      entity.position.x = this.worldBounds.x + this.worldBounds.width - bounds.width
      entity.velocity.x = Math.min(0, -entity.velocity.x * 0.8) // 反弹
    }

    // 上边界
    if (bounds.y < this.worldBounds.y) {
      entity.position.y = this.worldBounds.y
      entity.velocity.y = Math.max(0, -entity.velocity.y * 0.8) // 反弹
    }

    // 下边界
    if (bounds.y + bounds.height > this.worldBounds.y + this.worldBounds.height) {
      entity.position.y = this.worldBounds.y + this.worldBounds.height - bounds.height
      entity.velocity.y = Math.min(0, -entity.velocity.y * 0.8) // 反弹
    }
  }

  // 获取实体边界框
  getEntityBounds(entity: PhysicsEntity): BoundingBox {
    return {
      x: entity.position.x - entity.size.width / 2,
      y: entity.position.y - entity.size.height / 2,
      width: entity.size.width,
      height: entity.size.height
    }
  }

  // 检测碰撞
  private detectCollisions(): void {
    const entityList = Array.from(this.entities.values())
    const newPairs = new Set<string>()

    // 遍历所有实体对
    for (let i = 0; i < entityList.length; i++) {
      for (let j = i + 1; j < entityList.length; j++) {
        const entityA = entityList[i]
        const entityB = entityList[j]

        // 跳过静态实体之间的碰撞
        if (entityA.static && entityB.static) continue

        const collision = this.checkCollision(entityA, entityB)
        if (collision) {
          const pairKey = this.createPairKey(entityA.id, entityB.id)
          newPairs.add(pairKey)

          // 检查是否是新的碰撞对
          if (!this.collisionPairs.has(pairKey)) {
            this.handleCollisionStart(collision)
          }

          // 处理碰撞
          this.resolveCollision(collision)
        }
      }
    }

    // 清理不再存在的碰撞对
    this.collisionPairs.forEach(pairKey => {
      if (!newPairs.has(pairKey)) {
        this.handleCollisionEnd(pairKey)
      }
    })

    this.collisionPairs = newPairs
  }

  // 创建碰撞对键
  private createPairKey(idA: string, idB: string): string {
    return [idA, idB].sort().join('-')
  }

  // 检查两个实体是否碰撞
  private checkCollision(entityA: PhysicsEntity, entityB: PhysicsEntity): Collision | null {
    const boundsA = this.getEntityBounds(entityA)
    const boundsB = this.getEntityBounds(entityB)

    // 矩形碰撞检测
    if (!MathUtils.rectsIntersect(boundsA, boundsB)) {
      return null
    }

    // 计算碰撞深度和法向量
    const centerA = {
      x: boundsA.x + boundsA.width / 2,
      y: boundsA.y + boundsA.height / 2
    }
    const centerB = {
      x: boundsB.x + boundsB.width / 2,
      y: boundsB.y + boundsB.height / 2
    }

    const deltaX = centerB.x - centerA.x
    const deltaY = centerB.y - centerA.y

    const overlapX = (boundsA.width / 2 + boundsB.width / 2) - Math.abs(deltaX)
    const overlapY = (boundsA.height / 2 + boundsB.height / 2) - Math.abs(deltaY)

    if (overlapX < 0 || overlapY < 0) {
      return null
    }

    // 确定碰撞法向量和深度
    let normal: Vector2
    let depth: number
    let penetration: Vector2

    if (overlapX < overlapY) {
      normal = { x: Math.sign(deltaX), y: 0 }
      depth = overlapX
      penetration = { x: normal.x * depth, y: 0 }
    } else {
      normal = { x: 0, y: Math.sign(deltaY) }
      depth = overlapY
      penetration = { x: 0, y: normal.y * depth }
    }

    return {
      entityA,
      entityB,
      normal,
      depth,
      penetration
    }
  }

  // 处理碰撞开始
  private handleCollisionStart(collision: Collision): void {
    const event: PhysicsEvent = {
      type: 'collision_start',
      entityA: collision.entityA,
      entityB: collision.entityB,
      collision
    }
    this.emit('collisionStart', event)
  }

  // 处理碰撞结束
  private handleCollisionEnd(pairKey: string): void {
    const [idA, idB] = pairKey.split('-')
    const entityA = this.entities.get(idA)
    const entityB = this.entities.get(idB)

    if (entityA && entityB) {
      const event: PhysicsEvent = {
        type: 'collision_end',
        entityA,
        entityB
      }
      this.emit('collisionEnd', event)
    }
  }

  // 解决碰撞
  private resolveCollision(collision: Collision): void {
    const { entityA, entityB, penetration, normal } = collision

    // 计算总质量
    const totalMass = entityA.mass + entityB.mass
    if (totalMass === 0) return

    // 按质量分配分离
    const separationA = (entityB.mass / totalMass)
    const separationB = (entityA.mass / totalMass)

    // 分离实体
    if (!entityA.static) {
      entityA.position.x -= normal.x * penetration.x * separationA
      entityA.position.y -= normal.y * penetration.y * separationA
    }

    if (!entityB.static) {
      entityB.position.x += normal.x * penetration.x * separationB
      entityB.position.y += normal.y * penetration.y * separationB
    }

    // 计算相对速度
    const relativeVelocity = {
      x: entityB.velocity.x - entityA.velocity.x,
      y: entityB.velocity.y - entityA.velocity.y
    }

    // 计算相对速度在法向量方向上的分量
    const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y

    // 如果实体正在分离，则不需要处理
    if (velocityAlongNormal > 0) return

    // 计算弹性系数
    const restitution = 0.8 // 弹性系数

    // 计算冲量
    const impulse = -(1 + restitution) * velocityAlongNormal / (1 / entityA.mass + 1 / entityB.mass)

    // 应用冲量
    const impulseVector = {
      x: impulse * normal.x,
      y: impulse * normal.y
    }

    if (!entityA.static) {
      entityA.velocity.x -= impulseVector.x / entityA.mass
      entityA.velocity.y -= impulseVector.y / entityA.mass
    }

    if (!entityB.static) {
      entityB.velocity.x += impulseVector.x / entityB.mass
      entityB.velocity.y += impulseVector.y / entityB.mass
    }

    // 调用碰撞回调
    if (entityA.onCollision) {
      entityA.onCollision(entityB)
    }
    if (entityB.onCollision) {
      entityB.onCollision(entityA)
    }
  }

  // 应用力
  applyForce(entityId: string, force: Vector2): void {
    const entity = this.entities.get(entityId)
    if (entity && !entity.static) {
      // F = ma, so a = F/m
      entity.velocity.x += force.x / entity.mass
      entity.velocity.y += force.y / entity.mass
    }
  }

  // 应用冲量
  applyImpulse(entityId: string, impulse: Vector2): void {
    const entity = this.entities.get(entityId)
    if (entity && !entity.static) {
      entity.velocity.x += impulse.x / entity.mass
      entity.velocity.y += impulse.y / entity.mass
    }
  }

  // 设置重力
  setGravity(gravity: Vector2): void {
    this.gravity = gravity
  }

  // 获取重力
  getGravity(): Vector2 {
    return { ...this.gravity }
  }

  // 空间查询：根据边界框查询实体
  queryAABB(bounds: BoundingBox): PhysicsEntity[] {
    const result: PhysicsEntity[] = []
    
    for (const entity of this.entities.values()) {
      const entityBounds = this.getEntityBounds(entity)
      if (MathUtils.rectsIntersect(bounds, entityBounds)) {
        result.push(entity)
      }
    }
    
    return result
  }

  // 空间查询：根据点查询实体
  queryPoint(point: Position): PhysicsEntity[] {
    const bounds: BoundingBox = {
      x: point.x,
      y: point.y,
      width: 0,
      height: 0
    }
    return this.queryAABB(bounds)
  }

  // 设置世界边界
  setWorldBounds(bounds: WorldBounds): void {
    this.worldBounds = bounds
  }

  // 获取世界边界
  getWorldBounds(): WorldBounds {
    return { ...this.worldBounds }
  }

  // 清理
  destroy(): void {
    this.entities.clear()
    this.collisionPairs.clear()
    super.destroy()
  }
}
