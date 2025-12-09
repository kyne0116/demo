import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../../src/app.module';
import { InventoryItem } from '../../../src/modules/inventory/entities/inventory-item.entity';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { Category } from '../../../src/modules/products/entities/category.entity';
import { Order } from '../../../src/modules/orders/entities/order.entity';
import { OrderItem } from '../../../src/modules/orders/entities/order-item.entity';
import { User } from '../../../src/modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('Inventory Tracking and Stock Deduction Integration', () => {
  let app: INestApplication;
  let inventoryRepository: Repository<InventoryItem>;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  let testCategory: Category;
  let testProduct: Product;
  let testInventoryItem: InventoryItem;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    inventoryRepository = moduleFixture.get<Repository<InventoryItem>>(
      getRepositoryToken(InventoryItem),
    );
    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    orderRepository = moduleFixture.get<Repository<Order>>(
      getRepositoryToken(Order),
    );
    orderItemRepository = moduleFixture.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // 创建测试用户
    testUser = userRepository.create({
      username: 'test-customer@test.com',
      password: 'password123',
      email: 'test-customer@test.com',
      roles: ['CUSTOMER'],
      isActive: true,
    });
    await userRepository.save(testUser);

    // 生成认证token
    authToken = jwtService.sign({
      sub: testUser.id,
      username: testUser.username,
      roles: testUser.roles,
    });

    // 创建测试类别
    testCategory = categoryRepository.create({
      name: '奶茶',
      description: '各种口味的奶茶',
      isActive: true,
    });
    await categoryRepository.save(testCategory);

    // 创建测试库存项（珍珠奶茶的原料）
    testInventoryItem = inventoryRepository.create({
      name: '珍珠',
      category: 'TOPPING',
      unit: 'kg',
      currentStock: 50, // 初始库存50kg
      minStock: 10,
      maxStock: 200,
      costPrice: 25.0,
      supplier: '珍珠供应商',
      isActive: true,
    });
    await inventoryRepository.save(testInventoryItem);

    // 创建测试产品（珍珠奶茶）
    testProduct = productRepository.create({
      name: '珍珠奶茶',
      description: '经典珍珠奶茶',
      price: 18.0,
      category: testCategory,
      imageUrl: '/images/milk-tea.jpg',
      isAvailable: true,
      isActive: true,
    });
    await productRepository.save(testProduct);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('订单创建时的库存验证', () => {
    it('应该拒绝库存不足的订单', async () => {
      // 首先将库存设置为很低的数量
      testInventoryItem.currentStock = 2; // 设置为2kg，低于最小库存
      await inventoryRepository.save(testInventoryItem);

      const orderData = {
        customerId: testUser.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 3, // 需要3份，每份需要0.5kg珍珠
            customizations: {
              sweetness: 'normal',
              iceLevel: 'normal',
            },
          },
        ],
        paymentMethod: 'CASH',
        notes: '测试订单',
      };

      // 由于库存不足，订单创建应该失败
      // 这里我们模拟库存不足的情况
      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      // 预期订单创建失败（具体错误码取决于实现）
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('应该允许库存充足的订单', async () => {
      // 确保库存充足
      testInventoryItem.currentStock = 50;
      await inventoryRepository.save(testInventoryItem);

      const orderData = {
        customerId: testUser.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 2,
            customizations: {
              sweetness: 'normal',
              iceLevel: 'normal',
            },
          },
        ],
        paymentMethod: 'CASH',
        notes: '测试订单',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
    });
  });

  describe('订单确认时的库存自动扣除', () => {
    let testOrder: Order;
    let initialStock: number;

    beforeEach(async () => {
      // 设置初始库存
      testInventoryItem.currentStock = 100;
      await inventoryRepository.save(testInventoryItem);
      initialStock = testInventoryItem.currentStock;

      // 创建测试订单
      testOrder = orderRepository.create({
        customer: testUser,
        totalAmount: 36.0, // 2杯奶茶 * 18元
        status: 'PENDING',
        paymentMethod: 'CASH',
        notes: '测试库存扣除订单',
      });
      await orderRepository.save(testOrder);

      // 创建订单项
      const orderItem = orderItemRepository.create({
        order: testOrder,
        product: testProduct,
        quantity: 2,
        unitPrice: 18.0,
        subtotal: 36.0,
        customizations: {
          sweetness: 'normal',
          iceLevel: 'normal',
        },
      });
      await orderItemRepository.save(orderItem);
    });

    afterEach(async () => {
      // 清理测试数据
      if (testOrder) {
        await orderItemRepository.delete({ order: testOrder });
        await orderRepository.delete(testOrder.id);
      }
    });

    it('确认订单后应该自动扣除相应库存', async () => {
      // 模拟确认订单的API调用
      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${testOrder.id}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      expect(response.status).toBe(200);

      // 验证库存是否被正确扣除
      const updatedInventory = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });

      // 假设每杯珍珠奶茶需要0.3kg珍珠，2杯应该扣除0.6kg
      const expectedDeduction = 0.6;
      expect(updatedInventory.currentStock).toBe(initialStock - expectedDeduction);
    });

    it('部分订单确认时应该只扣除已确认部分的库存', async () => {
      // 创建多份订单项的订单
      const additionalOrderItem = orderItemRepository.create({
        order: testOrder,
        product: testProduct,
        quantity: 3, // 总共5杯
        unitPrice: 18.0,
        subtotal: 54.0,
        customizations: {
          sweetness: 'sweet',
          iceLevel: 'less',
        },
      });
      await orderItemRepository.save(additionalOrderItem);

      // 模拟部分确认（比如先确认3杯）
      const partialConfirmation = {
        items: [
          {
            productId: testProduct.id,
            quantity: 3, // 只确认3杯
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/orders/${testOrder.id}/confirm-partial`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialConfirmation);

      expect(response.status).toBe(200);

      // 验证库存扣除是否正确（3杯 * 0.3kg = 0.9kg）
      const updatedInventory = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      const expectedDeduction = 0.9;
      expect(updatedInventory.currentStock).toBe(initialStock - expectedDeduction);
    });

    it('订单取消后应该恢复库存', async () => {
      // 首先确认订单（扣除库存）
      await request(app.getHttpServer())
        .patch(`/api/orders/${testOrder.id}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      // 验证库存已扣除
      const afterConfirmation = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(afterConfirmation.currentStock).toBeLessThan(initialStock);

      // 取消订单
      const cancelResponse = await request(app.getHttpServer())
        .patch(`/api/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: '客户取消' });

      expect(cancelResponse.status).toBe(200);

      // 验证库存已恢复
      const afterCancellation = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(afterCancellation.currentStock).toBe(initialStock);
    });
  });

  describe('库存预警系统', () => {
    it('低库存时应该触发预警', async () => {
      // 设置低库存
      testInventoryItem.currentStock = 8; // 低于minStock(10)
      await inventoryRepository.save(testInventoryItem);

      const response = await request(app.getHttpServer())
        .get('/api/inventory/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.alerts).toBeDefined();
      expect(Array.isArray(response.body.alerts)).toBe(true);

      // 应该有预警信息
      const hasLowStockAlert = response.body.alerts.some(
        (alert: any) => 
          alert.itemId === testInventoryItem.id && 
          alert.currentStock <= alert.minStock
      );
      expect(hasLowStockAlert).toBe(true);
    });

    it('正常库存时不应该有预警', async () => {
      // 设置正常库存
      testInventoryItem.currentStock = 50;
      await inventoryRepository.save(testInventoryItem);

      const response = await request(app.getHttpServer())
        .get('/api/inventory/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 检查是否还有针对这个库存项的预警
      const hasLowStockAlert = response.body.alerts.some(
        (alert: any) => alert.itemId === testInventoryItem.id
      );
      expect(hasLowStockAlert).toBe(false);
    });
  });

  describe('库存调整功能', () => {
    beforeEach(async () => {
      testInventoryItem.currentStock = 20;
      await inventoryRepository.save(testInventoryItem);
    });

    it('应该能够手动调整库存', async () => {
      const adjustmentData = {
        adjustment: 10, // 增加10kg
        reason: '进货补货',
        adjustedBy: testUser.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/inventory/${testInventoryItem.id}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(adjustmentData);

      expect(response.status).toBe(200);
      expect(response.body.currentStock).toBe(30); // 20 + 10

      // 验证库存记录
      const updatedItem = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(updatedItem.currentStock).toBe(30);
    });

    it('库存调整不应该导致负数', async () => {
      const invalidAdjustment = {
        adjustment: -25, // 试图调整为负数
        reason: '损耗过多',
        adjustedBy: testUser.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/inventory/${testInventoryItem.id}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAdjustment);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('库存不能为负数');
    });

    it('库存调整应该记录调整历史', async () => {
      const adjustmentData = {
        adjustment: 5,
        reason: '损耗调整',
        adjustedBy: testUser.id,
      };

      await request(app.getHttpServer())
        .post(`/api/inventory/${testInventoryItem.id}/adjust`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(adjustmentData);

      // 这里应该验证调整记录被保存
      // 具体实现取决于OperationLog的记录逻辑
      const response = await request(app.getHttpServer())
        .get(`/api/inventory/${testInventoryItem.id}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.history).toBeDefined();
      expect(response.body.history.length).toBeGreaterThan(0);
    });
  });

  describe('产品下架时的库存处理', () => {
    it('产品下架时应该保持库存记录', async () => {
      // 确保产品下架
      testProduct.isAvailable = false;
      await productRepository.save(testProduct);

      // 库存应该仍然存在
      const inventory = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(inventory).toBeDefined();
      expect(inventory.isActive).toBe(true);
    });

    it('产品删除时应该处理相关库存', async () => {
      const productId = testProduct.id;
      
      // 删除产品
      await request(app.getHttpServer())
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 产品应该被删除
      const deletedProduct = await productRepository.findOne({
        where: { id: productId },
      });
      expect(deletedProduct).toBeNull();

      // 但是库存项应该保留（可能被其他产品使用）
      const inventory = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(inventory).toBeDefined();
    });
  });
});