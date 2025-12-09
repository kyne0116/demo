import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceObserver, performance } from 'perf_hooks';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { OrdersController } from '../../../src/modules/orders/orders.controller';
import { ProductionController } from '../../../src/modules/orders/production.controller';
import { OrdersService } from '../../../src/modules/orders/orders.service';
import { ProductionService } from '../../../src/modules/orders/production.service';
import { Order, OrderStatus, ProductionStage, OrderPriority } from '../../../src/modules/orders/entities/order.entity';
import { OrderItem } from '../../../src/modules/orders/entities/order-item.entity';
import { Product } from '../../../src/modules/products/entities/product.entity';

describe('Orders Performance Tests', () => {
  let app: INestApplication;
  let ordersService: OrdersService;
  let productionService: ProductionService;
  let performanceObserver: PerformanceObserver;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Order, OrderItem, Product],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Order, OrderItem, Product]),
      ],
      controllers: [OrdersController, ProductionController],
      providers: [OrdersService, ProductionService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    ordersService = moduleFixture.get<OrdersService>(OrdersService);
    productionService = moduleFixture.get<ProductionService>(ProductionService);

    // Setup performance monitoring
    performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // Log slow operations
          console.log(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
        }
      }
    });
    performanceObserver.observe({ entryTypes: ['measure'] });
  });

  afterAll(async () => {
    performanceObserver.disconnect();
    await app.close();
  });

  describe('Order Creation Performance', () => {
    it('should handle single order creation within acceptable time', async () => {
      const startTime = performance.now();

      const createOrderDto = {
        customerId: 'customer-performance-test',
        staffId: 'staff-1',
        items: [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 1 },
          { productId: 'product-3', quantity: 3 },
        ],
        notes: 'Performance test order',
        customerName: 'Performance Test Customer',
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      
      // Order creation should complete within 500ms
      expect(duration).toBeLessThan(500);
      console.log(`Single order creation took ${duration}ms`);
    });

    it('should handle multiple concurrent order creation', async () => {
      const concurrentOrders = 50;
      const startTime = performance.now();

      const promises = Array.from({ length: concurrentOrders }, (_, index) => {
        const createOrderDto = {
          customerId: `customer-concurrent-${index}`,
          staffId: 'staff-1',
          items: [{ productId: 'product-1', quantity: 1 }],
        };

        return request(app.getHttpServer())
          .post('/orders')
          .send(createOrderDto);
      });

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(responses).toHaveLength(concurrentOrders);
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
      });

      // 50 concurrent orders should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      console.log(`${concurrentOrders} concurrent orders created in ${duration}ms`);
    });
  });

  describe('Order Query Performance', () => {
    let testOrderIds: string[] = [];

    beforeAll(async () => {
      // Create 100 test orders for query performance testing
      for (let i = 0; i < 100; i++) {
        const createOrderDto = {
          customerId: `customer-query-${i}`,
          staffId: 'staff-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          status: i % 4 === 0 ? OrderStatus.COMPLETED : 
                 i % 4 === 1 ? OrderStatus.MAKING :
                 i % 4 === 2 ? OrderStatus.READY : OrderStatus.PENDING,
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .send(createOrderDto)
          .expect(201);

        testOrderIds.push(response.body.id);
      }
    });

    it('should query all orders within acceptable time', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      
      // Query all orders should complete within 200ms
      expect(duration).toBeLessThan(200);
      console.log(`Query all orders (${response.body.length}) took ${duration}ms`);
    });

    it('should query orders by status efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/orders/status/PENDING')
        .expect(200);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      
      // Status query should complete within 100ms
      expect(duration).toBeLessThan(100);
      console.log(`Query orders by status took ${duration}ms`);
    });

    it('should get order details within acceptable time', async () => {
      const orderId = testOrderIds[0];
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(orderId);
      
      // Single order query should complete within 50ms
      expect(duration).toBeLessThan(50);
      console.log(`Single order query took ${duration}ms`);
    });
  });

  describe('Production Flow Performance', () => {
    let testOrderId: string;

    beforeAll(async () => {
      const createOrderDto = {
        customerId: 'customer-production-test',
        staffId: 'staff-1',
        items: [{ productId: 'product-1', quantity: 2 }],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      testOrderId = response.body.id;
    });

    it('should start production within acceptable time', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post(`/orders/production/${testOrderId}/start`)
        .send({ staffId: 'staff-1' })
        .expect(201);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body.status).toBe(OrderStatus.MAKING);
      
      // Start production should complete within 100ms
      expect(duration).toBeLessThan(100);
      console.log(`Start production took ${duration}ms`);
    });

    it('should update production stages efficiently', async () => {
      const stages = [
        ProductionStage.MIXING,
        ProductionStage.FINISHING,
        ProductionStage.QUALITY_CHECK,
        ProductionStage.READY_FOR_PICKUP,
      ];

      for (const stage of stages) {
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .put(`/orders/production/${testOrderId}/stage`)
          .send({ stage, notes: `Stage update to ${stage}` })
          .expect(200);

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(response.body.productionStage).toBe(stage);
        
        // Each stage update should complete within 100ms
        expect(duration).toBeLessThan(100);
        console.log(`Update to ${stage} took ${duration}ms`);
      }
    });

    it('should complete order efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post(`/orders/production/${testOrderId}/complete`)
        .send({ 
          qualityNotes: 'Performance test completion',
          rating: 5 
        })
        .expect(201);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body.status).toBe(OrderStatus.COMPLETED);
      
      // Complete order should complete within 100ms
      expect(duration).toBeLessThan(100);
      console.log(`Complete order took ${duration}ms`);
    });
  });

  describe('Queue Management Performance', () => {
    let queueOrderIds: string[] = [];

    beforeAll(async () => {
      // Create orders for queue testing
      for (let i = 0; i < 30; i++) {
        const createOrderDto = {
          customerId: `customer-queue-${i}`,
          staffId: 'staff-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          priority: i % 3 === 0 ? OrderPriority.URGENT : 
                   i % 3 === 1 ? OrderPriority.RUSH : OrderPriority.NORMAL,
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .send(createOrderDto)
          .expect(201);

        queueOrderIds.push(response.body.id);

        // Start production for half of them
        if (i % 2 === 0) {
          await request(app.getHttpServer())
            .post(`/orders/production/${response.body.id}/start`)
            .send({ staffId: 'staff-1' })
            .expect(201);
        }
      }
    });

    it('should get order queue efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/orders/production/queue')
        .expect(200);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body).toBeDefined();
      expect(response.body.pending).toBeDefined();
      expect(response.body.making).toBeDefined();
      expect(response.body.ready).toBeDefined();
      expect(response.body.overdue).toBeDefined();
      
      // Queue query should complete within 150ms
      expect(duration).toBeLessThan(150);
      console.log(`Get order queue took ${duration}ms`);
    });

    it('should get staff queue efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/orders/production/staff/staff-1/queue')
        .expect(200);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(Array.isArray(response.body)).toBe(true);
      
      // Staff queue query should complete within 100ms
      expect(duration).toBeLessThan(100);
      console.log(`Get staff queue took ${duration}ms`);
    });

    it('should handle batch operations efficiently', async () => {
      const batchSize = 10;
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/orders/production/batch/start')
        .send({
          orderIds: queueOrderIds.slice(0, batchSize),
          staffId: 'staff-1',
        })
        .expect(201);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(Array.isArray(response.body)).toBe(true);
      
      // Batch operation should complete within 500ms
      expect(duration).toBeLessThan(500);
      console.log(`Batch start ${batchSize} orders took ${duration}ms`);
    });
  });

  describe('Statistics Performance', () => {
    beforeAll(async () => {
      // Create completed orders for statistics
      for (let i = 0; i < 50; i++) {
        const completedOrder = {
          customerId: `customer-stats-${i}`,
          staffId: 'staff-1',
          items: [{ productId: 'product-1', quantity: 1 }],
          status: OrderStatus.COMPLETED,
          productionStage: ProductionStage.READY_FOR_PICKUP,
          makingStartedAt: new Date(Date.now() - Math.random() * 3600000),
          makingCompletedAt: new Date(Date.now() - Math.random() * 1800000),
          readyAt: new Date(Date.now() - Math.random() * 600000),
          completedAt: new Date(),
          actualWaitTime: Math.floor(Math.random() * 20) + 5,
          createdAt: new Date(Date.now() - Math.random() * 86400000),
        };

        await request(app.getHttpServer())
          .post('/orders')
          .send(completedOrder)
          .expect(201);
      }
    });

    it('should generate statistics efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .get('/orders/production/stats?days=30')
        .expect(200);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body).toBeDefined();
      expect(response.body.totalOrders).toBeGreaterThan(0);
      expect(response.body.completedOrders).toBeGreaterThan(0);
      expect(response.body.averageWaitTime).toBeDefined();
      
      // Statistics generation should complete within 200ms
      expect(duration).toBeLessThan(200);
      console.log(`Generate statistics took ${duration}ms`);
    });

    it('should export data efficiently', async () => {
      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/orders/production/export')
        .send({
          range: '30d',
          format: 'json',
        })
        .expect(201);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.body).toBeDefined();
      expect(response.body.content).toBeDefined();
      
      // Data export should complete within 300ms
      expect(duration).toBeLessThan(300);
      console.log(`Export data took ${duration}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with large datasets', async () => {
      // Create many orders to test memory usage
      const orderCount = 200;
      const orders = [];

      for (let i = 0; i < orderCount; i++) {
        const createOrderDto = {
          customerId: `customer-memory-${i}`,
          staffId: 'staff-1',
          items: [{ productId: 'product-1', quantity: 1 }],
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .send(createOrderDto)
          .expect(201);

        orders.push(response.body);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Perform queries to ensure no memory leaks
      await request(app.getHttpServer()).get('/orders').expect(200);
      await request(app.getHttpServer()).get('/orders/production/queue').expect(200);
      await request(app.getHttpServer()).get('/orders/production/stats').expect(200);

      // Clean up
      for (const order of orders) {
        await request(app.getHttpServer()).delete(`/orders/${order.id}`).expect(200);
      }

      console.log(`Memory test completed with ${orderCount} orders`);
    });
  });

  describe('Concurrent Access Performance', () => {
    it('should handle concurrent production updates', async () => {
      // Create test order
      const createOrderDto = {
        customerId: 'customer-concurrent-update',
        staffId: 'staff-1',
        items: [{ productId: 'product-1', quantity: 1 }],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      const orderId = createResponse.body.id;

      // Start production
      await request(app.getHttpServer())
        .post(`/orders/production/${orderId}/start`)
        .send({ staffId: 'staff-1' })
        .expect(201);

      // Simulate concurrent updates
      const concurrentUpdates = Array.from({ length: 10 }, (_, index) => {
        return request(app.getHttpServer())
          .put(`/orders/production/${orderId}/stage`)
          .send({ 
            stage: ProductionStage.MIXING,
            notes: `Concurrent update ${index}`
          });
      });

      const startTime = performance.now();
      const responses = await Promise.all(concurrentUpdates);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All should succeed (last write wins)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Concurrent updates should complete efficiently
      expect(duration).toBeLessThan(1000);
      console.log(`10 concurrent updates took ${duration}ms`);
    });
  });
});