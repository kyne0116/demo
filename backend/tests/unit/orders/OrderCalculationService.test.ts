import { Test, TestingModule } from '@nestjs/testing';
import { OrderCalculationService } from '../../../src/modules/orders/services/order-calculation.service';

describe('OrderCalculationService', () => {
  let service: OrderCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderCalculationService],
    }).compile();

    service = module.get<OrderCalculationService>(OrderCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total for single item', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '珍珠奶茶',
          unitPrice: 18.50,
          quantity: 1
        }
      ];

      const result = service.calculateOrderTotal(items);
      
      expect(result.subtotal).toBe(18.50);
      expect(result.totalAmount).toBe(18.50);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(18.50);
      expect(result.pointsEarned).toBe(18); // Math.floor(18.50)
    });

    it('should calculate total for multiple items', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '珍珠奶茶',
          unitPrice: 18.50,
          quantity: 2
        },
        {
          productId: 'product-2',
          productName: '芒果布丁',
          unitPrice: 15.00,
          quantity: 1
        }
      ];

      const result = service.calculateOrderTotal(items);
      
      const expectedSubtotal = 18.50 * 2 + 15.00 * 1; // 52.00
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.totalAmount).toBe(expectedSubtotal);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(expectedSubtotal);
      expect(result.pointsEarned).toBe(52); // Math.floor(52.00)
    });

    it('should handle zero quantity items', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '免费产品',
          unitPrice: 10.00,
          quantity: 0
        }
      ];

      const result = service.calculateOrderTotal(items);
      
      expect(result.subtotal).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.pointsEarned).toBe(0);
    });

    it('should handle large quantities', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '大批量产品',
          unitPrice: 25.99,
          quantity: 100
        }
      ];

      const result = service.calculateOrderTotal(items);
      
      const expectedSubtotal = 25.99 * 100; // 2599.00
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.totalAmount).toBe(expectedSubtotal);
      expect(result.pointsEarned).toBe(2599); // Math.floor(2599.00)
    });

    it('should handle fractional prices', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '低价产品',
          unitPrice: 0.99,
          quantity: 3
        }
      ];

      const result = service.calculateOrderTotal(items);
      
      const expectedSubtotal = 0.99 * 3; // 2.97
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.totalAmount).toBe(expectedSubtotal);
      expect(result.pointsEarned).toBe(2); // Math.floor(2.97) = 2
    });
  });

  describe('calculateMemberDiscount', () => {
    it('should return no discount for regular customer', () => {
      const totalAmount = 100.00;
      const memberLevel = 'regular'; // 非会员

      const result = service.calculateMemberDiscount(totalAmount, memberLevel);
      
      expect(result.discountRate).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it('should calculate Bronze member discount (0%)', () => {
      const totalAmount = 100.00;
      const memberLevel = 'bronze';

      const result = service.calculateMemberDiscount(totalAmount, memberLevel);
      
      expect(result.discountRate).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it('should calculate Silver member discount (5%)', () => {
      const totalAmount = 100.00;
      const memberLevel = 'silver';

      const result = service.calculateMemberDiscount(totalAmount, memberLevel);
      
      expect(result.discountRate).toBe(0.05);
      expect(result.discountAmount).toBe(5.00);
    });

    it('should calculate Gold member discount (8%)', () => {
      const totalAmount = 100.00;
      const memberLevel = 'gold';

      const result = service.calculateMemberDiscount(totalAmount, memberLevel);
      
      expect(result.discountRate).toBe(0.08);
      expect(result.discountAmount).toBe(8.00);
    });

    it('should calculate Platinum member discount (10%)', () => {
      const totalAmount = 100.00;
      const memberLevel = 'platinum';

      const result = service.calculateMemberDiscount(totalAmount, memberLevel);
      
      expect(result.discountRate).toBe(0.10);
      expect(result.discountAmount).toBe(10.00);
    });

    it('should handle fractional discount amounts', () => {
      const totalAmount = 33.33;
      const memberLevel = 'silver'; // 5% discount

      const result = service.calculateMemberDiscount(totalAmount, memberLevel);
      
      expect(result.discountRate).toBe(0.05);
      expect(result.discountAmount).toBe(1.67); // 33.33 * 0.05 = 1.6665
    });

    it('should handle zero amount', () => {
      const totalAmount = 0;
      const memberLevel = 'platinum';

      const result = service.calculateMemberDiscount(totalAmount, memberLevel);
      
      expect(result.discountRate).toBe(0.10);
      expect(result.discountAmount).toBe(0);
    });
  });

  describe('calculatePointsDiscount', () => {
    it('should calculate points discount (100 points = 1 yuan)', () => {
      const pointsAvailable = 500;
      const totalAmount = 50.00;

      const result = service.calculatePointsDiscount(pointsAvailable, totalAmount);
      
      const maxDiscountablePoints = 5000; // 50.00 * 100 = 5000 points
      const usedPoints = Math.min(pointsAvailable, maxDiscountablePoints);
      const discountAmount = usedPoints / 100; // 500 / 100 = 5.00

      expect(result.usedPoints).toBe(usedPoints);
      expect(result.discountAmount).toBe(discountAmount);
    });

    it('should not exceed total amount when calculating points discount', () => {
      const pointsAvailable = 10000; // 可换100元
      const totalAmount = 30.00; // 但订单只有30元

      const result = service.calculatePointsDiscount(pointsAvailable, totalAmount);
      
      const maxDiscountablePoints = 3000; // 30.00 * 100 = 3000 points
      const usedPoints = Math.min(pointsAvailable, maxDiscountablePoints);
      const discountAmount = usedPoints / 100; // 3000 / 100 = 30.00

      expect(result.usedPoints).toBe(maxDiscountablePoints);
      expect(result.discountAmount).toBe(30.00); // 不能超过订单总额
    });

    it('should handle insufficient points', () => {
      const pointsAvailable = 200; // 只能抵扣2元
      const totalAmount = 50.00;

      const result = service.calculatePointsDiscount(pointsAvailable, totalAmount);
      
      expect(result.usedPoints).toBe(200);
      expect(result.discountAmount).toBe(2.00);
    });

    it('should handle zero points', () => {
      const pointsAvailable = 0;
      const totalAmount = 50.00;

      const result = service.calculatePointsDiscount(pointsAvailable, totalAmount);
      
      expect(result.usedPoints).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it('should handle zero total amount', () => {
      const pointsAvailable = 500;
      const totalAmount = 0;

      const result = service.calculatePointsDiscount(pointsAvailable, totalAmount);
      
      expect(result.usedPoints).toBe(0);
      expect(result.discountAmount).toBe(0);
    });
  });

  describe('calculateFinalOrder', () => {
    it('should calculate final order for regular customer with no discounts', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '标准产品',
          unitPrice: 20.00,
          quantity: 2
        }
      ];

      const result = service.calculateFinalOrder(items);
      
      const expectedSubtotal = 40.00;
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.totalAmount).toBe(expectedSubtotal);
      expect(result.memberDiscount).toBe(0);
      expect(result.pointsDiscount).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(expectedSubtotal);
      expect(result.pointsEarned).toBe(40);
    });

    it('should calculate final order for Silver member with member discount', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '会员产品',
          unitPrice: 100.00,
          quantity: 1
        }
      ];

      const result = service.calculateFinalOrder(items, {
        memberLevel: 'silver',
        pointsAvailable: 0
      });
      
      expect(result.subtotal).toBe(100.00);
      expect(result.totalAmount).toBe(100.00);
      expect(result.memberDiscount).toBe(5.00); // 5% of 100.00
      expect(result.pointsDiscount).toBe(0);
      expect(result.discountAmount).toBe(5.00);
      expect(result.finalAmount).toBe(95.00);
      expect(result.pointsEarned).toBe(100); // Points based on original amount
    });

    it('should calculate final order with member discount and points discount', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '双重优惠产品',
          unitPrice: 100.00,
          quantity: 1
        }
      ];

      const result = service.calculateFinalOrder(items, {
        memberLevel: 'gold', // 8% discount
        pointsAvailable: 2000 // 20 yuan worth of points
      });
      
      // First apply member discount: 100.00 * 0.08 = 8.00
      // Then apply points discount: 2000 points / 100 = 20.00
      // But cannot exceed remaining amount: 100.00 - 8.00 = 92.00
      // So points discount is limited to 20.00
      expect(result.subtotal).toBe(100.00);
      expect(result.totalAmount).toBe(100.00);
      expect(result.memberDiscount).toBe(8.00);
      expect(result.pointsDiscount).toBe(20.00);
      expect(result.discountAmount).toBe(28.00);
      expect(result.finalAmount).toBe(72.00);
      expect(result.pointsEarned).toBe(100);
      expect(result.pointsUsed).toBe(2000);
    });

    it('should handle edge case where points discount exceeds remaining amount', () => {
      const items = [
        {
          productId: 'product-1',
          productName: '小订单大积分',
          unitPrice: 10.00,
          quantity: 1
        }
      ];

      const result = service.calculateFinalOrder(items, {
        memberLevel: 'regular',
        pointsAvailable: 2000 // 20 yuan worth, but order is only 10 yuan
      });
      
      expect(result.subtotal).toBe(10.00);
      expect(result.totalAmount).toBe(10.00);
      expect(result.memberDiscount).toBe(0);
      expect(result.pointsDiscount).toBe(10.00); // Limited to order amount
      expect(result.discountAmount).toBe(10.00);
      expect(result.finalAmount).toBe(0);
      expect(result.pointsEarned).toBe(10);
      expect(result.pointsUsed).toBe(1000); // 10.00 * 100 = 1000 points
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate unique order numbers', () => {
      const number1 = service.generateOrderNumber();
      const number2 = service.generateOrderNumber();
      
      expect(number1).not.toBe(number2);
      expect(number1).toMatch(/^ORD-\d+-[A-Z0-9]{5}$/);
      expect(number2).toMatch(/^ORD-\d+-[A-Z0-9]{5}$/);
    });

    it('should include timestamp in order number', () => {
      const orderNumber = service.generateOrderNumber();
      const timestamp = Date.now().toString();
      
      expect(orderNumber).toContain(timestamp.substring(0, 10)); // First 10 digits of timestamp
    });
  });
});