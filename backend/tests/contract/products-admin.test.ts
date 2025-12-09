import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../../src/app.module';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { Category } from '../../../src/modules/products/entities/category.entity';
import { User } from '../../../src/modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('Product Management Contract Tests', () => {
  let app: INestApplication;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let adminToken: string;
  let managerToken: string;
  let cashierToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
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

    const cashierUser = userRepository.create({
      username: 'cashier@test.com',
      password: 'password123',
      email: 'cashier@test.com',
      roles: ['CASHIER'],
      isActive: true,
    });

    await userRepository.save([adminUser, managerUser, cashierUser]);

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

    cashierToken = jwtService.sign({
      sub: cashierUser.id,
      username: cashierUser.username,
      roles: cashierUser.roles,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products - 产品列表', () => {
    let testCategory: Category;
    let testProduct: Product;

    beforeEach(async () => {
      testCategory = categoryRepository.create({
        name: '奶茶',
        description: '各种口味的奶茶',
        isActive: true,
      });
      await categoryRepository.save(testCategory);

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

    afterEach(async () => {
      await productRepository.delete(testProduct.id);
      await categoryRepository.delete(testCategory.id);
    });

    it('管理员可以查看所有产品', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('经理可以查看所有产品', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
    });

    it('收银员可以查看产品（权限允许）', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
    });

    it('未授权访问被拒绝', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .expect(401);
    });

    it('支持分页查询', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('total');
    });

    it('支持按类别筛选', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/products?categoryId=${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('支持按状态筛选（仅显示可售产品）', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products?availableOnly=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/products/:id - 产品详情', () => {
    let testCategory: Category;
    let testProduct: Product;

    beforeEach(async () => {
      testCategory = categoryRepository.create({
        name: '果汁',
        description: '新鲜果汁',
        isActive: true,
      });
      await categoryRepository.save(testCategory);

      testProduct = productRepository.create({
        name: '柠檬蜂蜜茶',
        description: '清香柠檬配蜂蜜',
        price: 22.0,
        category: testCategory,
        imageUrl: '/images/lemon-tea.jpg',
        isAvailable: true,
        isActive: true,
      });
      await productRepository.save(testProduct);
    });

    afterEach(async () => {
      await productRepository.delete(testProduct.id);
      await categoryRepository.delete(testCategory.id);
    });

    it('返回产品详细信息', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(testProduct.id);
      expect(response.body.name).toBe('柠檬蜂蜜茶');
      expect(response.body.price).toBe(22.0);
      expect(response.body.category).toBeDefined();
    });

    it('包含类别信息', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.category.id).toBe(testCategory.id);
      expect(response.body.category.name).toBe('果汁');
    });

    it('不存在的产品返回404', async () => {
      await request(app.getHttpServer())
        .get('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/products - 创建产品', () => {
    let testCategory: Category;

    beforeEach(async () => {
      testCategory = categoryRepository.create({
        name: '咖啡',
        description: '精品咖啡',
        isActive: true,
      });
      await categoryRepository.save(testCategory);
    });

    afterEach(async () => {
      await categoryRepository.delete(testCategory.id);
    });

    const validProductData = {
      name: '美式咖啡',
      description: '经典美式咖啡',
      price: 25.0,
      categoryId: '', // 将动态设置
      imageUrl: '/images/americano.jpg',
      isAvailable: true,
    };

    it('管理员可以创建产品', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validProductData,
          categoryId: testCategory.id,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('美式咖啡');
      expect(response.body.price).toBe(25.0);
    });

    it('经理可以创建产品', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          ...validProductData,
          categoryId: testCategory.id,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('收银员无法创建产品', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          ...validProductData,
          categoryId: testCategory.id,
        })
        .expect(403);
    });

    it('创建失败返回400（缺少必填字段）', async () => {
      const invalidData = {
        name: '', // 缺少产品名
        description: '测试描述',
        price: 15.0,
        categoryId: testCategory.id,
      };

      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('创建失败返回400（价格无效）', async () => {
      const invalidData = {
        name: '测试产品',
        description: '测试描述',
        price: -5.0, // 负价格
        categoryId: testCategory.id,
      };

      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('创建失败返回400（不存在的类别）', async () => {
      const invalidData = {
        ...validProductData,
        categoryId: '99999', // 不存在的类别ID
      };

      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/products/:id - 更新产品', () => {
    let testCategory: Category;
    let testProduct: Product;

    beforeEach(async () => {
      testCategory = categoryRepository.create({
        name: '冰淇淋',
        description: '各种口味冰淇淋',
        isActive: true,
      });
      await categoryRepository.save(testCategory);

      testProduct = productRepository.create({
        name: '香草冰淇淋',
        description: '经典香草口味',
        price: 12.0,
        category: testCategory,
        imageUrl: '/images/vanilla-ice-cream.jpg',
        isAvailable: true,
        isActive: true,
      });
      await productRepository.save(testProduct);
    });

    afterEach(async () => {
      await productRepository.delete(testProduct.id);
      await categoryRepository.delete(testCategory.id);
    });

    it('管理员可以更新产品', async () => {
      const updateData = {
        name: '香草冰淇淋（大份）',
        price: 15.0,
        isAvailable: false,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('香草冰淇淋（大份）');
      expect(response.body.price).toBe(15.0);
      expect(response.body.isAvailable).toBe(false);
    });

    it('经理可以更新产品', async () => {
      const updateData = {
        description: '升级版香草冰淇淋',
      };

      await request(app.getHttpServer())
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      const updatedProduct = await productRepository.findOne({
        where: { id: testProduct.id },
      });
      expect(updatedProduct.description).toBe('升级版香草冰淇淋');
    });

    it('收银员无法更新产品', async () => {
      const updateData = {
        name: '更新的冰淇淋',
      };

      await request(app.getHttpServer())
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(updateData)
        .expect(403);
    });

    it('更新不存在的产品返回404', async () => {
      const updateData = {
        name: '不存在的更新',
      };

      await request(app.getHttpServer())
        .put('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/products/:id - 删除产品', () => {
    let testCategory: Category;
    let testProduct: Product;

    beforeEach(async () => {
      testCategory = categoryRepository.create({
        name: '甜品',
        description: '各种甜品',
        isActive: true,
      });
      await categoryRepository.save(testCategory);

      testProduct = productRepository.create({
        name: '芒果慕斯',
        description: '新鲜芒果制作',
        price: 28.0,
        category: testCategory,
        imageUrl: '/images/mango-mousse.jpg',
        isAvailable: true,
        isActive: true,
      });
      await productRepository.save(testProduct);
    });

    afterEach(async () => {
      await productRepository.delete(testProduct.id);
      await categoryRepository.delete(testCategory.id);
    });

    it('管理员可以删除产品', async () => {
      await request(app.getHttpServer())
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedProduct = await productRepository.findOne({
        where: { id: testProduct.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('经理可以删除产品', async () => {
      await request(app.getHttpServer())
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const deletedProduct = await productRepository.findOne({
        where: { id: testProduct.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('收银员无法删除产品', async () => {
      await request(app.getHttpServer())
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('删除不存在的产品返回404', async () => {
      await request(app.getHttpServer())
        .delete('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/products/:id/availability - 更新产品可售状态', () => {
    let testCategory: Category;
    let testProduct: Product;

    beforeEach(async () => {
      testCategory = categoryRepository.create({
        name: '饮品',
        description: '各种饮品',
        isActive: true,
      });
      await categoryRepository.save(testCategory);

      testProduct = productRepository.create({
        name: '橙汁',
        description: '鲜榨橙汁',
        price: 20.0,
        category: testCategory,
        imageUrl: '/images/orange-juice.jpg',
        isAvailable: true,
        isActive: true,
      });
      await productRepository.save(testProduct);
    });

    afterEach(async () => {
      await productRepository.delete(testProduct.id);
      await categoryRepository.delete(testCategory.id);
    });

    it('管理员可以更新产品可售状态', async () => {
      const availabilityData = {
        isAvailable: false,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/products/${testProduct.id}/availability`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(availabilityData)
        .expect(200);

      expect(response.body.isAvailable).toBe(false);
    });

    it('经理可以更新产品可售状态', async () => {
      const availabilityData = {
        isAvailable: true,
      };

      await request(app.getHttpServer())
        .put(`/api/products/${testProduct.id}/availability`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(availabilityData)
        .expect(200);

      const updatedProduct = await productRepository.findOne({
        where: { id: testProduct.id },
      });
      expect(updatedProduct.isAvailable).toBe(true);
    });

    it('收银员可以更新产品可售状态（收银员有products权限）', async () => {
      const availabilityData = {
        isAvailable: false,
      };

      await request(app.getHttpServer())
        .put(`/api/products/${testProduct.id}/availability`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(availabilityData)
        .expect(200);
    });

    it('更新失败返回400（参数无效）', async () => {
      const invalidData = {
        isAvailable: 'invalid', // 应该是boolean
      };

      await request(app.getHttpServer())
        .put(`/api/products/${testProduct.id}/availability`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/products/categories - 获取产品类别', () => {
    let testCategory1: Category;
    let testCategory2: Category;

    beforeEach(async () => {
      testCategory1 = categoryRepository.create({
        name: '热饮',
        description: '热饮类别',
        isActive: true,
      });
      testCategory2 = categoryRepository.create({
        name: '冷饮',
        description: '冷饮类别',
        isActive: false, // 不活跃的类别
      });
      await categoryRepository.save([testCategory1, testCategory2]);
    });

    afterEach(async () => {
      await categoryRepository.delete([testCategory1.id, testCategory2.id]);
    });

    it('返回所有活跃类别', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
    });

    it('包含类别基本信息', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const hasRequiredFields = response.body.categories.every(
        (category: any) =>
          category.id && category.name && category.description !== undefined,
      );
      expect(hasRequiredFields).toBe(true);
    });
  });
});