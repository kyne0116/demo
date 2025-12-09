import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryAlertService } from '../../../src/modules/inventory/inventory-alert.service';
import { InventoryItem } from '../../../src/modules/inventory/entities/inventory-item.entity';

describe('InventoryAlertService', () => {
  let service: InventoryAlertService;
  let repository: Repository<InventoryItem>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryAlertService,
        {
          provide: getRepositoryToken(InventoryItem),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<InventoryAlertService>(InventoryAlertService);
    repository = module.get<Repository<InventoryItem>>(getRepositoryToken(InventoryItem));
  });

  describe('checkLowStock', () => {
    it('应该识别低库存项', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 8, // 低于minStock(10)
          minStock: 10,
          maxStock: 200,
          isActive: true,
        },
        {
          id: 2,
          name: '牛奶',
          category: 'MILK',
          currentStock: 50, // 高于minStock(20)
          minStock: 20,
          maxStock: 100,
          isActive: true,
        },
        {
          id: 3,
          name: '茶叶',
          category: 'TEA',
          currentStock: 15, // 低于minStock(20)
          minStock: 20,
          maxStock: 150,
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkLowStock();

      expect(result).toHaveLength(2);
      expect(result[0].itemId).toBe(1);
      expect(result[0].currentStock).toBe(8);
      expect(result[0].minStock).toBe(10);
      expect(result[1].itemId).toBe(3);
      expect(result[1].currentStock).toBe(15);
      expect(result[1].minStock).toBe(20);
    });

    it('正常库存时应该返回空数组', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 50, // 高于minStock(10)
          minStock: 10,
          maxStock: 200,
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkLowStock();

      expect(result).toHaveLength(0);
    });

    it('应该排除非活跃的库存项', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 5, // 低于minStock(10)
          minStock: 10,
          maxStock: 200,
          isActive: false, // 非活跃
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkLowStock();

      expect(result).toHaveLength(0);
    });
  });

  describe('checkOverStock', () => {
    it('应该识别超库存项', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 250, // 超过maxStock(200)
          minStock: 10,
          maxStock: 200,
          isActive: true,
        },
        {
          id: 2,
          name: '牛奶',
          category: 'MILK',
          currentStock: 80, // 在maxStock(100)范围内
          minStock: 20,
          maxStock: 100,
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkOverStock();

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe(1);
      expect(result[0].currentStock).toBe(250);
      expect(result[0].maxStock).toBe(200);
    });

    it('正常库存时应该返回空数组', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 150, // 在maxStock(200)范围内
          minStock: 10,
          maxStock: 200,
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkOverStock();

      expect(result).toHaveLength(0);
    });
  });

  describe('checkExpiringItems', () => {
    it('应该识别即将过期的库存项', async () => {
      const futureDate = new Date('2025-12-15');
      const nearExpiryDate = new Date('2025-12-10'); // 5天后过期
      const expiredDate = new Date('2025-12-01'); // 已过期

      const mockInventoryItems = [
        {
          id: 1,
          name: '鲜牛奶',
          category: 'MILK',
          currentStock: 30,
          minStock: 10,
          maxStock: 100,
          costPrice: 8.0,
          supplier: '乳制品供应商',
          expirationDate: nearExpiryDate, // 即将过期
          isActive: true,
        },
        {
          id: 2,
          name: '酸奶',
          category: 'MILK',
          currentStock: 20,
          minStock: 5,
          maxStock: 50,
          costPrice: 12.0,
          supplier: '乳制品供应商',
          expirationDate: futureDate, // 还没到过期时间
          isActive: true,
        },
        {
          id: 3,
          name: '过期牛奶',
          category: 'MILK',
          currentStock: 15,
          minStock: 5,
          maxStock: 50,
          costPrice: 8.0,
          supplier: '乳制品供应商',
          expirationDate: expiredDate, // 已过期
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkExpiringItems(7); // 7天内过期

      expect(result).toHaveLength(2);
      expect(result[0].itemId).toBe(1); // 即将过期
      expect(result[1].itemId).toBe(3); // 已过期
    });

    it('应该正确处理没有过期日期的库存项', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '干茶叶',
          category: 'TEA',
          currentStock: 100,
          minStock: 20,
          maxStock: 200,
          costPrice: 50.0,
          supplier: '茶叶供应商',
          expirationDate: null, // 没有过期日期
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkExpiringItems(7);

      expect(result).toHaveLength(0);
    });

    it('应该处理自定义预警天数', async () => {
      const nearExpiryDate = new Date('2025-12-12'); // 3天后过期
      const farExpiryDate = new Date('2025-12-20'); // 11天后过期

      const mockInventoryItems = [
        {
          id: 1,
          name: '鲜牛奶',
          category: 'MILK',
          currentStock: 30,
          minStock: 10,
          maxStock: 100,
          costPrice: 8.0,
          supplier: '乳制品供应商',
          expirationDate: nearExpiryDate,
          isActive: true,
        },
        {
          id: 2,
          name: '酸奶',
          category: 'MILK',
          currentStock: 20,
          minStock: 5,
          maxStock: 50,
          costPrice: 12.0,
          supplier: '乳制品供应商',
          expirationDate: farExpiryDate,
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      // 7天内预警
      const result7Days = await service.checkExpiringItems(7);
      expect(result7Days).toHaveLength(1); // 只有即将过期的牛奶

      // 15天内预警
      const result15Days = await service.checkExpiringItems(15);
      expect(result15Days).toHaveLength(2); // 两个都会预警
    });
  });

  describe('getAllAlerts', () => {
    it('应该返回所有类型的预警', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 5, // 低库存
          minStock: 10,
          maxStock: 200,
          costPrice: 25.0,
          supplier: '珍珠供应商',
          expirationDate: null,
          isActive: true,
        },
        {
          id: 2,
          name: '牛奶',
          category: 'MILK',
          currentStock: 250, // 超库存
          minStock: 20,
          maxStock: 200,
          costPrice: 8.0,
          supplier: '乳制品供应商',
          expirationDate: null,
          isActive: true,
        },
        {
          id: 3,
          name: '鲜奶油',
          category: 'CREAM',
          currentStock: 30,
          minStock: 10,
          maxStock: 100,
          costPrice: 15.0,
          supplier: '奶油供应商',
          expirationDate: new Date('2025-12-10'), // 即将过期
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.getAllAlerts();

      expect(result).toEqual({
        lowStock: expect.arrayContaining([
          expect.objectContaining({ itemId: 1 }),
        ]),
        overStock: expect.arrayContaining([
          expect.objectContaining({ itemId: 2 }),
        ]),
        expiring: expect.arrayContaining([
          expect.objectContaining({ itemId: 3 }),
        ]),
      });
    });

    it('应该处理没有预警的情况', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '正常库存',
          category: 'NORMAL',
          currentStock: 50,
          minStock: 10,
          maxStock: 200,
          costPrice: 10.0,
          supplier: '正常供应商',
          expirationDate: new Date('2026-01-01'),
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.getAllAlerts();

      expect(result.lowStock).toHaveLength(0);
      expect(result.overStock).toHaveLength(0);
      expect(result.expiring).toHaveLength(0);
    });
  });

  describe('sendAlertNotifications', () => {
    it('应该发送低库存预警通知', async () => {
      const lowStockAlerts = [
        {
          itemId: 1,
          name: '珍珠',
          currentStock: 5,
          minStock: 10,
          category: 'TOPPING',
        },
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const emailSpy = jest.spyOn(service as any, 'sendEmailAlert').mockResolvedValue(true);

      await service.sendAlertNotifications(lowStockAlerts);

      expect(emailSpy).toHaveBeenCalledWith(
        expect.stringContaining('珍珠'),
        expect.stringContaining('低库存预警'),
        expect.stringContaining('当前库存: 5kg'),
        expect.stringContaining('最小库存: 10kg')
      );

      consoleSpy.mockRestore();
    });

    it('应该发送过期预警通知', async () => {
      const expiringAlerts = [
        {
          itemId: 1,
          name: '鲜牛奶',
          currentStock: 30,
          minStock: 10,
          maxStock: 100,
          category: 'MILK',
          expirationDate: new Date('2025-12-10'),
          daysUntilExpiry: 5,
        },
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const emailSpy = jest.spyOn(service as any, 'sendEmailAlert').mockResolvedValue(true);

      await service.sendAlertNotifications(expiringAlerts);

      expect(emailSpy).toHaveBeenCalledWith(
        expect.stringContaining('鲜牛奶'),
        expect.stringContaining('即将过期预警'),
        expect.stringContaining('过期日期: 2025-12-10'),
        expect.stringContaining('剩余天数: 5天')
      );

      consoleSpy.mockRestore();
    });

    it('应该处理通知发送失败的情况', async () => {
      const lowStockAlerts = [
        {
          itemId: 1,
          name: '珍珠',
          currentStock: 5,
          minStock: 10,
          category: 'TOPPING',
        },
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const emailSpy = jest.spyOn(service as any, 'sendEmailAlert').mockRejectedValue(new Error('发送失败'));

      await service.sendAlertNotifications(lowStockAlerts);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('发送预警通知失败')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('schedulePeriodicAlerts', () => {
    it('应该设置定时预警检查', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => 1 as any);

      await service.schedulePeriodicAlerts();

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Number) // 24小时
      );

      setIntervalSpy.mockRestore();
    });

    it('应该处理定时任务异常', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation();
      const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => {
        throw new Error('定时任务异常');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.schedulePeriodicAlerts();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('定时预警检查异常')
      );

      consoleSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('calculateReorderQuantity', () => {
    it('应该计算合理的补货数量', async () => {
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        category: 'TOPPING',
        currentStock: 15,
        minStock: 10,
        maxStock: 200,
        costPrice: 25.0,
        supplier: '珍珠供应商',
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);

      const result = await service.calculateReorderQuantity(1);

      // 当前库存15kg，minStock 10kg，maxStock 200kg
      // 应该建议补货到maxStock的80%，即160kg
      // 需要补货：160 - 15 = 145kg
      expect(result.recommendedQuantity).toBeGreaterThan(0);
      expect(result.currentStock).toBe(15);
      expect(result.targetStock).toBe(160); // maxStock * 0.8
    });

    it('库存充足时应该返回0', async () => {
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        category: 'TOPPING',
        currentStock: 150, // 已经接近maxStock(200)
        minStock: 10,
        maxStock: 200,
        costPrice: 25.0,
        supplier: '珍珠供应商',
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);

      const result = await service.calculateReorderQuantity(1);

      expect(result.recommendedQuantity).toBe(0);
    });
  });
});