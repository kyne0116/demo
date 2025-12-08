import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderCalculationService } from './services/order-calculation.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private orderCalculationService: OrderCalculationService,
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