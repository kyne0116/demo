import { Injectable } from '@nestjs/common';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderCalculationResult {
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  pointsEarned: number;
  memberDiscount: number;
  pointsDiscount: number;
  pointsUsed: number;
}

export interface MemberInfo {
  memberLevel?: string;
  pointsAvailable?: number;
}

@Injectable()
export class OrderCalculationService {
  /**
   * 计算订单总金额（不包含折扣）
   */
  calculateOrderTotal(items: OrderItem[]): Pick<OrderCalculationResult, 'subtotal' | 'totalAmount' | 'discountAmount' | 'finalAmount' | 'pointsEarned'> {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    const totalAmount = subtotal;
    const discountAmount = 0;
    const finalAmount = totalAmount - discountAmount;
    const pointsEarned = Math.floor(finalAmount);

    return {
      subtotal,
      totalAmount,
      discountAmount,
      finalAmount,
      pointsEarned
    };
  }

  /**
   * 计算会员折扣
   */
  calculateMemberDiscount(totalAmount: number, memberLevel?: string): { discountRate: number; discountAmount: number } {
    if (!memberLevel || memberLevel === 'regular' || memberLevel === 'bronze') {
      return { discountRate: 0, discountAmount: 0 };
    }

    let discountRate = 0;
    switch (memberLevel.toLowerCase()) {
      case 'silver':
        discountRate = 0.05; // 5%
        break;
      case 'gold':
        discountRate = 0.08; // 8%
        break;
      case 'platinum':
        discountRate = 0.10; // 10%
        break;
      default:
        discountRate = 0;
    }

    const discountAmount = totalAmount * discountRate;

    return { discountRate, discountAmount };
  }

  /**
   * 计算积分折扣（100积分 = 1元）
   */
  calculatePointsDiscount(pointsAvailable: number, totalAmount: number): { usedPoints: number; discountAmount: number } {
    if (!pointsAvailable || pointsAvailable <= 0) {
      return { usedPoints: 0, discountAmount: 0 };
    }

    // 计算最大可抵扣的积分（不能超过订单金额）
    const maxDiscountablePoints = totalAmount * 100; // 1元 = 100积分
    const usedPoints = Math.min(pointsAvailable, maxDiscountablePoints);
    const discountAmount = usedPoints / 100; // 100积分 = 1元

    return { usedPoints, discountAmount };
  }

  /**
   * 计算最终订单金额（包含所有折扣）
   */
  calculateFinalOrder(
    items: OrderItem[],
    memberInfo?: MemberInfo
  ): OrderCalculationResult {
    // 计算基础金额
    const baseCalculation = this.calculateOrderTotal(items);
    const { subtotal, totalAmount } = baseCalculation;

    // 计算会员折扣
    const memberDiscount = this.calculateMemberDiscount(totalAmount, memberInfo?.memberLevel);
    let remainingAmount = totalAmount - memberDiscount.discountAmount;

    // 计算积分折扣（基于会员折扣后的金额）
    const pointsDiscount = this.calculatePointsDiscount(
      memberInfo?.pointsAvailable || 0,
      remainingAmount
    );

    // 更新剩余金额
    remainingAmount = remainingAmount - pointsDiscount.discountAmount;

    const discountAmount = memberDiscount.discountAmount + pointsDiscount.discountAmount;
    const finalAmount = Math.max(0, remainingAmount); // 确保不为负数
    const pointsEarned = Math.floor(totalAmount); // 积分基于原始金额计算
    const pointsUsed = pointsDiscount.usedPoints;

    return {
      subtotal,
      totalAmount,
      discountAmount,
      finalAmount,
      pointsEarned,
      memberDiscount: memberDiscount.discountAmount,
      pointsDiscount: pointsDiscount.discountAmount,
      pointsUsed
    };
  }

  /**
   * 生成订单号
   */
  generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}