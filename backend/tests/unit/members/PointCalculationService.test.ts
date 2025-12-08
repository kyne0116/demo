import { Test, TestingModule } from '@nestjs/testing';
import { PointCalculationService } from '../../../src/modules/members/services/point-calculation.service';
import { BadRequestException } from '@nestjs/common';

describe('PointCalculationService', () => {
  let service: PointCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointCalculationService],
    }).compile();

    service = module.get<PointCalculationService>(PointCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePurchasePoints', () => {
    it('should calculate points based on purchase amount', () => {
      const testCases = [
        { amount: 0, expectedPoints: 0 },
        { amount: 1, expectedPoints: 1 },
        { amount: 10.50, expectedPoints: 10 },
        { amount: 100, expectedPoints: 100 },
        { amount: 999.99, expectedPoints: 999 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculatePurchasePoints(testCase.amount);
        expect(result).toBe(testCase.expectedPoints);
      });
    });

    it('should use floor rounding', () => {
      const testCases = [
        { amount: 10.1, expectedPoints: 10 },
        { amount: 10.9, expectedPoints: 10 },
        { amount: 10.99, expectedPoints: 10 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculatePurchasePoints(testCase.amount);
        expect(result).toBe(testCase.expectedPoints);
      });
    });

    it('should handle decimal amounts correctly', () => {
      const testCases = [
        { amount: 0.01, expectedPoints: 0 },
        { amount: 0.99, expectedPoints: 0 },
        { amount: 1.00, expectedPoints: 1 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculatePurchasePoints(testCase.amount);
        expect(result).toBe(testCase.expectedPoints);
      });
    });

    it('should throw error for negative amounts', () => {
      expect(() => service.calculatePurchasePoints(-10))
        .toThrow(BadRequestException);
      expect(() => service.calculatePurchasePoints(-0.01))
        .toThrow(BadRequestException);
    });

    it('should throw error for non-numeric amounts', () => {
      expect(() => service.calculatePurchasePoints(NaN))
        .toThrow(BadRequestException);
      expect(() => service.calculatePurchasePoints(Infinity))
        .toThrow(BadRequestException);
    });
  });

  describe('calculatePointsDiscount', () => {
    it('should calculate correct discount for valid points', () => {
      const testCases = [
        { points: 100, expectedDiscount: 1 },
        { points: 500, expectedDiscount: 5 },
        { points: 1000, expectedDiscount: 10 },
        { points: 10000, expectedDiscount: 100 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculatePointsDiscount(testCase.points);
        expect(result.discountAmount).toBe(testCase.expectedDiscount);
        expect(result.usedPoints).toBe(testCase.points);
      });
    });

    it('should return zero for insufficient points', () => {
      const result = service.calculatePointsDiscount(50);
      expect(result.discountAmount).toBe(0);
      expect(result.usedPoints).toBe(0);
    });

    it('should throw error for negative points', () => {
      expect(() => service.calculatePointsDiscount(-100))
        .toThrow(BadRequestException);
    });

    it('should throw error for non-integer points', () => {
      expect(() => service.calculatePointsDiscount(100.5))
        .toThrow(BadRequestException);
      expect(() => service.calculatePointsDiscount(NaN))
        .toThrow(BadRequestException);
    });
  });

  describe('calculateWelcomeBonus', () => {
    it('should calculate welcome bonus without referral', () => {
      const result = service.calculateWelcomeBonus();
      expect(result).toBe(100); // 默认欢迎积分
    });

    it('should calculate welcome bonus with valid referral code', () => {
      const validReferralCodes = ['REF123', 'USER456', 'VIP789'];
      
      validReferralCodes.forEach(code => {
        const result = service.calculateWelcomeBonus(code);
        expect(result).toBe(150); // 基础100 + 推荐50
      });
    });

    it('should calculate welcome bonus with invalid referral code', () => {
      const invalidReferralCodes = ['invalid', 'REF', '123', ''];
      
      invalidReferralCodes.forEach(code => {
        const result = service.calculateWelcomeBonus(code);
        expect(result).toBe(100); // 只返回基础积分
      });
    });

    it('should calculate welcome bonus with empty referral code', () => {
      const result = service.calculateWelcomeBonus('');
      expect(result).toBe(100);
    });

    it('should calculate welcome bonus with null referral code', () => {
      const result = service.calculateWelcomeBonus(null);
      expect(result).toBe(100);
    });
  });

  describe('calculateMemberDiscount', () => {
    it('should calculate correct discount rates for different levels', () => {
      const testCases = [
        { level: 'bronze', expectedRate: 0 },
        { level: 'regular', expectedRate: 0 },
        { level: 'silver', expectedRate: 0.05 },
        { level: 'gold', expectedRate: 0.08 },
        { level: 'platinum', expectedRate: 0.10 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculateMemberDiscount(testCase.level);
        expect(result.discountRate).toBe(testCase.expectedRate);
      });
    });

    it('should calculate discount amount based on total', () => {
      const testCases = [
        { level: 'bronze', total: 100, expectedAmount: 0 },
        { level: 'silver', total: 100, expectedAmount: 5 },
        { level: 'gold', total: 100, expectedAmount: 8 },
        { level: 'platinum', total: 100, expectedAmount: 10 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculateMemberDiscount(testCase.level, testCase.total);
        expect(result.discountAmount).toBe(testCase.expectedAmount);
        expect(result.discountRate).toBeGreaterThan(0);
      });
    });

    it('should handle case-insensitive levels', () => {
      const testCases = [
        { level: 'BRONZE', total: 100 },
        { level: 'Bronze', total: 100 },
        { level: 'bronze', total: 100 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculateMemberDiscount(testCase.level, testCase.total);
        expect(result.discountRate).toBe(0);
      });
    });

    it('should handle unknown levels', () => {
      const result = service.calculateMemberDiscount('unknown', 100);
      expect(result.discountRate).toBe(0);
    });

    it('should handle null level', () => {
      const result = service.calculateMemberDiscount(null, 100);
      expect(result.discountRate).toBe(0);
    });
  });

  describe('calculateTotalDiscount', () => {
    it('should combine member discount and points discount', () => {
      const memberDiscount = { discountRate: 0.05, discountAmount: 5 };
      const pointsDiscount = { usedPoints: 100, discountAmount: 1 };

      const result = service.calculateTotalDiscount(memberDiscount, pointsDiscount);
      expect(result.totalDiscountAmount).toBe(6);
      expect(result.discountBreakdown.memberDiscount).toBe(5);
      expect(result.discountBreakdown.pointsDiscount).toBe(1);
    });

    it('should handle zero discounts', () => {
      const memberDiscount = { discountRate: 0, discountAmount: 0 };
      const pointsDiscount = { usedPoints: 0, discountAmount: 0 };

      const result = service.calculateTotalDiscount(memberDiscount, pointsDiscount);
      expect(result.totalDiscountAmount).toBe(0);
      expect(result.discountBreakdown.memberDiscount).toBe(0);
      expect(result.discountBreakdown.pointsDiscount).toBe(0);
    });

    it('should handle only member discount', () => {
      const memberDiscount = { discountRate: 0.05, discountAmount: 5 };
      const pointsDiscount = { usedPoints: 0, discountAmount: 0 };

      const result = service.calculateTotalDiscount(memberDiscount, pointsDiscount);
      expect(result.totalDiscountAmount).toBe(5);
      expect(result.discountBreakdown.memberDiscount).toBe(5);
      expect(result.discountBreakdown.pointsDiscount).toBe(0);
    });

    it('should handle only points discount', () => {
      const memberDiscount = { discountRate: 0, discountAmount: 0 };
      const pointsDiscount = { usedPoints: 100, discountAmount: 1 };

      const result = service.calculateTotalDiscount(memberDiscount, pointsDiscount);
      expect(result.totalDiscountAmount).toBe(1);
      expect(result.discountBreakdown.memberDiscount).toBe(0);
      expect(result.discountBreakdown.pointsDiscount).toBe(1);
    });
  });

  describe('calculateFinalAmount', () => {
    it('should calculate final amount after all discounts', () => {
      const testCases = [
        { subtotal: 100, memberDiscount: 5, pointsDiscount: 1, expectedFinal: 94 },
        { subtotal: 50, memberDiscount: 0, pointsDiscount: 0, expectedFinal: 50 },
        { subtotal: 20, memberDiscount: 2, pointsDiscount: 0, expectedFinal: 18 }
      ];

      testCases.forEach(testCase => {
        const result = service.calculateFinalAmount(
          testCase.subtotal,
          testCase.memberDiscount,
          testCase.pointsDiscount
        );
        expect(result).toBe(testCase.expectedFinal);
      });
    });

    it('should not allow negative final amount', () => {
      const result = service.calculateFinalAmount(5, 10, 5);
      expect(result).toBe(0); // 应该返回0而不是负数
    });

    it('should handle zero subtotal', () => {
      const result = service.calculateFinalAmount(0, 5, 3);
      expect(result).toBe(0);
    });
  });

  describe('validatePoints', () => {
    it('should validate positive integers', () => {
      expect(() => service.validatePoints(0)).not.toThrow();
      expect(() => service.validatePoints(1)).not.toThrow();
      expect(() => service.validatePoints(1000)).not.toThrow();
      expect(() => service.validatePoints(999999)).not.toThrow();
    });

    it('should throw error for negative numbers', () => {
      expect(() => service.validatePoints(-1))
        .toThrow(BadRequestException);
      expect(() => service.validatePoints(-100))
        .toThrow(BadRequestException);
    });

    it('should throw error for non-integer numbers', () => {
      expect(() => service.validatePoints(1.5))
        .toThrow(BadRequestException);
      expect(() => service.validatePoints(100.1))
        .toThrow(BadRequestException);
    });

    it('should throw error for non-numeric values', () => {
      expect(() => service.validatePoints(NaN))
        .toThrow(BadRequestException);
      expect(() => service.validatePoints(Infinity))
        .toThrow(BadRequestException);
      expect(() => service.validatePoints(null))
        .toThrow(BadRequestException);
      expect(() => service.validatePoints(undefined))
        .toThrow(BadRequestException);
    });
  });

  describe('formatPoints', () => {
    it('should format points as integers', () => {
      expect(service.formatPoints(100)).toBe(100);
      expect(service.formatPoints(0)).toBe(0);
      expect(service.formatPoints(999999)).toBe(999999);
    });

    it('should round decimal values', () => {
      expect(service.formatPoints(100.5)).toBe(101);
      expect(service.formatPoints(100.4)).toBe(100);
      expect(service.formatPoints(100.9)).toBe(101);
    });

    it('should handle negative values by returning 0', () => {
      expect(service.formatPoints(-10)).toBe(0);
      expect(service.formatPoints(-0.5)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(service.formatPoints(NaN)).toBe(0);
      expect(service.formatPoints(Infinity)).toBe(0);
      expect(service.formatPoints(-Infinity)).toBe(0);
    });
  });

  describe('getPointsConversionRate', () => {
    it('should return correct conversion rate', () => {
      expect(service.getPointsConversionRate()).toBe(100); // 100 points = 1 yuan
    });
  });

  describe('getMemberLevelThresholds', () => {
    it('should return correct thresholds', () => {
      const thresholds = service.getMemberLevelThresholds();
      
      expect(thresholds).toEqual({
        bronze: 0,
        silver: 1000,
        gold: 5000,
        platinum: 10000
      });
    });
  });

  describe('getDiscountRates', () => {
    it('should return correct discount rates', () => {
      const rates = service.getDiscountRates();
      
      expect(rates).toEqual({
        bronze: 0,
        regular: 0,
        silver: 0.05,
        gold: 0.08,
        platinum: 0.10
      });
    });
  });

  describe('isValidReferralCode', () => {
    it('should validate correct referral codes', () => {
      const validCodes = ['REF123', 'USER456', 'VIP789', 'ABC123'];
      
      validCodes.forEach(code => {
        expect(service.isValidReferralCode(code)).toBe(true);
      });
    });

    it('should reject invalid referral codes', () => {
      const invalidCodes = ['REF', '123', 'invalid', 'REF12', 'REF12345'];
      
      invalidCodes.forEach(code => {
        expect(service.isValidReferralCode(code)).toBe(false);
      });
    });

    it('should handle null or empty codes', () => {
      expect(service.isValidReferralCode(null)).toBe(false);
      expect(service.isValidReferralCode('')).toBe(false);
      expect(service.isValidReferralCode(undefined)).toBe(false);
    });
  });
});