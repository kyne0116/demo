import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',        // 待确认
  MAKING = 'making',          // 制作中
  READY = 'ready',           // 制作完成待取
  COMPLETED = 'completed',    // 已完成
  CANCELLED = 'cancelled',    // 已取消
}

export enum ProductionStage {
  NOT_STARTED = 'not_started',    // 未开始
  PREPARING = 'preparing',        // 准备中
  MIXING = 'mixing',              // 调制中
  FINISHING = 'finishing',        // 完成制作
  QUALITY_CHECK = 'quality_check', // 质检中
  READY_FOR_PICKUP = 'ready_for_pickup', // 待取餐
}

export enum OrderPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
  RUSH = 'rush',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  staffId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;

  @Column({ default: 0 })
  pointsUsed: number;

  @Column({ default: 0 })
  pointsEarned: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: ProductionStage,
    default: ProductionStage.NOT_STARTED,
  })
  productionStage: ProductionStage;

  @Column({
    type: 'enum',
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
  })
  priority: OrderPriority;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  customerPhone?: string;

  @Column({ nullable: true })
  pickupTime?: Date;

  @Column({ type: 'int', default: 0 })
  estimatedWaitTime: number; // 预估等待时间（分钟）

  @Column({ type: 'int', default: 0 })
  actualWaitTime: number; // 实际等待时间（分钟）

  @Column({ nullable: true })
  assignedTo?: string; // 分配的制作人员ID

  @Column({ type: 'timestamp', nullable: true })
  makingStartedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  makingCompletedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  readyAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  qualityNotes?: string; // 质量检查备注

  @Column({ type: 'int', default: 0 })
  rating: number; // 客户评分 1-5

  @Column({ type: 'text', nullable: true })
  feedback?: string; // 客户反馈

  // 关系
  @OneToMany(() => OrderItem, item => item.product)
  orderItems: OrderItem[];

  // 计算属性
  get totalItems(): number {
    return this.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  get estimatedCompletionTime(): Date {
    const estimatedTime = this.estimatedWaitTime || 10; // 默认10分钟
    return new Date(this.createdAt.getTime() + estimatedTime * 60000);
  }

  get isOverdue(): boolean {
    if (this.status === OrderStatus.COMPLETED || this.status === OrderStatus.CANCELLED) {
      return false;
    }
    return new Date() > this.estimatedCompletionTime;
  }

  get waitTimeInMinutes(): number {
    return Math.floor((new Date().getTime() - this.createdAt.getTime()) / 60000);
  }

  get productionProgress(): number {
    const stages = Object.values(ProductionStage);
    const currentIndex = stages.indexOf(this.productionStage);
    return ((currentIndex + 1) / stages.length) * 100;
  }
}