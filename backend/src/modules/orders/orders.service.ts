import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
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
  }): Promise<Order> {
    // 计算订单总金额
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // 生成订单号
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // 创建订单
    const order = this.orderRepository.create({
      orderNumber,
      customerId: orderData.customerId,
      staffId: orderData.staffId,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      pointsUsed: 0,
      pointsEarned: Math.floor(totalAmount), // 积分奖励：消费金额=积分
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

    await this.orderItemRepository.save(orderItems);

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
    order.status = status;

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
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

    return this.orderRepository.save(order);
  }
}