import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderCalculationService } from './services/order-calculation.service';
import { MembersService } from '../members/members.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private orderCalculationService: OrderCalculationService,
    private membersService: MembersService,
    private inventoryService: InventoryService,
  ) {}

  async createOrder(orderData: {
    customerId?: string;
    staffId: string;
    items: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }>;
    notes?: string;
    memberInfo?: {
      memberLevel?: string;
      pointsAvailable?: number;
    };
  }): Promise<Order> {
    // 使用订单计算服务计算金额
    const calculationResult = this.orderCalculationService.calculateFinalOrder(
      orderData.items,
      orderData.memberInfo
    );

    // 生成订单号
    const orderNumber = this.orderCalculationService.generateOrderNumber();

    // 创建订单
    const order = this.orderRepository.create({
      orderNumber,
      customerId: orderData.customerId,
      staffId: orderData.staffId,
      totalAmount: calculationResult.totalAmount,
      discountAmount: calculationResult.discountAmount,
      finalAmount: calculationResult.finalAmount,
      pointsUsed: calculationResult.pointsUsed,
      pointsEarned: calculationResult.pointsEarned,
      status: OrderStatus.PENDING,
      notes: orderData.notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // 创建订单项
    const orderItems = orderData.items.map(item =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.unitPrice * item.quantity,
      })
    );

    const savedOrderItems = await this.orderItemRepository.save(orderItems);

    // 自动扣减库存（获取订单项的完整信息，包括产品配方）
    const orderItemsWithProduct = await this.orderItemRepository.find({
      where: { orderId: savedOrder.id },
      relations: ['product', 'product.recipes'],
    });

    await this.inventoryService.deductStockForOrder(orderItemsWithProduct);

    return this.findOne(savedOrder.id);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['orderItems'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems'],
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    const previousStatus = order.status;
    order.status = status;

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();

      // 如果订单包含会员信息，完成订单后更新会员积分
      await this.handleOrderCompletion(order);
    } else if (status === OrderStatus.CANCELLED && previousStatus !== OrderStatus.CANCELLED) {
      // 订单取消时恢复库存
      const orderItems = await this.orderItemRepository.find({
        where: { orderId: order.id },
        relations: ['product', 'product.recipes'],
      });

      if (orderItems.length > 0) {
        await this.inventoryService.restoreStockForOrder(orderItems);
      }
    }

    return this.orderRepository.save(order);
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new Error('已完成的订单不能取消');
    }

    order.status = OrderStatus.CANCELLED;
    if (reason) {
      order.notes = order.notes ? `${order.notes}\n取消原因: ${reason}` : `取消原因: ${reason}`;
    }

    // 取消订单时恢复库存
    const orderItems = await this.orderItemRepository.find({
      where: { orderId: order.id },
      relations: ['product', 'product.recipes'],
    });

    if (orderItems.length > 0) {
      await this.inventoryService.restoreStockForOrder(orderItems);
    }

    return this.orderRepository.save(order);
  }

  /**
   * 处理订单完成后的会员积分更新
   */
  private async handleOrderCompletion(order: Order): Promise<void> {
    if (!order.customerId) {
      return; // 匿名订单，不需要更新会员积分
    }

    try {
      // 查找会员
      const member = await this.membersService.findOne(order.customerId);
      if (!member) {
        return; // 会员不存在
      }

      // 如果使用了积分，先扣减积分
      if (order.pointsUsed > 0) {
        await this.membersService.addPoints(member.id, {
          points: -order.pointsUsed,
          type: 'redemption',
          description: `订单 ${order.orderNumber} 积分抵扣`
        });
      }

      // 添加消费金额
      member.addSpent(order.finalAmount);

      // 计算并添加积分
      const pointsEarned = this.membersService.calculatePointsEarned(order.finalAmount, member);
      if (pointsEarned > 0) {
        await this.membersService.addPoints(member.id, {
          points: pointsEarned,
          type: 'purchase',
          description: `订单 ${order.orderNumber} 消费获得积分`
        });
      }

      // 检查并更新会员等级
      await this.membersService.updateMemberLevel(member.id);
    } catch (error) {
      console.error('Failed to update member points after order completion:', error);
      // 不抛出错误，避免影响订单状态更新
    }
  }

  /**
   * 创建订单并自动完成（用于测试或特殊场景）
   */
  async createAndCompleteOrder(orderData: {
    customerId?: string;
    staffId: string;
    items: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }>;
    notes?: string;
    memberInfo?: {
      memberLevel?: string;
      pointsAvailable?: number;
    };
  }): Promise<Order> {
    const order = await this.createOrder(orderData);

    // 直接设置为已完成状态
    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();

    const completedOrder = await this.orderRepository.save(order);

    // 处理订单完成后的会员积分更新
    await this.handleOrderCompletion(completedOrder);

    return this.findOne(completedOrder.id);
  }

  /**
   * 验证订单是否可以创建（库存是否充足）
   */
  async validateOrderCanBeCreated(items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }>): Promise<{ canCreate: boolean; insufficientItems: Array<{ productName: string; required: number; available: number }> }> {
    const insufficientItems: Array<{ productName: string; required: number; available: number }> = [];

    // 检查每个产品的库存
    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
        relations: ['recipes', 'recipes.inventoryItem'],
      });

      if (!product) {
        insufficientItems.push({
          productName: item.productName,
          required: item.quantity,
          available: 0
        });
        continue;
      }

      // 检查产品的每个原料是否足够
      if (product.recipes) {
        for (const recipe of product.recipes) {
          const requiredQuantity = Number(recipe.getAdjustedQuantity()) * item.quantity;
          const inventoryItem = recipe.inventoryItem;

          if (inventoryItem && inventoryItem.currentStock < requiredQuantity) {
            insufficientItems.push({
              productName: product.name,
              required: requiredQuantity,
              available: inventoryItem.currentStock
            });
            break; // 该产品库存不足，停止检查其他原料
          }
        }
      }
    }

    return {
      canCreate: insufficientItems.length === 0,
      insufficientItems
    };
  }

  /**
   * 获取会员订单历史
   */
  async getMemberOrders(customerId: string, page: number = 1, limit: number = 10) {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { customerId },
      relations: ['orderItems'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 计算会员订单统计
   */
  async getMemberOrderStats(customerId: string) {
    const orders = await this.orderRepository.find({
      where: {
        customerId,
        status: OrderStatus.COMPLETED
      },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.finalAmount, 0);
    const totalPointsEarned = orders.reduce((sum, order) => sum + (order.pointsEarned || 0), 0);
    const totalPointsUsed = orders.reduce((sum, order) => sum + (order.pointsUsed || 0), 0);

    return {
      totalOrders,
      totalSpent,
      totalPointsEarned,
      totalPointsUsed,
      netPoints: totalPointsEarned - totalPointsUsed,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
    };
  }
}