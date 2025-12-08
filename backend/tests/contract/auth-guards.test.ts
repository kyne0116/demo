import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Authorization Guards Contract Tests', () => {
  let app: INestApplication;
  let adminToken: string;
  let cashierToken: string;
  let noAuthToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 获取不同角色的token
    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });
    adminToken = adminResponse.body.access_token;

    const cashierResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'cashier@test.com', password: 'password' });
    cashierToken = cashierResponse.body.access_token;

    // 未认证用户（用于测试）
    noAuthToken = 'invalid-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RolesGuard Protection', () => {
    it('should allow admin access to admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny cashier access to admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('should deny access without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${noAuthToken}`)
        .expect(401);
    });
  });

  describe('RolesGuard - Multiple Roles', () => {
    it('should allow access to endpoints requiring any of multiple roles', async () => {
      // 收银员可以访问订单相关端点
      await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);
    });

    it('should deny access to endpoints requiring different roles', async () => {
      // 收银员不应该访问库存管理端点
      await request(app.getHttpServer())
        .get('/api/inventory')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });
  });

  describe('PermissionGuard Protection', () => {
    it('should allow resource access based on user permissions', async () => {
      // 创建员工后，员工应该能访问自己的资料
      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '权限测试员工',
          email: 'perm-test@test.com',
          roles: ['CASHIER'],
          password: 'password123',
        });

      const staffId = createResponse.body.id;

      // 员工登录
      const staffLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'perm-test@test.com', password: 'password123' });
      const staffToken = staffLogin.body.access_token;

      // 员工应该能查看自己的资料
      await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      // 员工不应该能查看其他员工的资料
      const otherStaffResponse = await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${staffToken}`);
      
      if (otherStaffResponse.body.data.length > 0) {
        const otherStaff = otherStaffResponse.body.data.find(staff => staff.id !== staffId);
        if (otherStaff) {
          await request(app.getHttpServer())
            .get(`/api/users/staff/${otherStaff.id}`)
            .set('Authorization', `Bearer ${staffToken}`)
            .expect(403);
        }
      }
    });
  });

  describe('Custom Guards Behavior', () => {
    it('should handle missing metadata gracefully', async () => {
      // 测试没有Roles装饰器的端点
      await request(app.getHttpServer())
        .get('/api/products') // 这个端点可能没有权限要求
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);
    });

    it('should handle empty roles array', async () => {
      // 模拟一个有空roles的请求
      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);
    });

    it('should return proper error structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(403);
      expect(response.body.message).toContain('Forbidden');
    });
  });

  describe('Guard Integration with Controllers', () => {
    it('should protect POST endpoints with proper validation', async () => {
      const invalidData = {
        name: '', // 无效名称
        email: 'invalid-email', // 无效邮箱
        roles: [], // 空角色
      };

      await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should protect PUT endpoints with proper validation', async () => {
      // 先创建一个员工
      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '更新测试员工',
          email: 'update-test@test.com',
          roles: ['CASHIER'],
        });

      const staffId = createResponse.body.id;

      // 测试无效的更新数据
      await request(app.getHttpServer())
        .put(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '', // 无效名称
          roles: ['INVALID_ROLE'], // 无效角色
        })
        .expect(400);
    });

    it('should protect DELETE endpoints with cascade handling', async () => {
      // 创建临时员工用于删除测试
      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '删除测试员工',
          email: 'delete-test@test.com',
          roles: ['CASHIER'],
        });

      const staffId = createResponse.body.id;

      // 删除员工
      await request(app.getHttpServer())
        .delete(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 验证员工已被删除
      await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});