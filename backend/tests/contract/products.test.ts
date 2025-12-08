import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Products API Contract Tests', () => {
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

  describe('GET /api/products', () => {
    it('should return a list of products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
      
      // 如果有产品，验证产品结构
      if (response.body.length > 0) {
        const product = response.body[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('isActive');
        expect(typeof product.price).toBe('number');
        expect(typeof product.isActive).toBe('boolean');
      }
    });

    it('should return active products only', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      // 验证所有返回的产品都是活跃的
      response.body.forEach((product: any) => {
        expect(product.isActive).toBe(true);
      });
    });

    it('should support filtering by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products?categoryId=test-category-id')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      // 如果有返回结果，验证分类过滤
      if (response.body.length > 0) {
        response.body.forEach((product: any) => {
          expect(product.categoryId).toBe('test-category-id');
        });
      }
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: '测试产品',
        description: '这是一个测试产品',
        price: 15.99,
        categoryId: 'test-category-id',
        isActive: true,
        sortOrder: 1
      };

      const response = await request(app.getHttpServer())
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(productData.name);
      expect(response.body.price).toBe(productData.price);
      expect(response.body.isActive).toBe(productData.isActive);
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        description: '缺少名称和价格'
      };

      await request(app.getHttpServer())
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);
    });

    it('should validate price is a positive number', async () => {
      const invalidProduct = {
        name: '测试产品',
        price: -10
      };

      await request(app.getHttpServer())
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a specific product', async () => {
      // 首先创建一个产品
      const productData = {
        name: '特定测试产品',
        price: 25.99,
        isActive: true
      };

      const createdProduct = await request(app.getHttpServer())
        .post('/api/products')
        .send(productData)
        .expect(201);

      const productId = createdProduct.body.id;

      // 然后获取该产品
      const response = await request(app.getHttpServer())
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body.name).toBe(productData.name);
      expect(response.body.price).toBe(productData.price);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/api/products/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update a product', async () => {
      // 创建产品
      const productData = {
        name: '原始产品名称',
        price: 20.00,
        isActive: true
      };

      const createdProduct = await request(app.getHttpServer())
        .post('/api/products')
        .send(productData)
        .expect(201);

      const productId = createdProduct.body.id;

      // 更新产品
      const updateData = {
        name: '更新后的产品名称',
        price: 25.00
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/products/${productId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.price).toBe(updateData.price);
    });

    it('should return 404 for non-existent product', async () => {
      const updateData = { name: '不存在的更新' };

      await request(app.getHttpServer())
        .patch('/api/products/non-existent-id')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should soft delete a product', async () => {
      // 创建产品
      const productData = {
        name: '将被删除的产品',
        price: 15.00,
        isActive: true
      };

      const createdProduct = await request(app.getHttpServer())
        .post('/api/products')
        .send(productData)
        .expect(201);

      const productId = createdProduct.body.id;

      // 软删除产品
      await request(app.getHttpServer())
        .delete(`/api/products/${productId}`)
        .expect(200);

      // 验证产品被软删除（isActive变为false）
      const response = await request(app.getHttpServer())
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });
  });
});