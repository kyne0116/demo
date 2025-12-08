import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Role-Based Access Control Integration Tests', () => {
  let app: INestApplication;
  let adminToken: string;
  let cashierToken: string;
  let kitchenToken: string;
  let managerToken: string;

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

    const kitchenResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'kitchen@test.com', password: 'password' });
    kitchenToken = kitchenResponse.body.access_token;

    const managerResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'manager@test.com', password: 'password' });
    managerToken = managerResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete RBAC Flow', () => {
    let testStaffId: string;

    it('should create staff with proper roles and verify access control', async () => {
      // 1. Admin creates a new cashier staff
      const newStaff = {
        name: '集成测试员工',
        email: 'integration-test@test.com',
        phone: '13800138001',
        roles: ['CASHIER'],
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newStaff)
        .expect(201);

      expect(createResponse.body.id).toBeDefined();
      expect(createResponse.body.roles).toEqual(['CASHIER']);
      testStaffId = createResponse.body.id;

      // 2. New staff logs in
      const staffLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: newStaff.email, password: newStaff.password })
        .expect(200);

      const staffToken = staffLogin.body.access_token;

      // 3. Verify staff can access allowed endpoints
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          items: [{ productId: 1, quantity: 1 }],
          customerInfo: { name: '测试客户' }
        })
        .expect(201);

      // 4. Verify staff cannot access admin endpoints
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      // 5. Admin updates staff roles
      await request(app.getHttpServer())
        .put(`/api/users/staff/${testStaffId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['CASHIER', 'KITCHEN_STAFF'] })
        .expect(200);

      // 6. Verify role update affects permissions
      const updatedLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: newStaff.email, password: newStaff.password });

      const updatedToken = updatedLogin.body.access_token;

      // Now should be able to access kitchen-related endpoints
      await request(app.getHttpServer())
        .get('/api/orders/kitchen-queue')
        .set('Authorization', `Bearer ${updatedToken}`)
        .expect(200);

      // 7. Admin deletes staff member
      await request(app.getHttpServer())
        .delete(`/api/users/staff/${testStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 8. Verify deleted staff cannot login
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: newStaff.email, password: newStaff.password })
        .expect(401);
    });

    it('should maintain data consistency during role changes', async () => {
      // Create staff with initial role
      const staff = {
        name: '一致性测试员工',
        email: 'consistency-test@test.com',
        roles: ['CASHIER'],
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staff)
        .expect(201);

      const staffId = createResponse.body.id;

      // Create some audit logs for this staff
      await request(app.getHttpServer())
        .put(`/api/users/staff/${staffId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['KITCHEN_STAFF'] })
        .expect(200);

      // Verify audit trail is maintained
      const auditLogs = await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}/audit-logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(auditLogs.body.data.length).toBeGreaterThan(0);
      
      // Verify role change is reflected in user data
      const updatedUser = await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(updatedUser.body.roles).toEqual(['KITCHEN_STAFF']);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
200);
    });

        .expect(    it('should handle permission inheritance correctly', async () => {
      // Create a staff with multiple roles
      const multiRoleStaff = {
        name: '多角色员工',
        email: 'multi-role@test.com',
        roles: ['CASHIER', 'KITCHEN_STAFF'],
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(multiRoleStaff)
        .expect(201);

      const staffId = createResponse.body.id;

      // Login as multi-role staff
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ 
          email: multiRoleStaff.email, 
          password: multiRoleStaff.password 
        })
        .expect(200);

      const staffToken = loginResponse.body.access_token;

      // Verify access to endpoints allowed by either role
      await request(app.getHttpServer())
        .get('/api/products') // Cashier permission
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/orders/kitchen-queue') // Kitchen permission
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      // Verify still denied access to admin endpoints
      await request(app.getHttpServer())
        .get('/api/users/staff')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Cross-Module RBAC Integration', () => {
    it('should enforce RBAC across different system modules', async () => {
      // Test cashier access to different modules
      await request(app.getHttpServer())
        .get('/api/products') // Should allow
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/orders') // Should allow
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          items: [{ productId: 1, quantity: 1 }],
          customerInfo: { name: 'RBAC测试' }
        })
        .expect(201);

      await request(app.getHttpServer())
        .get('/api/inventory') // Should deny
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/reports') // Should deny
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);

      // Test kitchen staff access
      await request(app.getHttpServer())
        .get('/api/orders/kitchen-queue') // Should allow
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/products') // Should allow (read access)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/users/staff') // Should deny
        .set('Authorization', `Bearer ${kitchenToken}`)
        .expect(403);

      // Test manager access
      await request(app.getHttpServer())
        .get('/api/reports') // Should allow
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/inventory') // Should allow
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/users/staff') // Should allow
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent role updates gracefully', async () => {
      // Create a staff member
      const staff = {
        name: '并发测试员工',
        email: 'concurrent-test@test.com',
        roles: ['CASHIER'],
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staff)
        .expect(201);

      const staffId = createResponse.body.id;

      // Simulate concurrent role updates
      const updatePromises = [
        request(app.getHttpServer())
          .put(`/api/users/staff/${staffId}/roles`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ roles: ['KITCHEN_STAFF'] }),
        request(app.getHttpServer())
          .put(`/api/users/staff/${staffId}/roles`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ roles: ['INVENTORY_MANAGER'] }),
      ];

      const results = await Promise.all(updatePromises);
      
      // At least one should succeed
      expect(results.some(result => result.status === 200)).toBe(true);

      // Verify final state
      const finalUser = await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(finalUser.body.roles).toContain('KITCHEN_STAFF');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should maintain audit trail for all role-related operations', async () => {
      // Create staff
      const staff = {
        name: '审计测试员工',
        email: 'audit-test@test.com',
        roles: ['CASHIER'],
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staff)
        .expect(201);

      const staffId = createResponse.body.id;

      // Perform multiple role operations
      await request(app.getHttpServer())
        .put(`/api/users/staff/${staffId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['KITCHEN_STAFF'] })
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/users/staff/${staffId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['CASHIER', 'KITCHEN_STAFF'] })
        .expect(200);

      // Verify all operations are logged
      const auditLogs = await request(app.getHttpServer())
        .get(`/api/users/staff/${staffId}/audit-logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(auditLogs.body.data.length).toBeGreaterThanOrEqual(2);
      
      const roleUpdateLogs = auditLogs.body.data.filter(log => 
        log.operation === 'ROLE_UPDATE'
      );
      expect(roleUpdateLogs.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/api/users/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});