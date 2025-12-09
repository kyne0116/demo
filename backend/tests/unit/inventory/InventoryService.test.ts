import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from '../../../src/modules/inventory/inventory.service';
import { InventoryItem } from '../../../src/modules/inventory/entities/inventory-item.entity';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { Order } from '../../../src/modules/orders/entities/order.entity';
import { OrderItem } from '../../../src/modules/orders/entities/order-item.entity';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: Repository<InventoryItem>;
  let productRepository: Repository<Product>;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryItem),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Order),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get<Repository<InventoryItem>>(getRepositoryToken(InventoryItem));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
  });

  describe('findAll', () => {
    it('应该返回所有库存项', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 50,
          minStock: 10,
          maxStock: 200,
          costPrice: 25.0,
          supplier: '珍珠供应商',
          isActive: true,
        },
        {
          id: 2,
          name: '牛奶',
          category: 'MILK',
          currentStock: 30,
          minStock: 5,
          maxStock: 100,
          costPrice: 8.0,
          supplier: '乳制品供应商',
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.findAll();

      expect(result).toEqual(mockInventoryItems);
      expect(repository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: [],
      });
    });

    it('应该处理分页参数', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 50,
          minStock: 10,
          maxStock: 200,
          costPrice: 25.0,
          supplier: '珍珠供应商',
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockInventoryItems, 1]);

      const result = await service.findAll(0, 10);

      expect(result.data).toEqual(mockInventoryItems);
      expect(result.total).toBe(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        relations: [],
      });
    });

    it('应该支持搜索过滤', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 50,
          minStock: 10,
          maxStock: 200,
          costPrice: 25.0,
          supplier: '珍珠供应商',
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockInventoryItems, 1]);

      const result = await service.findAll(0, 10, '珍珠');

      expect(result.data).toEqual(mockInventoryItems);
      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          skip: 0,
          take: 10,
          relations: [],
        })
      );
    });
  });

  describe('findOne', () => {
    it('应该返回指定的库存项', async () => {
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        category: 'TOPPING',
        currentStock: 50,
        minStock: 10,
        maxStock: 200,
        costPrice: 25.0,
        supplier: '珍珠供应商',
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockInventoryItem);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [],
      });
    });

    it('不存在的库存项应该返回null', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('应该创建新的库存项', async () => {
      const createDto = {
        name: '新原料',
        category: 'INGREDIENT',
        unit: 'kg',
        currentStock: 100,
        minStock: 20,
        maxStock: 500,
        costPrice: 30.0,
        supplier: '新供应商',
        expirationDate: new Date('2025-06-30'),
        isActive: true,
      };

      const mockCreatedItem = {
        id: 1,
        ...createDto,
      };

      jest.spyOn(repository, 'save').mockResolvedValue(mockCreatedItem as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedItem);
      expect(repository.save).toHaveBeenCalledWith(createDto);
    });

    it('当前库存不能为负数', async () => {
      const createDto = {
        name: '错误库存',
        category: 'INGREDIENT',
        unit: 'kg',
        currentStock: -5, // 负数库存
        minStock: 0,
        maxStock: 100,
        costPrice: 10.0,
        supplier: '测试供应商',
        isActive: true,
      };

      await expect(service.create(createDto)).rejects.toThrow('当前库存不能为负数');
    });

    it('当前库存不能超过最大库存', async () => {
      const createDto = {
        name: '超量库存',
        category: 'INGREDIENT',
        unit: 'kg',
        currentStock: 150, // 超过maxStock(100)
        minStock: 20,
        maxStock: 100,
        costPrice: 10.0,
        supplier: '测试供应商',
        isActive: true,
      };

      await expect(service.create(createDto)).rejects.toThrow('当前库存不能超过最大库存');
    });
  });

  describe('update', () => {
    it('应该更新库存项', async () => {
      const updateDto = {
        name: '更新的珍珠',
        currentStock: 60,
        minStock: 15,
      };

      const mockUpdatedItem = {
        id: 1,
        name: '更新的珍珠',
        category: 'TOPPING',
        currentStock: 60,
        minStock: 15,
        maxStock: 200,
        costPrice: 25.0,
        supplier: '珍珠供应商',
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue({
        id: 1,
        name: '珍珠',
        category: 'TOPPING',
        currentStock: 50,
        minStock: 10,
        maxStock: 200,
        costPrice: 25.0,
        supplier: '珍珠供应商',
        isActive: true,
      } as any);

      jest.spyOn(repository, 'save').mockResolvedValue(mockUpdatedItem as any);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(mockUpdatedItem);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
    });

    it('不存在的库存项应该抛出异常', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update(999, { name: '不存在的更新' })).rejects.toThrow('库存项不存在');
    });
  });

  describe('remove', () => {
    it('应该软删除库存项', async () => {
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockInventoryItem,
        isActive: false,
      } as any);

      await service.remove(1);

      expect(repository.save).toHaveBeenCalledWith({
        ...mockInventoryItem,
        isActive: false,
      });
    });

    it('不存在的库存项应该抛出异常', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow('库存项不存在');
    });
  });

  describe('adjustStock', () => {
    it('应该调整库存数量', async () => {
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        currentStock: 50,
        minStock: 10,
        maxStock: 200,
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 65, // 50 + 15
      } as any);

      const result = await service.adjustStock(1, 15, '进货补货', 1);

      expect(result.currentStock).toBe(65);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
        currentStock: 65,
      }));
    });

    it('库存调整不能导致负数', async () => {
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        currentStock: 10,
        minStock: 5,
        maxStock: 200,
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);

      await expect(service.adjustStock(1, -15, '损耗', 1)).rejects.toThrow('库存不能为负数');
    });

    it('库存调整不能超过最大库存', async () => {
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        currentStock: 50,
        minStock: 10,
        maxStock: 200,
        isActive: true,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);

      await expect(service.adjustStock(1, 160, '进货补货', 1)).rejects.toThrow('库存不能超过最大库存');
    });
  });

  describe('deductStockForOrder', () => {
    it('应该为订单扣除相应库存', async () => {
      // 模拟库存项
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        category: 'TOPPING',
        currentStock: 100,
        minStock: 10,
        maxStock: 200,
        isActive: true,
      };

      // 模拟产品
      const mockProduct = {
        id: 1,
        name: '珍珠奶茶',
        requiredIngredients: [
          { inventoryItemId: 1, quantity: 0.3 }, // 每杯需要0.3kg珍珠
        ],
      };

      // 模拟订单项
      const mockOrderItems = [
        {
          product: mockProduct,
          quantity: 2, // 2杯
        },
      ];

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as any);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 99.4, // 100 - (2 * 0.3)
      } as any);

      await service.deductStockForOrder(mockOrderItems);

      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
        currentStock: 99.4,
      }));
    });

    it('库存不足时应该抛出异常', async () => {
      // 模拟低库存
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        category: 'TOPPING',
        currentStock: 0.5, // 只有0.5kg
        minStock: 10,
        maxStock: 200,
        isActive: true,
      };

      const mockProduct = {
        id: 1,
        name: '珍珠奶茶',
        requiredIngredients: [
          { inventoryItemId: 1, quantity: 0.3 }, // 每杯需要0.3kg珍珠
        ],
      };

      const mockOrderItems = [
        {
          product: mockProduct,
          quantity: 2, // 需要0.6kg，但只有0.5kg
        },
      ];

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as any);

      await expect(service.deductStockForOrder(mockOrderItems)).rejects.toThrow('库存不足');
    });
  });

  describe('getLowStockAlerts', () => {
    it('应该返回低库存警告', async () => {
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
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.getLowStockAlerts();

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe(1);
      expect(result[0].currentStock).toBe(8);
      expect(result[0].minStock).toBe(10);
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

      const result = await service.getLowStockAlerts();

      expect(result).toHaveLength(0);
    });
  });

  describe('restoreStockForOrder', () => {
    it('应该为取消的订单恢复库存', async () => {
      // 模拟库存项
      const mockInventoryItem = {
        id: 1,
        name: '珍珠',
        category: 'TOPPING',
        currentStock: 99.4, // 已经扣除后的库存
        minStock: 10,
        maxStock: 200,
        isActive: true,
      };

      // 模拟产品
      const mockProduct = {
        id: 1,
        name: '珍珠奶茶',
        requiredIngredients: [
          { inventoryItemId: 1, quantity: 0.3 }, // 每杯需要0.3kg珍珠
        ],
      };

      // 模拟订单项
      const mockOrderItems = [
        {
          product: mockProduct,
          quantity: 2, // 2杯
        },
      ];

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockInventoryItem as any);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as any);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 100, // 恢复后应该是100
      } as any);

      await service.restoreStockForOrder(mockOrderItems);

      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
        currentStock: 100,
      }));
    });
  });

  describe('getInventoryStatistics', () => {
    it('应该返回库存统计信息', async () => {
      const mockInventoryItems = [
        {
          id: 1,
          name: '珍珠',
          category: 'TOPPING',
          currentStock: 50,
          minStock: 10,
          maxStock: 200,
          costPrice: 25.0,
          isActive: true,
        },
        {
          id: 2,
          name: '牛奶',
          category: 'MILK',
          currentStock: 30,
          minStock: 20,
          maxStock: 100,
          costPrice: 8.0,
          isActive: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockInventoryItems as any);

      const result = await service.getInventoryStatistics();

      expect(result).toEqual({
        totalItems: 2,
        lowStockItems: 0,
        totalValue: 50 * 25.0 + 30 * 8.0, // 1250 + 240 = 1490
        categories: {
          TOPPING: { count: 1, totalValue: 50 * 25.0 },
          MILK: { count: 1, totalValue: 30 * 8.0 },
        },
      });
    });
  });
});