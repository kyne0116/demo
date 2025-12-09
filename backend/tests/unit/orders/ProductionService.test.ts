import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductionService } from '../../../src/modules/orders/production.service';
import { Order, OrderStatus, ProductionStage, OrderPriority } from '../../../src/modules/orders/entities/order.entity';
import { OrderItem } from '../../../src/modules/orders/entities/order-item.entity';

describe('ProductionService', () => {
  let service: ProductionService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;

  const mockOrderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockOrderItemRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProductionProgress', () => {
    it('should return production progress for a valid order', async () => {
      const mockOrder = {
        id: '1',
        productionStage: ProductionStage.MIXING,
        status: OrderStatus.MAKING,
        makingStartedAt: new Date(),
        orderItems: [],
        createdAt: new Date(),
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.getProductionProgress('1');

      expect(result).toBeDefined();
      expect(result.orderId).toBe('1');
      expect(result.currentStage).toBe(ProductionStage.MIXING);
      expect(result.progress).toBeGreaterThan(0);
      expect(result.canStartNext).toBe(true);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.getProductionProgress('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('startProduction', () => {
    it('should start production for a pending order', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.PENDING,
        productionStage: ProductionStage.NOT_STARTED,
        estimatedWaitTime: 0,
        createdAt: new Date(),
      };

      const mockSavedOrder = {
        ...mockOrder,
        status: OrderStatus.MAKING,
        productionStage: ProductionStage.PREPARING,
        makingStartedAt: new Date(),
        assignedTo: 'staff-1',
        estimatedWaitTime: 10,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockSavedOrder);

      const result = await service.startProduction('1', 'staff-1');

      expect(result.status).toBe(OrderStatus.MAKING);
      expect(result.productionStage).toBe(ProductionStage.PREPARING);
      expect(result.assignedTo).toBe('staff-1');
      expect(result.estimatedWaitTime).toBeGreaterThan(0);
    });

    it('should throw BadRequestException for order in wrong status', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.MAKING,
        productionStage: ProductionStage.PREPARING,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.startProduction('1', 'staff-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for order already started', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.PENDING,
        productionStage: ProductionStage.PREPARING,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.startProduction('1', 'staff-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateProductionStage', () => {
    it('should update production stage', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.MAKING,
        productionStage: ProductionStage.PREPARING,
        notes: '',
        updatedAt: new Date(),
      };

      const mockSavedOrder = {
        ...mockOrder,
        productionStage: ProductionStage.MIXING,
        notes: '[制作进度] mixing: Stage updated',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockSavedOrder);

      const result = await service.updateProductionStage('1', ProductionStage.MIXING);

      expect(result.productionStage).toBe(ProductionStage.MIXING);
      expect(result.notes).toContain('[制作进度]');
    });

    it('should throw BadRequestException for invalid stage transition', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.MAKING,
        productionStage: ProductionStage.PREPARING,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.updateProductionStage('1', ProductionStage.QUALITY_CHECK)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for order not in making status', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.PENDING,
        productionStage: ProductionStage.NOT_STARTED,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.updateProductionStage('1', ProductionStage.PREPARING)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeOrder', () => {
    it('should complete a ready order', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.READY,
        productionStage: ProductionStage.READY_FOR_PICKUP,
        makingStartedAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSavedOrder = {
        ...mockOrder,
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockSavedOrder);

      const result = await service.completeOrder('1', 'Quality notes', 5);

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
      expect(result.qualityNotes).toBe('Quality notes');
      expect(result.rating).toBe(5);
    });

    it('should throw BadRequestException for order not ready', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.MAKING,
        productionStage: ProductionStage.MIXING,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.completeOrder('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignOrder', () => {
    it('should assign order to staff', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.PENDING,
        updatedAt: new Date(),
      };

      const mockSavedOrder = {
        ...mockOrder,
        assignedTo: 'staff-1',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockSavedOrder);

      const result = await service.assignOrder('1', 'staff-1');

      expect(result.assignedTo).toBe('staff-1');
    });

    it('should throw BadRequestException for order not in pending status', async () => {
      const mockOrder = {
        id: '1',
        status: OrderStatus.MAKING,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.assignOrder('1', 'staff-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getOrderQueue', () => {
    it('should return categorized order queue', async () => {
      const mockOrders = [
        {
          id: '1',
          status: OrderStatus.PENDING,
          isOverdue: false,
          createdAt: new Date(),
        },
        {
          id: '2',
          status: OrderStatus.MAKING,
          isOverdue: false,
          createdAt: new Date(),
        },
        {
          id: '3',
          status: OrderStatus.READY,
          isOverdue: false,
          createdAt: new Date(),
        },
        {
          id: '4',
          status: OrderStatus.PENDING,
          isOverdue: true,
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getOrderQueue();

      expect(result).toBeDefined();
      expect(result.pending).toHaveLength(1);
      expect(result.making).toHaveLength(1);
      expect(result.ready).toHaveLength(1);
      expect(result.overdue).toHaveLength(1);
    });
  });

  describe('getStaffQueue', () => {
    it('should return orders assigned to specific staff', async () => {
      const mockOrders = [
        {
          id: '1',
          status: OrderStatus.PENDING,
          assignedTo: 'staff-1',
        },
        {
          id: '2',
          status: OrderStatus.MAKING,
          assignedTo: 'staff-1',
        },
        {
          id: '3',
          status: OrderStatus.PENDING,
          assignedTo: 'staff-2',
        },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getStaffQueue('staff-1');

      expect(result).toHaveLength(2);
      expect(result.every(order => order.assignedTo === 'staff-1')).toBe(true);
    });
  });

  describe('setOrderPriority', () => {
    it('should set order priority', async () => {
      const mockOrder = {
        id: '1',
        priority: OrderPriority.NORMAL,
        updatedAt: new Date(),
      };

      const mockSavedOrder = {
        ...mockOrder,
        priority: OrderPriority.URGENT,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockSavedOrder);

      const result = await service.setOrderPriority('1', OrderPriority.URGENT);

      expect(result.priority).toBe(OrderPriority.URGENT);
    });
  });

  describe('startBatchProduction', () => {
    it('should start production for multiple orders', async () => {
      const orderIds = ['1', '2', '3'];
      const staffId = 'staff-1';

      // Mock the startProduction method to succeed for all orders
      jest.spyOn(service, 'startProduction').mockResolvedValue({
        id: '1',
        status: OrderStatus.MAKING,
        productionStage: ProductionStage.PREPARING,
      } as Order);

      const result = await service.startBatchProduction(orderIds, staffId);

      expect(result).toHaveLength(3);
      expect(service.startProduction).toHaveBeenCalledTimes(3);
      orderIds.forEach(orderId => {
        expect(service.startProduction).toHaveBeenCalledWith(orderId, staffId);
      });
    });

    it('should handle partial failures gracefully', async () => {
      const orderIds = ['1', '2', '3'];
      const staffId = 'staff-1';

      // Mock first order to succeed, second to fail, third to succeed
      jest.spyOn(service, 'startProduction')
        .mockResolvedValueOnce({
          id: '1',
          status: OrderStatus.MAKING,
          productionStage: ProductionStage.PREPARING,
        } as Order)
        .mockRejectedValueOnce(new Error('Inventory insufficient'))
        .mockResolvedValueOnce({
          id: '3',
          status: OrderStatus.MAKING,
          productionStage: ProductionStage.PREPARING,
        } as Order);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await service.startBatchProduction(orderIds, staffId);

      expect(result).toHaveLength(2); // Only successful orders
      expect(consoleSpy).toHaveBeenCalledTimes(1); // One error logged

      consoleSpy.mockRestore();
    });
  });

  describe('estimateProductionTime', () => {
    it('should estimate production time based on items', async () => {
      const items = [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ];

      const mockOrderItem = {
        productId: 'product-1',
        product: {
          recipes: [{ id: '1' }, { id: '2' }], // 2 recipes
        },
      };

      mockOrderItemRepository.findOne.mockResolvedValue(mockOrderItem);

      const result = await service.estimateProductionTime(items);

      expect(result).toBeGreaterThanOrEqual(5); // Minimum 5 minutes
      expect(typeof result).toBe('number');
    });
  });

  describe('getProductionStats', () => {
    it('should return production statistics', async () => {
      const mockOrders = [
        {
          status: OrderStatus.COMPLETED,
          isOverdue: false,
          actualWaitTime: 10,
          completedAt: new Date(),
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          status: OrderStatus.COMPLETED,
          isOverdue: false,
          actualWaitTime: 15,
          completedAt: new Date(),
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          status: OrderStatus.CANCELLED,
          isOverdue: false,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          status: OrderStatus.PENDING,
          isOverdue: true,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getProductionStats(30);

      expect(result).toBeDefined();
      expect(result.totalOrders).toBe(4);
      expect(result.completedOrders).toBe(2);
      expect(result.cancelledOrders).toBe(1);
      expect(result.averageWaitTime).toBe(12.5); // (10 + 15) / 2
      expect(result.overdueRate).toBe(25); // 1/4 * 100
      expect(result.completionRate).toBe(50); // 2/4 * 100
    });
  });

  describe('utility methods', () => {
    describe('calculateEstimatedTime', () => {
      it('should calculate estimated time correctly', () => {
        const mockOrder = {
          totalItems: 3,
          orderItems: [
            { product: { recipes: [] } },
            { product: { recipes: [{ id: '1' }] } },
            { product: { recipes: [{ id: '1' }, { id: '2' }] } },
          ],
        };

        const result = service['calculateEstimatedTime'](mockOrder as any);
        
        expect(result).toBe(9); // 3*3 + 0 + 0.5 + 1 = 9.5 -> should be rounded up or handled
      });

      it('should return minimum time for orders with no items', () => {
        const mockOrder = {
          totalItems: 0,
          orderItems: [],
        };

        const result = service['calculateEstimatedTime'](mockOrder as any);
        
        expect(result).toBe(5); // Minimum 5 minutes
      });
    });

    describe('calculateProgress', () => {
      it('should calculate progress percentage correctly', () => {
        const mockOrder = {
          id: '1',
          productionStage: ProductionStage.MIXING,
          status: OrderStatus.MAKING,
          makingStartedAt: new Date(),
          orderItems: [],
          createdAt: new Date(),
        };

        const result = service['calculateProgress'](mockOrder as any);
        
        expect(result.progress).toBe(40); // 2/5 stages * 100
        expect(result.currentStage).toBe(ProductionStage.MIXING);
        expect(result.canStartNext).toBe(true);
      });

      it('should return 0 progress for not started stage', () => {
        const mockOrder = {
          id: '1',
          productionStage: ProductionStage.NOT_STARTED,
          status: OrderStatus.PENDING,
          makingStartedAt: null,
          orderItems: [],
          createdAt: new Date(),
        };

        const result = service['calculateProgress'](mockOrder as any);
        
        expect(result.progress).toBe(0);
        expect(result.canStartNext).toBe(true);
      });

      it('should not allow next stage for final stage', () => {
        const mockOrder = {
          id: '1',
          productionStage: ProductionStage.READY_FOR_PICKUP,
          status: OrderStatus.READY,
          makingStartedAt: new Date(),
          orderItems: [],
          createdAt: new Date(),
        };

        const result = service['calculateProgress'](mockOrder as any);
        
        expect(result.progress).toBe(100);
        expect(result.canStartNext).toBe(false);
      });
    });
  });
});