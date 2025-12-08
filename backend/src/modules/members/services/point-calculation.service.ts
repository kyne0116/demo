import { Injectable } from '@nestjs/common';
import { MemberLevel } from '../entities/member-profile.entity';

export interface PointsDiscountResult {
  discountAmount: number;
  usedPoints: number;
}

export interface MemberDiscountResult {
  discountRate: number;
  discountAmount: number;
}

export interface TotalDiscountResult {
  totalDiscountAmount: number;
  discountBreakdown: {
    memberDiscount: number;
    pointsDiscount: number;
  };
}

@Injectable()
export class PointCalculationService {
  // 常量定义
  private readonly POINTS_CONVERSION_RATE = 100; // 100 points = 1 yuan
  private readonly WELCOME_BONUS_POINTS = 100;
  private readonly REFERRAL_BONUS_POINTS = 50;

  private readonly LEVEL_THRESHOLDS = {
    [MemberLevel.BRONZE]: 0,
    [MemberLevel.SILVER]: 1000,
    [MemberLevel.GOLD]: 5000,
    [MemberLevel.PLATINUM]: 10000
  };

  private readonly DISCOUNT_RATES = {
    [MemberLevel.BRONZE]: 0,
    [MemberLevel.SILVER]: 0.05, // 5%
    [MemberLevel.GOLD]: 0.08, // 8%
    [MemberLevel.PLATINUM]: 0.10 // 10%
  };

  /**
   * 根据购买金额计算积分
   */
  calculatePurchasePoints(amount: number): number {
    if (amount < 0 || !isFinite(amount)) {
      throw new Error('Invalid purchase amount');
    }
    return Math.floor(amount);
  }

  /**
   * 计算积分抵扣金额
   */
  calculatePointsDiscount(availablePoints: number): PointsDiscountResult {
    this.validatePoints(availablePoints);
    
    if (availablePoints < this.POINTS_CONVERSION_RATE) {
      return { discountAmount: 0, usedPoints: 0 };
    }

    const usedPoints = Math.floor(availablePoints / this.POINTS_CONVERSION_RATE) * this.POINTS_CONVERSION_RATE;
    const discountAmount = usedPoints / this.POINTS_CONVERSION_RATE;

    return { discountAmount, usedPoints };
  }

  /**
   * 计算欢迎积分
   */
  calculateWelcomeBonus(referralCode?: string | null): number {
    let bonus = this.WELCOME_BONUS_POINTS;
    
    if (referralCode && this.isValidReferralCode(referralCode)) {
      bonus += this.REFERRAL_BONUS_POINTS;
    }

    return bonus;
  }

  /**
   * 计算会员折扣
   */
  calculateMemberDiscount(level: string, total: number = 0): MemberDiscountResult {
    const normalizedLevel = level?.toLowerCase() as MemberLevel;
    const discountRate = this.DISCOUNT_RATES[normalizedLevel] || 0;
    const discountAmount = total * discountRate;

    return { discountRate, discountAmount };
  }

  /**
   * 计算总折扣
   */
  calculateTotalDiscount(
    memberDiscount: MemberDiscountResult,
    pointsDiscount: PointsDiscountResult
  ): TotalDiscountResult {
    const totalDiscountAmount = memberDiscount.discountAmount + pointsDiscount.discountAmount;

    return {
      totalDiscountAmount,
      discountBreakdown: {
        memberDiscount: memberDiscount.discountAmount,
        pointsDiscount: pointsDiscount.discountAmount
      }
    };
  }

  /**
   * 计算最终应付金额
   */
  calculateFinalAmount(
    subtotal: number,
    memberDiscount: number,
    pointsDiscount: number
  ): number {
    const totalDiscount = memberDiscount + pointsDiscount;
    const finalAmount = Math.max(0, subtotal - totalDiscount);
    return Math.round(finalAmount * 100) / 100; // 保留两位小数
  }

  /**
   * 验证积分数量
   */
  validatePoints(points: number): void {
    if (typeof points !== 'number' || isNaN(points) || !isFinite(points)) {
      throw new Error('Points must be a valid number');
    }
    if (points < 0) {
      throw new Error('Points cannot be negative');
    }
    if (!Number.isInteger(points)) {
      throw new Error('Points must be an integer');
    }
  }

  /**
   * 格式化积分
   */
  formatPoints(points: number): number {
    if (isNaN(points) || !isFinite(points)) {
      return 0;
    }
    return Math.max(0, Math.floor(points));
  }

  /**
   * 获取积分兑换比例
   */
  getPointsConversionRate(): number {
    return this.POINTS_CONVERSION_RATE;
  }

  /**
   * 获取会员等级阈值
   */
  getMemberLevelThresholds(): Record<MemberLevel, number> {
    return { ...this.LEVEL_THRESHOLDS };
  }

  /**
   * 获取折扣比例
   */
  getDiscountRates(): Record<MemberLevel, number> {
    return { ...this.DISCOUNT_RATES };
  }

  /**
   * 验证推荐码格式
   */
  isValidReferralCode(code: string | null | undefined): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }
    return /^[A-Z0-9]{3,10}$/.test(code);
  }

  /**
   * 根据积分或消费金额计算会员等级
   */
  calculateLevel(pointsOrSpent: number): MemberLevel {
    if (pointsOrSpent >= this.LEVEL_THRESHOLDS[MemberLevel.PLATINUM]) {
      return MemberLevel.PLATINUM;
    }
    if (pointsOrSpent >= this.LEVEL_THRESHOLDS[MemberLevel.GOLD]) {
      return MemberLevel.GOLD;
    }
    if (pointsOrSpent >= this.LEVEL_THRESHOLDS[MemberLevel.SILVER]) {
      return MemberLevel.SILVER;
    }
    return MemberLevel.BRONZE;
  }

  /**
   * 获取下一个会员等级
   */
  getNextLevel(currentLevel: MemberLevel): MemberLevel | null {
    switch (currentLevel) {
      case MemberLevel.BRONZE:
        return MemberLevel.SILVER;
      case MemberLevel.SILVER:
        return MemberLevel.GOLD;
      case MemberLevel.GOLD:
        return MemberLevel.PLATINUM;
      case MemberLevel.PLATINUM:
        return null; // 已是最高等级
      default:
        return null;
    }
  }

  /**
   * 获取升级到下一等级需要的积分或消费金额
   */
  getUpgradeRequirement(currentLevel: MemberLevel): number {
    const nextLevel = this.getNextLevel(currentLevel);
    if (!nextLevel) {
      return 0; // 已是最高等级
    }
    return this.LEVEL_THRESHOLDS[nextLevel];
  }

  /**
   * 检查是否满足升级条件
   */
  canUpgradeLevel(
    currentLevel: MemberLevel,
    currentPoints: number,
    currentSpent: number
  ): boolean {
    const requirement = this.getUpgradeRequirement(currentLevel);
    return currentPoints >= requirement || currentSpent >= requirement;
  }

  /**
   * 获取会员等级显示名称
   */
  getLevelDisplayName(level: MemberLevel): string {
    const displayNames = {
      [MemberLevel.BRONZE]: '青铜会员',
      [MemberLevel.SILVER]: '白银会员',
      [MemberLevel.GOLD]: '黄金会员',
      [MemberLevel.PLATINUM]: '白金会员'
    };
    return displayNames[level] || '未知等级';
  }

  /**
   * 获取等级颜色（用于前端显示）
   */
  getLevelColor(level: MemberLevel): string {
    const colors = {
      [MemberLevel.BRONZE]: '#CD7F32',
      [MemberLevel.SILVER]: '#C0C0C0',
      [MemberLevel.GOLD]: '#FFD700',
      [MemberLevel.PLATINUM]: '#E5E4E2'
    };
    return colors[level] || '#808080';
  }

  /**
   * 计算订单完成后的积分获得
   */
  calculatePointsEarned(orderAmount: number, memberLevel: MemberLevel): number {
    let points = this.calculatePurchasePoints(orderAmount);
    
    // 会员等级加成
    const bonusRate = this.DISCOUNT_RATES[memberLevel];
    if (bonusRate > 0) {
      points = Math.floor(points * (1 + bonusRate * 0.5)); // 等级越高，积分加成越多
    }

    return points;
  }

  /**
   * 计算积分使用建议
   */
  getPointsUsageSuggestion(availablePoints: number, orderAmount: number): PointsDiscountResult {
    const maxPoints = Math.min(availablePoints, orderAmount * this.POINTS_CONVERSION_RATE);
    
    // 建议使用最小比例：最多抵扣订单金额的50%
    const suggestedPoints = Math.min(maxPoints, Math.floor(orderAmount * this.POINTS_CONVERSION_RATE * 0.5));
    
    return {
      discountAmount: suggestedPoints / this.POINTS_CONVERSION_RATE,
      usedPoints: suggestedPoints
    };
  }
}