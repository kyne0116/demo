import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Customer Checkout Flow Integration Tests', () => {
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

  describe('Complete Customer Checkout Flow', () => {
    it('should complete full customer checkout process', async () => {
      // Step 1: Customer browses products
      console.log('Step 1: Customer browsing products...');
      const productsResponse = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(productsResponse.body).toBeInstanceOf(Array);
      
      // 如果没有产品，先创建一个测试产品
      let testProductId;
      let testProductName;
      let testProductPrice;

      if (productsResponse.body.length === 0) {
        console.log('Creating test product...');
        const productData = {
          name: '集成测试珍珠奶茶',
          description: '用于集成测试的珍珠奶茶',
          price: 18.50,
          isActive: true,
          sortOrder: 1
        };

        const createdProduct = await request(app.getHttpServer())
          .post('/api/products')
          .send(productData)
          .expect(201);

        testProductId = createdProduct.body.id;
        testProductName = createdProduct.body.name;
        testProductPrice = createdProduct.body.price;
      } else {
        const product = productsResponse.body[0];
        testProductId = product.id;
        testProductName = product.name;
        testProductPrice = product.price;
      }

      console.log(`Selected product: ${testProductName} (ID: ${testProductId}, Price: ${testProductPrice})`);

      // Step 2: Customer adds items to cart (simulated by creating order)
      console.log('Step 2: Customer adding items to cart...');
      const checkoutData = {
        customerId: 'customer-integration-test-123', // 测试客户ID
        staffId: 'staff-integration-test-123', // 处理订单的店员
        items: [
          {
            productId: testProductId,
            productName: testProductName,
            unitPrice: testProductPrice,
            quantity: 2 // 客户购买2份
          },
          {
            productId: testProductId, // 重复产品测试
            productName: testProductName,
            unitPrice: testProductPrice,
            quantity: 1 // 再买1份
          }
        ],
        notes: '少糖，多珍珠，谢谢！'
      };

      const expectedTotal = testProductPrice * 3; // 2+1=3份
      const expectedPoints = Math.floor(expectedTotal);

      console.log(`Order total: ${expectedTotal}, Expected points: ${expectedPoints}`);

      // Step 3: Customer proceeds to checkout
      console.log('Step 3: Customer proceeding to checkout...');
      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .send(checkoutData)
        .expect(201);

      // 验证订单创建成功
      expect(orderResponse.body).toHaveProperty('id');
      expect(orderResponse.body).toHaveProperty('orderNumber');
      expect(orderResponse.body.totalAmount).toBe(expectedTotal);
      expect(orderResponse.body.finalAmount).toBe(expectedTotal);
      expect(orderResponse.body.pointsEarned).toBe(expectedPoints);
      expect(orderResponse.body.status).toBe('pending');
      expect(orderResponse.body.customerId).toBe('customer-integration-test-123');

      const orderId = orderResponse.body.id;
      console.log(`Order created: ${orderResponse.body.orderNumber} (ID: ${orderId})`);

      // Step 4: Verify order items are correct
      console.log('Step 4: Verifying order items...');
      expect(orderResponse.body.orderItems).toBeInstanceOf(Array);
      expect(orderResponse.body.orderItems.length).toBe(2);

      const item1 = orderResponse.body.orderItems[0];
      expect(item1.productName).toBe(testProductName);
      expect(item1.unitPrice).toBe(testProductPrice);
      expect(item1.quantity).toBe(2);
      expect(item1.subtotal).toBe(testProductPrice * 2);

      const item2 = orderResponse.body.orderItems[1];
      expect(item2.productName).toBe(testProductName);
      expect(item2.unitPrice).toBe(testProductPrice);
      expect(item2.quantity).toBe(1);
      expect(item2.subtotal).toBe(testProductPrice * 1);

      // Step 5: Staff processes the order (updates status)
      console.log('Step 5: Staff processing order...');
      const makingResponse = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'making' })
        .expect(200);

      expect(makingResponse.body.status).toBe('making');

      // Step 6: Order is completed
      console.log('Step 6: Order completion...');
      const completedResponse = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      expect(completedResponse.body.status).toBe('completed');
      expect(completedResponse.body).toHaveProperty('completedAt');

      // Step 7: Verify final order state
      console.log('Step 7: Verifying final order state...');
      const finalOrderResponse = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(finalOrderResponse.body.id).toBe(orderId);
      expect(finalOrderResponse.body.status).toBe('completed');
      expect(finalOrderResponse.body.pointsEarned).toBe(expectedPoints);
      expect(finalOrderResponse.body.completedAt).toBeDefined();

      console.log('✅ Complete customer checkout flow test passed!');
      console.log(`Final order: ${finalOrderResponse.body.orderNumber}`);
      console.log(`Total amount: ${finalOrderResponse.body.totalAmount}`);
      console.log(`Points earned: ${finalOrderResponse.body.pointsEarned}`);
    });

    it('should handle anonymous customer checkout', async () => {
      console.log('Testing anonymous customer checkout...');

      // 确保有可用的产品
      const productsResponse = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      if (productsResponse.body.length === 0) {
        const productData = {
          name: '匿名客户测试产品',
          price: 12.00,
          isActive: true
        };

        await request(app.getHttpServer())
          .post('/api/products')
          .send(productData)
          .expect(201);
      }

      const product = productsResponse.body[0];

      // 匿名客户下单（不提供customerId）
      const anonymousOrderData = {
        staffId: 'staff-anonymous-test-123',
        items: [
          {
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity: 1
          }
        ]
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .send(anonymousOrderData)
        .expect(201);

      expect(orderResponse.body.customerId).toBeNull();
      expect(orderResponse.body.status).toBe('pending');

      console.log('✅ Anonymous customer checkout test passed!');
    });

    it('should handle order cancellation', async () => {
      console.log('Testing order cancellation...');

      // 创建产品
      const productData = {
        name: '取消测试产品',
        price: 20.00,
        isActive: true
      };

      const productResponse = await request(app.getHttpServer())
        .post('/api/products')
        .send(productData)
        .expect(201);

      const product = productResponse.body;

      // 创建订单
      const orderData = {
        staffId: 'staff-cancel-test-123',
        items: [
          {
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity: 1
          }
        ]
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      const orderId = orderResponse.body.id;

      // 取消订单
      const cancelResponse = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/cancel`)
        .send({ reason: '客户改变主意' })
        .expect(200);

      expect(cancelResponse.body.status).toBe('cancelled');

      // 验证无法再次取消已取消的订单（状态不会改变）
      await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'making' })
        .expect(400);

      console.log('✅ Order cancellation test passed!');
    });
  });

  describe('Error Handling in Checkout Flow', () => {
    it('should handle invalid product in order', async () => {
      const orderData = {
        staffId: 'staff-error-test-123',
        items: [
          {
            productId: 'non-existent-product-id',
            productName: '不存在的产品',
            unitPrice: 15.00,
            quantity: 1
          }
        ]
      };

      // 应该能创建订单（因为我们不验证产品是否存在）
      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.status).toBe('pending');
      console.log('✅ Invalid product handling test passed!');
    });

    it('should handle empty order items', async () => {
      const invalidOrderData = {
        staffId: 'staff-empty-test-123',
        items: []
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(400);

      console.log('✅ Empty items validation test passed!');
    });

    it('should handle missing staff ID', async () => {
      const invalidOrderData = {
        // 缺少 staffId
        items: [
          {
            productId: 'product-123',
            productName: '测试产品',
            unitPrice: 10.00,
            quantity: 1
          }
        ]
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(400);

      console.log('✅ Missing staff ID validation test passed!');
    });
  });
});