import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from '../../../src/modules/orders/orders.service';
import { ProductionService } from '../../../src/modules/orders/production.service';
import { Order, OrderStatus, ProductionStage } from '../../../src/modules/orders/entities/order.entity';
import { OrderItem } from '../../../src/modules/orders/entities/order-item.entity';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { OrderCalculationService } from '../../../src/modules/orders/services/order-calculation.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let productionService: ProductionService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let productRepository: Repository<Product>;

  const mockOrderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockOrderItemRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockProductionService = {
    getProductionProgress: jest.fn(),
    startProduction: jest.fn(),
    updateProductionStage: jest.fn(),
    completeOrder: jest.fn(),
    getOrderQueue: jest.fn(),
    getStaffQueue: jest.fn(),
    getProductionStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrderCalculationService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: ProductionService,
          useValue: mockProductionService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    productionService = module.get<ProductionService>(ProductionService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          status: OrderStatus.PENDING,
          productionStage: ProductionStage.NOT_STARTED,
          totalItems: 2,
          waitTimeInMinutes: 5,
          isOverdue: false,
          productionProgress: 0,
          createdAt: new Date(),
          orderItems: [],
        },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        relations: ['orderItems'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: OrderStatus.PENDING,
        productionStage: ProductionStage.NOT_STARTED,
        totalItems: 2,
        waitTimeInMinutes: 5,
        isOverdue: false,
        productionProgress: 0,
        createdAt: new Date(),
        orderItems: [],
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('1');

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['orderItems'],
      });
    });

    it('should return null if order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto = {
        customerId: 'customer-1',
        staffId: 'staff-1',
        items: [
          { productId: 'product-1', quantity: 2 },
        ],
        notes: 'Test order',
      };

      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 25.00,
      };

      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        ...createOrderDto,
        totalAmount: 50.00,
        discountAmount: 0,
        finalAmount: 50.00,
        status: OrderStatus.PENDING,
        productionStage: ProductionStage.NOT_STARTED,
        createdAt: new Date(),
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const orderId = '1';
      const status = OrderStatus.COMPLETED;

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        updatedAt: new Date(),
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status });

      const result = await service.updateStatus(orderId, status);

      expect(result.status).toBe(status);
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw error if order not found', async () => {
      const orderId = 'non-existent';
      const status = OrderStatus.COMPLETED;

      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(orderId, status)).rejects.toThrow(
        '订单不存在'
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const orderId = '1';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        updatedAt: new Date(),
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

      const result = await service.cancelOrder(orderId);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should restore inventory if order is being cancelled during production', async () => {
      const orderId = '1';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.MAKING,
        productionStage: ProductionStage.MIXING,
        orderItems: [
          { productId: 'product-1', quantity: 2 },
        ],
        updatedAt: new Date(),
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED });

      const result = await service.cancelOrder(orderId);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      const orderId = '1';
      const updateOrderDto = {
        notes: 'Updated notes',
        customerName: 'Updated Customer',
      };

      const mockOrder = {
        id: orderId,
        notes: 'Original notes',
        customerName: 'Original Customer',
        updatedAt: new Date(),
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, ...updateOrderDto });

      const result = await service.update(orderId, updateOrderDto);

      expect(result.notes).toBe('Updated notes');
      expect(result.customerName).toBe('Updated Customer');
      expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw error if order not found', async () => {
      const orderId = 'non-existent';
      const updateOrderDto = { notes: 'Updated notes' };

      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.update(orderId, updateOrderDto)).rejects.toThrow(
        '订单不存在'
      );
    });
  });

  describe('remove', () => {
    it('should remove an order', async () => {
      const orderId = '1';

      mockOrderRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(orderId);

      expect(mockOrderRepository.delete).toHaveBeenCalledWith({ id: orderId });
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        totalOrders: 100,
        completedOrders: 90,
        cancelledOrders: 5,
        pendingOrders: 5,
        averageAmount: 45.50,
      };

      mockOrderRepository.count.mockResolvedValue(100);
      mockOrderRepository.find.mockResolvedValue([]);

      const result = await service.getOrderStats();

      expect(result).toBeDefined();
      expect(typeof result.totalOrders).toBe('number');
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for a specific customer', async () => {
      const customerId = 'customer-1';
      const mockOrders = [
        {
          id: '1',
          customerId: customerId,
          orderNumber: 'ORD-001',
        },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findByCustomer(customerId);

      expect(result).toEqual(mockOrders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { customerId },
        relations: ['orderItems'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return orders filtered by status', async () => {
      const status = OrderStatus.PENDING;
      const mockOrders = [
        {
          id: '1',
          status: status,
          orderNumber: 'ORD-001',
        },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findByStatus(status);

      expect(result).toEqual(mockOrders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { status },
        relations: ['orderItems'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});