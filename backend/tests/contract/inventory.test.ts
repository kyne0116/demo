import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../../src/app.module';
import { InventoryItem } from '../../../src/modules/inventory/entities/inventory-item.entity';
import { User } from '../../../src/modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('Inventory Management Contract Tests', () => {
  let app: INestApplication;
  let inventoryRepository: Repository<InventoryItem>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let adminToken: string;
  let managerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    inventoryRepository = moduleFixture.get<Repository<InventoryItem>>(
      getRepositoryToken(InventoryItem),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // 创建测试用户
    const adminUser = userRepository.create({
      username: 'admin@test.com',
      password: 'password123',
      email: 'admin@test.com',
      roles: ['ADMIN'],
      isActive: true,
    });

    const managerUser = userRepository.create({
      username: 'manager@test.com',
      password: 'password123',
      email: 'manager@test.com',
      roles: ['MANAGER'],
      isActive: true,
    });

    await userRepository.save([adminUser, managerUser]);

    // 生成测试JWT token
    adminToken = jwtService.sign({
      sub: adminUser.id,
      username: adminUser.username,
      roles: adminUser.roles,
    });

    managerToken = jwtService.sign({
      sub: managerUser.id,
      username: managerUser.username,
      roles: managerUser.roles,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/inventory - 库存列表', () => {
    it('管理员可以查看所有库存', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('经理可以查看库存', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
    });

    it('收银员无法访问库存管理', async () => {
      const cashierToken = jwtService.sign({
        username: 'cashier@test.com',
        roles: ['CASHIER'],
      });

      await request(app.getHttpServer())
        .get('/api/inventory')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('未授权访问被拒绝', async () => {
      await request(app.getHttpServer())
        .get('/api/inventory')
        .expect(401);
    });
  });

  describe('GET /api/inventory/:id - 库存详情', () => {
    let testInventoryItem: InventoryItem;

    beforeEach(async () => {
      testInventoryItem = inventoryRepository.create({
        name: '珍珠粉圆',
        category: 'TOPPINGS',
        unit: 'kg',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        costPrice: 25.0,
        supplier: '原料供应商A',
        expirationDate: new Date('2025-03-15'),
        isActive: true,
      });
      await inventoryRepository.save(testInventoryItem);
    });

    afterEach(async () => {
      await inventoryRepository.delete(testInventoryItem.id);
    });

    it('返回库存详细信息', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/inventory/${testInventoryItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testInventoryItem.id);
      expect(response.body.name).toBe('珍珠粉圆');
      expect(response.body.category).toBe('TOPPINGS');
      expect(response.body.currentStock).toBe(50);
    });

    it('不存在的库存返回404', async () => {
      await request(app.getHttpServer())
        .get('/api/inventory/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/inventory - 创建库存项', () => {
    const validInventoryData = {
      name: '红茶茶叶',
      category: 'TEA',
      unit: 'kg',
      currentStock: 100,
      minStock: 20,
      maxStock: 500,
      costPrice: 120.0,
      supplier: '茶供应商B',
      expirationDate: '2025-06-30',
      isActive: true,
    };

    it('管理员可以创建库存项', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validInventoryData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('红茶茶叶');
      expect(response.body.category).toBe('TEA');
    });

    it('经理可以创建库存项', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validInventoryData)
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('收银员无法创建库存项', async () => {
      const cashierToken = jwtService.sign({
        username: 'cashier@test.com',
        roles: ['CASHIER'],
      });

      await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(validInventoryData)
        .expect(403);
    });

    it('创建失败返回400（缺少必填字段）', async () => {
      const invalidData = {
        name: '测试商品',
        // 缺少category, unit等必填字段
      };

      await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('创建失败返回400（库存超出范围）', async () => {
      const invalidData = {
        ...validInventoryData,
        currentStock: 0, // 当前库存不能为0
      };

      await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/inventory/:id - 更新库存项', () => {
    let testInventoryItem: InventoryItem;

    beforeEach(async () => {
      testInventoryItem = inventoryRepository.create({
        name: '牛奶',
        category: 'MILK',
        unit: 'L',
        currentStock: 30,
        minStock: 5,
        maxStock: 100,
        costPrice: 8.0,
        supplier: '乳制品供应商',
        expirationDate: new Date('2025-02-28'),
        isActive: true,
      });
      await inventoryRepository.save(testInventoryItem);
    });

    afterEach(async () => {
      await inventoryRepository.delete(testInventoryItem.id);
    });

    it('管理员可以更新库存项', async () => {
      const updateData = {
        name: '更新后的牛奶',
        currentStock: 40,
        minStock: 8,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/inventory/${testInventoryItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('更新后的牛奶');
      expect(response.body.currentStock).toBe(40);
      expect(response.body.minStock).toBe(8);
    });

    it('经理可以更新库存项', async () => {
      const updateData = {
        currentStock: 35,
      };

      await request(app.getHttpServer())
        .put(`/api/inventory/${testInventoryItem.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      const updatedItem = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(updatedItem.currentStock).toBe(35);
    });

    it('收银员无法更新库存项', async () => {
      const cashierToken = jwtService.sign({
        username: 'cashier@test.com',
        roles: ['CASHIER'],
      });

      const updateData = {
        currentStock: 35,
      };

      await request(app.getHttpServer())
        .put(`/api/inventory/${testInventoryItem.id}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/inventory/:id - 删除库存项', () => {
    let testInventoryItem: InventoryItem;

    beforeEach(async () => {
      testInventoryItem = inventoryRepository.create({
        name: '测试库存项',
        category: 'TEST',
        unit: 'unit',
        currentStock: 10,
        minStock: 2,
        maxStock: 50,
        costPrice: 5.0,
        supplier: '测试供应商',
        isActive: true,
      });
      await inventoryRepository.save(testInventoryItem);
    });

    afterEach(async () => {
      await inventoryRepository.delete(testInventoryItem.id);
    });

    it('管理员可以删除库存项', async () => {
      await request(app.getHttpServer())
        .delete(`/api/inventory/${testInventoryItem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedItem = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(deletedItem).toBeNull();
    });

    it('经理可以删除库存项', async () => {
      await request(app.getHttpServer())
        .delete(`/api/inventory/${testInventoryItem.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const deletedItem = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(deletedItem).toBeNull();
    });

    it('收银员无法删除库存项', async () => {
      const cashierToken = jwtService.sign({
        username: 'cashier@test.com',
        roles: ['CASHIER'],
      });

      await request(app.getHttpServer())
        .delete(`/api/inventory/${testInventoryItem.id}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });
  });

  describe('GET /api/inventory/alerts - 低库存警告', () => {
    beforeEach(async () => {
      // 创建一些库存项，包括低库存的
      const lowStockItem = inventoryRepository.create({
        name: '即将耗尽的原料',
        category: 'INGREDIENT',
        unit: 'kg',
        currentStock: 3,
        minStock: 10,
        maxStock: 100,
        costPrice: 15.0,
        supplier: '测试供应商',
        isActive: true,
      });

      const normalStockItem = inventoryRepository.create({
        name: '充足库存',
        category: 'INGREDIENT',
        unit: 'kg',
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        costPrice: 15.0,
        supplier: '测试供应商',
        isActive: true,
      });

      await inventoryRepository.save([lowStockItem, normalStockItem]);
    });

    afterEach(async () => {
      await inventoryRepository.clear();
    });

    it('返回低库存警告列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);
      expect(response.body.alerts.length).toBeGreaterThan(0);
    });

    it('警告列表包含低库存项信息', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const hasLowStockAlert = response.body.alerts.some(
        (alert: any) => alert.currentStock <= alert.minStock,
      );
      expect(hasLowStockAlert).toBe(true);
    });

    it('收银员无法查看库存警告', async () => {
      const cashierToken = jwtService.sign({
        username: 'cashier@test.com',
        roles: ['CASHIER'],
      });

      await request(app.getHttpServer())
        .get('/api/inventory/alerts')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });
  });

  describe('POST /api/inventory/:id/adjust - 库存调整', () => {
    let testInventoryItem: InventoryItem;

    beforeEach(async () => {
      testInventoryItem = inventoryRepository.create({
        name: '可调整库存',
        category: 'ADJUSTABLE',
        unit: 'kg',
        currentStock: 20,
        minStock: 5,
        maxStock: 100,
        costPrice: 10.0,
        supplier: '测试供应商',
        isActive: true,
      });
      await inventoryRepository.save(testInventoryItem);
    });

    afterEach(async () => {
      await inventoryRepository.delete(testInventoryItem.id);
    });

    it('管理员可以调整库存', async () => {
      const adjustmentData = {
        adjustment: 15, // 增加15kg
        reason: '进货',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/inventory/${testInventoryItem.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentData)
        .expect(200);

      expect(response.body.currentStock).toBe(35); // 20 + 15
    });

    it('经理可以调整库存', async () => {
      const adjustmentData = {
        adjustment: -5, // 减少5kg
        reason: '损耗',
      };

      await request(app.getHttpServer())
        .post(`/api/inventory/${testInventoryItem.id}/adjust`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(adjustmentData)
        .expect(200);

      const updatedItem = await inventoryRepository.findOne({
        where: { id: testInventoryItem.id },
      });
      expect(updatedItem.currentStock).toBe(15); // 20 - 5
    });

    it('收银员无法调整库存', async () => {
      const cashierToken = jwtService.sign({
        username: 'cashier@test.com',
        roles: ['CASHIER'],
      });

      const adjustmentData = {
        adjustment: 5,
        reason: '进货',
      };

      await request(app.getHttpServer())
        .post(`/api/inventory/${testInventoryItem.id}/adjust`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(adjustmentData)
        .expect(403);
    });

    it('调整库存不能为负数', async () => {
      const adjustmentData = {
        adjustment: -25, // 调整后库存会变成负数
        reason: '损耗',
      };

      await request(app.getHttpServer())
        .post(`/api/inventory/${testInventoryItem.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentData)
        .expect(400);
    });
  });
});