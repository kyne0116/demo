import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Orders API Contract Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '珍珠奶茶',
            unitPrice: 18.50,
            quantity: 2
          },
          {
            productId: 'product-uuid-2',
            productName: '芒果布丁',
            unitPrice: 15.00,
            quantity: 1
          }
        ],
        notes: '少糖，谢谢'
      };

      const expectedTotal = 18.50 * 2 + 15.00 * 1; // 52.00

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('totalAmount');
      expect(response.body).toHaveProperty('finalAmount');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pointsEarned');
      
      // 验证订单计算
      expect(response.body.totalAmount).toBe(expectedTotal);
      expect(response.body.finalAmount).toBe(expectedTotal); // 没有折扣
      expect(response.body.pointsEarned).toBe(Math.floor(expectedTotal)); // 积分=消费金额
      expect(response.body.status).toBe('pending');
      
      // 验证订单项
      expect(response.body.orderItems).toBeInstanceOf(Array);
      expect(response.body.orderItems.length).toBe(2);
      
      // 验证第一个订单项
      const firstItem = response.body.orderItems[0];
      expect(firstItem.productName).toBe('珍珠奶茶');
      expect(firstItem.unitPrice).toBe(18.50);
      expect(firstItem.quantity).toBe(2);
      expect(firstItem.subtotal).toBe(37.00);
    });

    it('should create order with customer', async () => {
      const orderData = {
        customerId: 'customer-uuid-123',
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '测试产品',
            unitPrice: 10.00,
            quantity: 1
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.customerId).toBe('customer-uuid-123');
    });

    it('should create order without customer (anonymous)', async () => {
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '匿名购买产品',
            unitPrice: 12.00,
            quantity: 1
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.customerId).toBeNull();
    });

    it('should validate required fields', async () => {
      const invalidOrder = {
        // 缺少 staffId 和 items
        notes: '无效订单'
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(invalidOrder)
        .expect(400);
    });

    it('should validate items array is not empty', async () => {
      const invalidOrder = {
        staffId: 'staff-uuid-123',
        items: [] // 空数组
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(invalidOrder)
        .expect(400);
    });

    it('should validate item structure', async () => {
      const invalidOrder = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            // 缺少 productName, unitPrice, quantity
          }
        ]
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(invalidOrder)
        .expect(400);
    });

    it('should calculate order with multiple quantities', async () => {
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '大批量产品',
            unitPrice: 25.00,
            quantity: 5
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.totalAmount).toBe(125.00); // 25.00 * 5
      expect(response.body.orderItems[0].subtotal).toBe(125.00);
    });
  });

  describe('GET /api/orders', () => {
    it('should return a list of orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
      
      // 如果有订单，验证订单结构
      if (response.body.length > 0) {
        const order = response.body[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('orderNumber');
        expect(order).toHaveProperty('totalAmount');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('orderItems');
      }
    });

    it('should include order items in response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders')
        .expect(200);

      // 如果有订单，验证订单项结构
      if (response.body.length > 0) {
        const order = response.body[0];
        expect(order.orderItems).toBeInstanceOf(Array);
        
        if (order.orderItems.length > 0) {
          const item = order.orderItems[0];
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('productId');
          expect(item).toHaveProperty('productName');
          expect(item).toHaveProperty('unitPrice');
          expect(item).toHaveProperty('quantity');
          expect(item).toHaveProperty('subtotal');
        }
      }
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return a specific order', async () => {
      // 首先创建一个订单
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '特定订单产品',
            unitPrice: 20.00,
            quantity: 1
          }
        ]
      };

      const createdOrder = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const orderId = createdOrder.body.id;

      // 然后获取该订单
      const response = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body).toHaveProperty('orderItems');
      expect(response.body.orderItems).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/api/orders/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status to making', async () => {
      // 创建订单
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '状态测试产品',
            unitPrice: 15.00,
            quantity: 1
          }
        ]
      };

      const createdOrder = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const orderId = createdOrder.body.id;

      // 更新状态为制作中
      const updateData = { status: 'making' };

      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('making');
    });

    it('should update order status to completed', async () => {
      // 创建订单
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '完成测试产品',
            unitPrice: 18.00,
            quantity: 1
          }
        ]
      };

      const createdOrder = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const orderId = createdOrder.body.id;

      // 更新状态为已完成
      const updateData = { status: 'completed' };

      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body).toHaveProperty('completedAt');
    });

    it('should update order status to cancelled', async () => {
      // 创建订单
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '取消测试产品',
            unitPrice: 12.00,
            quantity: 1
          }
        ]
      };

      const createdOrder = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const orderId = createdOrder.body.id;

      // 取消订单
      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/cancel`)
        .send({ reason: '客户要求取消' })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });

    it('should return 404 for non-existent order when updating status', async () => {
      const updateData = { status: 'making' };

      await request(app.getHttpServer())
        .patch('/api/orders/non-existent-id/status')
        .send(updateData)
        .expect(404);
    });

    it('should not allow cancelling completed orders', async () => {
      // 创建订单
      const orderData = {
        staffId: 'staff-uuid-123',
        items: [
          {
            productId: 'product-uuid-1',
            productName: '已完成测试产品',
            unitPrice: 16.00,
            quantity: 1
          }
        ]
      };

      const createdOrder = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const orderId = createdOrder.body.id;

      // 先标记为已完成
      await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      // 尝试取消已完成的订单
      await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/cancel`)
        .send({ reason: '试图取消已完成订单' })
        .expect(400);
    });
  });
});