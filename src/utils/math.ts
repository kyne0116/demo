import { Vector2 as IVector2, Position } from '../types/game'

// 向量2D类
export class Vector2 implements IVector2 {
  x: number
  y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  // 创建零向量
  static zero(): Vector2 {
    return new Vector2(0, 0)
  }

  // 创建单位向量
  static one(): Vector2 {
    return new Vector2(1, 1)
  }

  // 创建向上向量
  static up(): Vector2 {
    return new Vector2(0, -1)
  }

  // 创建向下向量
  static down(): Vector2 {
    return new Vector2(0, 1)
  }

  // 创建向左向量
  static left(): Vector2 {
    return new Vector2(-1, 0)
  }

  // 创建向右向量
  static right(): Vector2 {
    return new Vector2(1, 0)
  }

  // 向量加法
  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y)
  }

  // 向量减法
  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y)
  }

  // 向量乘法（标量）
  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar)
  }

  // 向量除法（标量）
  divide(scalar: number): Vector2 {
    if (scalar === 0) {
      throw new Error('不能除以零')
    }
    return new Vector2(this.x / scalar, this.y / scalar)
  }

  // 计算向量长度
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  // 计算向量平方长度（避免开方运算）
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y
  }

  // 向量归一化
  normalized(): Vector2 {
    const mag = this.magnitude()
    if (mag === 0) {
      return Vector2.zero()
    }
    return this.divide(mag)
  }

  // 计算两个向量的距离
  distance(other: Vector2): number {
    return this.subtract(other).magnitude()
  }

  // 计算平方距离（避免开方运算）
  distanceSquared(other: Vector2): number {
    return this.subtract(other).magnitudeSquared()
  }

  // 向量点积
  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y
  }

  // 向量叉积（2D中的z分量）
  cross(other: Vector2): number {
    return this.x * other.y - this.y * other.x
  }

  // 向量插值
  lerp(other: Vector2, t: number): Vector2 {
    t = Math.max(0, Math.min(1, t)) // 限制t在[0,1]范围内
    return new Vector2(
      this.x + (other.x - this.x) * t,
      this.y + (other.y - this.y) * t
    )
  }

  // 向量旋转
  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    )
  }

  // 获取角度（弧度）
  angle(): number {
    return Math.atan2(this.y, this.x)
  }

  // 复制向量
  clone(): Vector2 {
    return new Vector2(this.x, this.y)
  }

  // 比较向量是否相等
  equals(other: Vector2, epsilon: number = 0.0001): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon
    )
  }

  // 设置向量值
  set(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  // 字符串表示
  toString(): string {
    return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`
  }
}

// 数学工具类
export class MathUtils {
  // 角度转换：度转弧度
  static degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  // 角度转换：弧度转度
  static radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI
  }

  // 线性插值
  static lerp(start: number, end: number, t: number): number {
    t = Math.max(0, Math.min(1, t)) // 限制t在[0,1]范围内
    return start + (end - start) * t
  }

  // 值限制
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  // 值映射
  static map(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number {
    return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin)
  }

  // 随机数生成
  static random(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // 数值平滑
  static smoothStep(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return t * t * (3 - 2 * t)
  }

  static smootherStep(t: number): number {
    t = Math.max(0, Math.min(1, t))
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  // 近似相等判断
  static approximately(a: number, b: number, epsilon: number = 0.0001): boolean {
    return Math.abs(a - b) < epsilon
  }

  // 符号函数
  static sign(value: number): number {
    if (value > 0) return 1
    if (value < 0) return -1
    return 0
  }

  // 角度插值（考虑角度的周期性）
  static lerpAngle(start: number, end: number, t: number): number {
    // 将角度差值限制在[-π, π]范围内
    let delta = end - start
    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta < -Math.PI) delta += Math.PI * 2
    
    return start + delta * this.clamp(t, 0, 1)
  }

  // 计算两点间角度
  static angle(from: Position, to: Position): number {
    return Math.atan2(to.y - from.y, to.x - from.x)
  }

  // 向量从角度生成
  static vectorFromAngle(angle: number, magnitude: number = 1): Vector2 {
    return new Vector2(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    )
  }

  // 检查点是否在矩形内
  static pointInRect(
    point: Position,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    )
  }

  // 检查矩形是否相交
  static rectsIntersect(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    )
  }

  // 碰撞检测：圆与矩形
  static circleRectCollision(
    circle: { x: number; y: number; radius: number },
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    const closestX = this.clamp(circle.x, rect.x, rect.x + rect.width)
    const closestY = this.clamp(circle.y, rect.y, rect.y + rect.height)
    
    const distanceX = circle.x - closestX
    const distanceY = circle.y - closestY
    const distanceSquared = distanceX * distanceX + distanceY * distanceY
    
    return distanceSquared < circle.radius * circle.radius
  }

  // 碰撞检测：圆与圆
  static circleCircleCollision(
    circle1: { x: number; y: number; radius: number },
    circle2: { x: number; y: number; radius: number }
  ): boolean {
    const distanceX = circle1.x - circle2.x
    const distanceY = circle1.y - circle2.y
    const distanceSquared = distanceX * distanceX + distanceY * distanceY
    const radiusSum = circle1.radius + circle2.radius
    
    return distanceSquared < radiusSum * radiusSum
  }
}
