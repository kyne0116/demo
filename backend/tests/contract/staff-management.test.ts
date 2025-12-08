import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Staff Management Contract Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 获取管理员和普通用户token
    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });
    adminToken = adminResponse.body.access_token;

    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password' });
    authToken = userResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/users/staff', () => {
    it('should return staff list for admin users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('roles');
      expect(response.body.data[0]).toHaveProperty('createdAt');
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 401 for unauthorized users', async () => {
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .expect(401);
    });
  });

  describe('POST /api/users/staff', () => {
    it('should create new staff member for admin users', async () => {
      const newStaff = {
        name: '测试员工',
        email: 'teststaff@test.com',
        phone: '13800138000',
        roles: ['CASHIER'],
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newStaff)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newStaff.name);
      expect(response.body.email).toBe(newStaff.email);
      expect(response.body.roles).toEqual(newStaff.roles);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 for invalid staff data', async () => {
      const invalidStaff = {
        name: '',
        email: 'invalid-email',
        roles: [],
      };

      await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidStaff)
        .expect(400);
    });

    it('should return 403 for non-admin users', async () => {
      const newStaff = {
        name: '测试员工',
        email: 'teststaff@test.com',
        roles: ['CASHIER'],
      };

      await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newStaff)
        .expect(403);
    });
  });

  describe('PUT /api/users/staff/:id', () => {
    let staffId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '临时员工',
          email: 'temp@test.com',
          roles: ['CASHIER'],
        });
      staffId = response.body.id;
    });

    it('should update staff member for admin users', async () => {
      const updateData = {
        name: '更新的员工名称',
        roles: ['CASHIER', 'KITCHEN_STAFF'],
      };

      const response = await request(app.getHttpServer())
        .put(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.roles).toEqual(updateData.roles);
    });

    it('should return 404 for non-existent staff', async () => {
      await request(app.getHttpServer())
        .put('/api/users/staff/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '测试' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/staff/:id', () => {
    let staffId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '待删除员工',
          email: 'delete@test.com',
          roles: ['CASHIER'],
        });
      staffId = response.body.id;
    });

    it('should delete staff member for admin users', async () => {
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

    it('should prevent deleting admin users', async () => {
      // 获取管理员ID
      const adminList = await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      const adminUser = adminList.body.data.find(user => 
        user.roles.includes('ADMIN')
      );

      if (adminUser) {
        await request(app.getHttpServer())
          .delete(`/api/users/staff/${adminUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);
      }
    });
  });

  describe('GET /api/users/staff/:id/permissions', () => {
    let staffId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '权限测试员工',
          email: 'permission@test.com',
          roles: ['CASHIER'],
        });
      staffId = response.body.id;
    });

    it('should return staff permissions for admin users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('roles');
      expect(response.body).toHaveProperty('permissions');
      expect(response.body).toHaveProperty('effectivePermissions');
      expect(Array.isArray(response.body.permissions)).toBe(true);
    });

    it('should return staff own permissions', async () => {
      // 使用员工自己的token
      const staffLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'permission@test.com', password: 'password123' });
      
      const staffToken = staffLogin.body.access_token;

      await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}/permissions`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);
    });
  });

  describe('PUT /api/users/staff/:id/roles', () => {
    let staffId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '角色测试员工',
          email: 'roles@test.com',
          roles: ['CASHIER'],
        });
      staffId = response.body.id;
    });

    it('should update staff roles for admin users', async () => {
      const newRoles = ['KITCHEN_STAFF', 'INVENTORY_MANAGER'];

      const response = await request(app.getHttpServer())
        .put(`/api/users/staff/${staffId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: newRoles })
        .expect(200);

      expect(response.body.roles).toEqual(newRoles);
    });

    it('should log role change operation', async () => {
      await request(app.getHttpServer())
        .put(`/api/users/staff/${staffId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['KITCHEN_STAFF'] })
        .expect(200);

      // 验证操作日志已记录
      const logs = await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}/audit-logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(logs.body.data.length).toBeGreaterThan(0);
      expect(logs.body.data[0].operation).toBe('ROLE_UPDATE');
    });
  });
});