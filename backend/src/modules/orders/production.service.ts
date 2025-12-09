import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, ProductionStage, OrderPriority } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

export interface ProductionStep {
  stage: ProductionStage;
  name: string;
  description: string;
  estimatedTime: number; // 分钟
  required: boolean;
}

export interface ProductionProgress {
  orderId: string;
  currentStage: ProductionStage;
  progress: number;
  estimatedTimeRemaining: number;
  actualTimeSpent: number;
  canStartNext: boolean;
  blockers: string[];
}

export interface OrderQueue {
  pending: Order[];
  making: Order[];
  ready: Order[];
  overdue: Order[];
}

@Injectable()
export class ProductionService {
  private readonly productionSteps: ProductionStep[] = [
    {
      stage: ProductionStage.PREPARING,
      name: '准备',
      description: '准备原料和设备',
      estimatedTime: 2,
      required: true,
    },
    {
      stage: ProductionStage.MIXING,
      name: '调制',
      description: '按照配方调制饮品',
      estimatedTime: 5,
      required: true,
    },
    {
      stage: ProductionStage.FINISHING,
      name: '完成',
      description: '装饰和装杯',
      estimatedTime: 2,
      required: true,
    },
    {
      stage: ProductionStage.QUALITY_CHECK,
      name: '质检',
      description: '质量检查和确认',
      estimatedTime: 1,
      required: true,
    },
    {
      stage: ProductionStage.READY_FOR_PICKUP,
      name: '待取餐',
      description: '完成，等待取餐',
      estimatedTime: 0,
      required: false,
    },
  ];

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  /**
   * 获取订单制作进度
   */
  async getProductionProgress(orderId: string): Promise<ProductionProgress> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const progress = this.calculateProgress(order);
    return progress;
  }

  /**
   * 开始订单制作
   */
  async startProduction(orderId: string, staffId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许开始制作');
    }

    if (order.productionStage !== ProductionStage.NOT_STARTED) {
      throw new BadRequestException('订单已经开始制作');
    }

    // 检查库存是否充足
    const canMake = await this.canMakeOrder(orderId);
    if (!canMake) {
      throw new BadRequestException('库存不足，无法开始制作');
    }

    // 更新订单状态
    order.status = OrderStatus.MAKING;
    order.productionStage = ProductionStage.PREPARING;
    order.makingStartedAt = new Date();
    order.assignedTo = staffId;

    // 计算预估完成时间
    order.estimatedWaitTime = this.calculateEstimatedTime(order);

    return this.orderRepository.save(order);
  }

  /**
   * 更新制作进度
   */
  async updateProductionStage(
    orderId: string,
    stage: ProductionStage,
    notes?: string
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.MAKING) {
      throw new BadRequestException('订单不在制作中');
    }

    // 验证阶段转换是否有效
    if (!this.isValidStageTransition(order.productionStage, stage)) {
      throw new BadRequestException('无效的制作阶段转换');
    }

    // 更新制作阶段
    order.productionStage = stage;

    // 设置对应的时间戳
    switch (stage) {
      case ProductionStage.MIXING:
        // 从准备阶段进入调制阶段
        break;
      case ProductionStage.FINISHING:
        // 从调制阶段进入完成阶段
        break;
      case ProductionStage.QUALITY_CHECK:
        // 进入质检阶段
        order.makingCompletedAt = new Date();
        break;
      case ProductionStage.READY_FOR_PICKUP:
        // 制作完成
        order.status = OrderStatus.READY;
        order.readyAt = new Date();
        order.actualWaitTime = Math.floor(
          (order.readyAt.getTime() - order.makingStartedAt.getTime()) / 60000
        );
        break;
    }

    if (notes) {
      order.notes = order.notes ? `${order.notes}\n[制作进度] ${stage}: ${notes}` : `[制作进度] ${stage}: ${notes}`;
    }

    return this.orderRepository.save(order);
  }

  /**
   * 完成订单
   */
  async completeOrder(orderId: string, qualityNotes?: string, rating?: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('订单未完成制作，无法完成');
    }

    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    order.productionStage = ProductionStage.READY_FOR_PICKUP;

    if (qualityNotes) {
      order.qualityNotes = qualityNotes;
    }

    if (rating !== undefined) {
      order.rating = rating;
    }

    return this.orderRepository.save(order);
  }

  /**
   * 分配订单到制作人员
   */
  async assignOrder(orderId: string, staffId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('只能分配待确认的订单');
    }

    order.assignedTo = staffId;

    return this.orderRepository.save(order);
  }

  /**
   * 获取订单队列
   */
  async getOrderQueue(): Promise<OrderQueue> {
    const orders = await this.orderRepository.find({
      relations: ['orderItems'],
      order: { createdAt: 'ASC' },
    });

    const queue: OrderQueue = {
      pending: [],
      making: [],
      ready: [],
      overdue: [],
    };

    for (const order of orders) {
      const isOverdue = order.isOverdue;
      
      if (isOverdue && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED) {
        queue.overdue.push(order);
        continue;
      }

      switch (order.status) {
        case OrderStatus.PENDING:
          queue.pending.push(order);
          break;
        case OrderStatus.MAKING:
          queue.making.push(order);
          break;
        case OrderStatus.READY:
          queue.ready.push(order);
          break;
      }
    }

    return queue;
  }

  /**
   * 获取制作人员的工作队列
   */
  async getStaffQueue(staffId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: [
        { assignedTo: staffId, status: OrderStatus.PENDING },
        { assignedTo: staffId, status: OrderStatus.MAKING },
      ],
      relations: ['orderItems'],
      order: { 
        priority: 'DESC',
        createdAt: 'ASC' 
      },
    });
  }

  /**
   * 设置订单优先级
   */
  async setOrderPriority(orderId: string, priority: OrderPriority): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    order.priority = priority;

    return this.orderRepository.save(order);
  }

  /**
   * 批量开始制作
   */
  async startBatchProduction(orderIds: string[], staffId: string): Promise<Order[]> {
    const orders: Order[] = [];
    
    for (const orderId of orderIds) {
      try {
        const order = await this.startProduction(orderId, staffId);
        orders.push(order);
      } catch (error) {
        console.error(`无法开始制作订单 ${orderId}:`, error.message);
      }
    }

    return orders;
  }

  /**
   * 估算订单制作时间
   */
  async estimateProductionTime(items: Array<{ productId: string; quantity: number }>): Promise<number> {
    let totalTime = 0;

    for (const item of items) {
      const orderItem = await this.orderItemRepository.findOne({
        where: { productId: item.productId },
        relations: ['product', 'product.recipes'],
      });

      if (orderItem?.product) {
        // 基于产品复杂度计算时间
        const baseTime = this.getBaseTimeForProduct(orderItem.product);
        totalTime += baseTime * item.quantity;
      }
    }

    return Math.max(totalTime, 5); // 最少5分钟
  }

  /**
   * 检查订单是否可以制作
   */
  private async canMakeOrder(orderId: string): Promise<boolean> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'orderItems.product', 'orderItems.product.recipes'],
    });

    if (!order) return false;

    // 这里应该调用库存服务检查库存
    // 简化实现
    return true;
  }

  /**
   * 计算订单预估时间
   */
  private calculateEstimatedTime(order: Order): number {
    const baseTime = order.totalItems * 3; // 每件商品3分钟基础时间
    const complexityBonus = order.orderItems?.reduce((bonus, item) => {
      // 根据产品复杂度增加时间
      return bonus + (item.product?.recipes?.length || 0);
    }, 0) || 0;

    return Math.max(baseTime + complexityBonus, 5);
  }

  /**
   * 计算制作进度
   */
  private calculateProgress(order: Order): ProductionProgress {
    const currentStageIndex = this.productionSteps.findIndex(step => step.stage === order.productionStage);
    const progress = currentStageIndex >= 0 ? ((currentStageIndex + 1) / this.productionSteps.length) * 100 : 0;

    const timeSpent = order.makingStartedAt ? 
      Math.floor((new Date().getTime() - order.makingStartedAt.getTime()) / 60000) : 0;

    const remainingSteps = this.productionSteps.slice(currentStageIndex + 1);
    const estimatedTimeRemaining = remainingSteps.reduce((sum, step) => sum + step.estimatedTime, 0);

    const canStartNext = currentStageIndex < this.productionSteps.length - 1;
    const blockers: string[] = [];

    // 检查是否有阻塞因素
    if (order.status === OrderStatus.CANCELLED) {
      blockers.push('订单已取消');
    }

    return {
      orderId: order.id,
      currentStage: order.productionStage,
      progress,
      estimatedTimeRemaining,
      actualTimeSpent: timeSpent,
      canStartNext,
      blockers,
    };
  }

  /**
   * 验证阶段转换是否有效
   */
  private isValidStageTransition(current: ProductionStage, next: ProductionStage): boolean {
    const currentIndex = this.productionSteps.findIndex(step => step.stage === current);
    const nextIndex = this.productionSteps.findIndex(step => step.stage === next);

    // 只能按顺序进行，不能跳跃或后退
    return nextIndex === currentIndex + 1;
  }

  /**
   * 获取产品的基础制作时间
   */
  private getBaseTimeForProduct(product: any): number {
    // 基于产品配方复杂度计算
    const recipeCount = product.recipes?.length || 0;
    return 3 + (recipeCount * 0.5); // 基础3分钟，每增加一个配方增加0.5分钟
  }

  /**
   * 获取制作统计
   */
  async getProductionStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.orderRepository.find({
      where: {
        createdAt: { $gte: startDate } as any,
      },
    });

    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED);

    const averageWaitTime = completedOrders.length > 0 
      ? completedOrders.reduce((sum, o) => sum + (o.actualWaitTime || 0), 0) / completedOrders.length 
      : 0;

    const overdueRate = orders.length > 0 
      ? (orders.filter(o => o.isOverdue).length / orders.length) * 100 
      : 0;

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      averageWaitTime: Math.round(averageWaitTime),
      overdueRate: Math.round(overdueRate * 100) / 100,
      completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
    };
  }
}