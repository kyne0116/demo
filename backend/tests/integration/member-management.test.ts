import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Member Management Integration Tests', () => {
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

  describe('Complete Member Lifecycle', () => {
    it('should handle complete member registration and point management flow', async () => {
      console.log('Starting complete member lifecycle test...');

      // Step 1: Register new member
      console.log('Step 1: Registering new member...');
      const memberData = {
        email: 'lifecycle@example.com',
        password: 'password123',
        phone: '13800138999',
        name: '生命周期测试会员',
        memberNumber: 'LIFECYCLE001'
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('id');
      expect(registerResponse.body.level).toBe('bronze');
      expect(registerResponse.body.points).toBe(0);
      expect(registerResponse.body.totalSpent).toBe(0);

      const memberId = registerResponse.body.id;
      console.log(`Member registered: ${memberId}`);

      // Step 2: Verify member details
      console.log('Step 2: Verifying member details...');
      const memberDetailsResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(memberDetailsResponse.body.id).toBe(memberId);
      expect(memberDetailsResponse.body.email).toBe(memberData.email);
      expect(memberDetailsResponse.body.name).toBe(memberData.name);
      expect(memberDetailsResponse.body.level).toBe('bronze');

      // Step 3: Make a purchase and earn points
      console.log('Step 3: Processing purchase and earning points...');
      const purchaseData = {
        customerId: memberId,
        staffId: 'staff-integration-test-123',
        items: [
          {
            productId: 'test-product-1',
            productName: '测试珍珠奶茶',
            unitPrice: 18.50,
            quantity: 2
          },
          {
            productId: 'test-product-2',
            productName: '测试芒果布丁',
            unitPrice: 15.00,
            quantity: 1
          }
        ],
        memberInfo: {
          memberLevel: 'bronze',
          pointsAvailable: 0
        }
      };

      const expectedTotal = 18.50 * 2 + 15.00 * 1; // 52.00
      const expectedPointsEarned = Math.floor(expectedTotal);

      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .send(purchaseData)
        .expect(201);

      expect(orderResponse.body.customerId).toBe(memberId);
      expect(orderResponse.body.pointsEarned).toBe(expectedPointsEarned);
      console.log(`Order created with ${expectedPointsEarned} points earned`);

      // Step 4: Update member points after purchase
      console.log('Step 4: Updating member points...');
      const pointsUpdateResponse = await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send({
          points: expectedPointsEarned,
          type: 'purchase',
          description: '购买订单获得积分'
        })
        .expect(200);

      expect(pointsUpdateResponse.body.points).toBe(expectedPointsEarned);
      console.log(`Member points updated to ${expectedPointsEarned}`);

      // Step 5: Verify member level progression (bronze -> silver)
      console.log('Step 5: Checking level progression...');
      // Bronze: 0-999, Silver: 1000-4999
      // 当前积分是52，还未达到Silver级别
      expect(pointsUpdateResponse.body.level).toBe('bronze');

      // Step 6: Add more points to reach Silver level
      console.log('Step 6: Adding points to reach Silver level...');
      const additionalPoints = 1000; // 添加1000积分，总计1052，达到Silver级别

      await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send({
          points: additionalPoints,
          type: 'manual',
          description: '手动添加积分以测试等级升级'
        })
        .expect(200);

      // Step 7: Verify Silver level upgrade
      console.log('Step 7: Verifying Silver level upgrade...');
      const updatedMemberResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      const totalPoints = expectedPointsEarned + additionalPoints; // 52 + 1000 = 1052
      expect(updatedMemberResponse.body.points).toBe(totalPoints);
      expect(updatedMemberResponse.body.level).toBe('silver');
      console.log(`Member upgraded to Silver level with ${totalPoints} points`);

      // Step 8: Test member discount with Silver level
      console.log('Step 8: Testing Silver member discount...');
      const silverPurchaseData = {
        customerId: memberId,
        staffId: 'staff-integration-test-123',
        items: [
          {
            productId: 'test-product-3',
            productName: 'Silver会员专享产品',
            unitPrice: 100.00,
            quantity: 1
          }
        ],
        memberInfo: {
          memberLevel: 'silver',
          pointsAvailable: totalPoints
        }
      };

      const silverOrderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .send(silverPurchaseData)
        .expect(201);

      // Silver会员享受5%折扣
      const expectedDiscount = 100.00 * 0.05; // 5.00
      const expectedFinalAmount = 100.00 - expectedDiscount; // 95.00

      expect(silverOrderResponse.body.discountAmount).toBeCloseTo(expectedDiscount, 2);
      expect(silverOrderResponse.body.finalAmount).toBeCloseTo(expectedFinalAmount, 2);
      console.log(`Silver discount applied: ¥${expectedDiscount.toFixed(2)}`);

      // Step 9: Test points redemption
      console.log('Step 9: Testing points redemption...');
      const pointsToRedeem = 500; // 兑换5元
      const redemptionResponse = await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send({
          points: pointsToRedeem,
          type: 'redemption',
          description: '积分兑换商品'
        })
        .expect(200);

      const remainingPoints = totalPoints + expectedPointsEarned - pointsToRedeem;
      expect(redemptionResponse.body.points).toBe(remainingPoints);
      console.log(`Points redeemed: ${pointsToRedeem}, remaining: ${remainingPoints}`);

      // Step 10: Verify final member state
      console.log('Step 10: Verifying final member state...');
      const finalMemberResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(finalMemberResponse.body.level).toBe('silver');
      expect(finalMemberResponse.body.points).toBe(remainingPoints);
      expect(finalMemberResponse.body.isActive).toBe(true);

      console.log('✅ Complete member lifecycle test passed!');
      console.log(`Final member state:`);
      console.log(`- ID: ${finalMemberResponse.body.id}`);
      console.log(`- Level: ${finalMemberResponse.body.level}`);
      console.log(`- Points: ${finalMemberResponse.body.points}`);
      console.log(`- Total Spent: ${finalMemberResponse.body.totalSpent}`);
    });

    it('should handle member registration with auto-generated member number', async () => {
      console.log('Testing auto-generated member number...');

      const memberData = {
        email: 'autogen@example.com',
        password: 'password123',
        phone: '13800138998',
        name: '自动生成会员号测试'
        // 不提供memberNumber，应该自动生成
      };

      const response = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      expect(response.body.memberNumber).toBeDefined();
      expect(response.body.memberNumber).toMatch(/^M\d{13}$/); // M + timestamp (13 digits)

      // 验证生成的会员号是唯一的
      const memberNumber = response.body.memberNumber;

      const duplicateData = {
        email: 'duplicate@example.com',
        password: 'password123',
        phone: '13800138997',
        name: '重复测试会员',
        memberNumber: memberNumber // 使用相同的会员号
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(duplicateData)
        .expect(400); // 应该失败，因为会员号已存在

      console.log(`✅ Auto-generated member number test passed: ${memberNumber}`);
    });

    it('should handle member deactivation and reactivation', async () => {
      console.log('Testing member deactivation and reactivation...');

      // 注册会员
      const memberData = {
        email: 'deactivate@example.com',
        password: 'password123',
        phone: '13800138996',
        name: '停用激活测试',
        memberNumber: 'DEACT001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 停用会员
      await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send({ isActive: false })
        .expect(200);

      // 验证会员无法访问
      await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(404);

      // 重新激活会员
      await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send({ isActive: true })
        .expect(200);

      // 验证会员可以访问
      const reactivatedMember = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(reactivatedMember.body.isActive).toBe(true);
      expect(reactivatedMember.body.name).toBe(memberData.name);

      console.log('✅ Member deactivation and reactivation test passed!');
    });

    it('should prevent negative points balance', async () => {
      console.log('Testing negative points prevention...');

      // 注册新会员（初始积分为0）
      const memberData = {
        email: 'negative@example.com',
        password: 'password123',
        phone: '13800138995',
        name: '负积分测试',
        memberNumber: 'NEGATIVE001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 尝试扣减超过现有积分的数量
      await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send({
          points: 100, // 会员当前只有0积分
          type: 'redemption',
          description: '尝试扣减积分'
        })
        .expect(400);

      // 验证积分仍然是0
      const memberResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(memberResponse.body.points).toBe(0);

      console.log('✅ Negative points prevention test passed!');
    });

    it('should calculate correct member levels based on total spent', async () => {
      console.log('Testing member level calculation...');

      const memberData = {
        email: 'levels@example.com',
        password: 'password123',
        phone: '13800138994',
        name: '等级计算测试',
        memberNumber: 'LEVELS001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 测试Bronze级别 (0-999)
      expect(createdMember.body.level).toBe('bronze');

      // 模拟消费达到Silver级别
      await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send({ totalSpent: 1500 })
        .expect(200);

      let memberResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(memberResponse.body.level).toBe('silver');
      expect(memberResponse.body.totalSpent).toBe(1500);

      // 模拟消费达到Gold级别
      await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send({ totalSpent: 6000 })
        .expect(200);

      memberResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(memberResponse.body.level).toBe('gold');

      // 模拟消费达到Platinum级别
      await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send({ totalSpent: 12000 })
        .expect(200);

      memberResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(memberResponse.body.level).toBe('platinum');

      console.log('✅ Member level calculation test passed!');
    });
  });

  describe('Error Handling in Member Management', () => {
    it('should handle invalid email format', async () => {
      const invalidMember = {
        email: 'invalid-email-format',
        password: 'password123',
        phone: '13800138993',
        name: '无效邮箱测试',
        memberNumber: 'INVALID001'
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(invalidMember)
        .expect(400);
    });

    it('should handle duplicate email', async () => {
      const memberData = {
        email: 'duplicate@example.com',
        password: 'password123',
        phone: '13800138992',
        name: '第一个会员',
        memberNumber: 'DUP001'
      };

      // 创建第一个会员
      await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      // 尝试创建相同邮箱的会员
      const duplicateMember = {
        email: 'duplicate@example.com', // 相同邮箱
        password: 'password123',
        phone: '13800138991',
        name: '第二个会员',
        memberNumber: 'DUP002'
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(duplicateMember)
        .expect(400);
    });

    it('should handle invalid phone number', async () => {
      const invalidMember = {
        email: 'phone@example.com',
        password: 'password123',
        phone: '123', // 无效的手机号
        name: '无效手机号测试',
        memberNumber: 'PHONE001'
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(invalidMember)
        .expect(400);
    });

    it('should handle operations on non-existent member', async () => {
      const nonExistentId = 'non-existent-member-id';

      // 尝试获取不存在的会员
      await request(app.getHttpServer())
        .get(`/api/members/${nonExistentId}`)
        .expect(404);

      // 尝试更新不存在的会员
      await request(app.getHttpServer())
        .patch(`/api/members/${nonExistentId}`)
        .send({ name: '新名称' })
        .expect(404);

      // 尝试为不存在的会员添加积分
      await request(app.getHttpServer())
        .post(`/api/members/${nonExistentId}/points`)
        .send({ points: 100, type: 'manual' })
        .expect(404);
    });
  });
});