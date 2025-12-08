import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Members API Contract Tests', () => {
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

  describe('POST /api/members', () => {
    it('should register a new member', async () => {
      const memberData = {
        email: 'newmember@example.com',
        password: 'password123',
        phone: '13800138000',
        name: '新会员',
        memberNumber: 'M' + Date.now()
      };

      const response = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('memberNumber');
      expect(response.body.email).toBe(memberData.email);
      expect(response.body.name).toBe(memberData.name);
      expect(response.body.level).toBe('bronze'); // 默认等级
      expect(response.body.points).toBe(0);
      expect(response.body.isActive).toBe(true);
    });

    it('should validate required fields', async () => {
      const invalidMember = {
        email: 'test@example.com',
        // 缺少 password, phone, name, memberNumber
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(invalidMember)
        .expect(400);
    });

    it('should validate email format', async () => {
      const invalidMember = {
        email: 'invalid-email',
        password: 'password123',
        phone: '13800138000',
        name: '测试会员',
        memberNumber: 'M' + Date.now()
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(invalidMember)
        .expect(400);
    });

    it('should validate phone number format', async () => {
      const invalidMember = {
        email: 'test@example.com',
        password: 'password123',
        phone: 'invalid-phone',
        name: '测试会员',
        memberNumber: 'M' + Date.now()
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(invalidMember)
        .expect(400);
    });

    it('should ensure unique member number', async () => {
      const memberData = {
        email: 'member1@example.com',
        password: 'password123',
        phone: '13800138001',
        name: '会员1',
        memberNumber: 'UNIQUE001'
      };

      // 创建第一个会员
      await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      // 尝试创建相同会员号的会员
      const duplicateMember = {
        email: 'member2@example.com',
        password: 'password123',
        phone: '13800138002',
        name: '会员2',
        memberNumber: 'UNIQUE001' // 相同会员号
      };

      await request(app.getHttpServer())
        .post('/api/members')
        .send(duplicateMember)
        .expect(400);
    });

    it('should generate unique member number if not provided', async () => {
      const memberData = {
        email: 'autogen@example.com',
        password: 'password123',
        phone: '13800138003',
        name: '自动生成会员'
        // 不提供memberNumber，应该自动生成
      };

      const response = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      expect(response.body.memberNumber).toBeDefined();
      expect(response.body.memberNumber).toMatch(/^M\d{13}$/); // M + timestamp
    });
  });

  describe('GET /api/members/:id', () => {
    it('should return member details', async () => {
      // 首先注册一个会员
      const memberData = {
        email: 'member@example.com',
        password: 'password123',
        phone: '13800138004',
        name: '会员详情测试',
        memberNumber: 'DETAIL001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 然后获取会员详情
      const response = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(200);

      expect(response.body.id).toBe(memberId);
      expect(response.body.email).toBe(memberData.email);
      expect(response.body.name).toBe(memberData.name);
      expect(response.body.memberNumber).toBe(memberData.memberNumber);
      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('points');
      expect(response.body).toHaveProperty('totalSpent');
      expect(response.body).toHaveProperty('isActive');
    });

    it('should return 404 for non-existent member', async () => {
      await request(app.getHttpServer())
        .get('/api/members/non-existent-id')
        .expect(404);
    });

    it('should not return inactive member details', async () => {
      // 创建会员
      const memberData = {
        email: 'inactive@example.com',
        password: 'password123',
        phone: '13800138005',
        name: '非活跃会员',
        memberNumber: 'INACTIVE001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 先禁用会员
      await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send({ isActive: false })
        .expect(200);

      // 尝试获取详情应该返回404
      await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(404);
    });
  });

  describe('GET /api/members', () => {
    it('should return a list of active members', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/members')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      // 如果有会员，验证结构
      if (response.body.length > 0) {
        const member = response.body[0];
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('email');
        expect(member).toHaveProperty('memberNumber');
        expect(member).toHaveProperty('level');
        expect(member).toHaveProperty('points');
        expect(member.isActive).toBe(true); // 只返回活跃会员
      }
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/members?page=1&limit=10')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should support filtering by level', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/members?level=bronze')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      // 如果有返回结果，验证等级过滤
      if (response.body.length > 0) {
        response.body.forEach((member: any) => {
          expect(member.level).toBe('bronze');
        });
      }
    });
  });

  describe('PATCH /api/members/:id', () => {
    it('should update member information', async () => {
      // 创建会员
      const memberData = {
        email: 'update@example.com',
        password: 'password123',
        phone: '13800138006',
        name: '原始名称',
        memberNumber: 'UPDATE001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 更新会员信息
      const updateData = {
        name: '更新后的名称',
        phone: '13900139000'
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.phone).toBe(updateData.phone);
    });

    it('should update member level and points', async () => {
      // 创建会员
      const memberData = {
        email: 'levelupdate@example.com',
        password: 'password123',
        phone: '13800138007',
        name: '等级更新测试',
        memberNumber: 'LEVEL001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 更新会员等级和积分
      const updateData = {
        level: 'silver',
        points: 1500
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/members/${memberId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.level).toBe('silver');
      expect(response.body.points).toBe(1500);
    });

    it('should deactivate member', async () => {
      // 创建会员
      const memberData = {
        email: 'deactivate@example.com',
        password: 'password123',
        phone: '13800138008',
        name: '停用测试',
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

      // 验证会员已被停用
      const getResponse = await request(app.getHttpServer())
        .get(`/api/members/${memberId}`)
        .expect(404); // 不再可访问
    });

    it('should return 404 for non-existent member', async () => {
      const updateData = { name: '更新名称' };

      await request(app.getHttpServer())
        .patch('/api/members/non-existent-id')
        .send(updateData)
        .expect(404);
    });
  });

  describe('POST /api/members/:id/points', () => {
    it('should add points to member', async () => {
      // 创建会员
      const memberData = {
        email: 'points@example.com',
        password: 'password123',
        phone: '13800138009',
        name: '积分测试',
        memberNumber: 'POINTS001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;
      const initialPoints = createdMember.body.points;

      // 添加积分
      const pointsData = {
        points: 500,
        type: 'purchase', // 购买获得积分
        description: '购买订单获得积分'
      };

      const response = await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send(pointsData)
        .expect(200);

      expect(response.body.points).toBe(initialPoints + pointsData.points);
      expect(response.body).toHaveProperty('lastActiveAt');
    });

    it('should deduct points from member', async () => {
      // 创建会员
      const memberData = {
        email: 'deduct@example.com',
        password: 'password123',
        phone: '13800138010',
        name: '扣分测试',
        memberNumber: 'DEDUCT001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 先添加积分
      await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send({ points: 1000, type: 'manual', description: '手动添加积分' })
        .expect(200);

      // 扣减积分
      const deductData = {
        points: 300,
        type: 'redemption', // 积分兑换
        description: '积分兑换商品'
      };

      const response = await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send(deductData)
        .expect(200);

      expect(response.body.points).toBe(700); // 1000 - 300
    });

    it('should not allow negative points balance', async () => {
      // 创建会员
      const memberData = {
        email: 'negative@example.com',
        password: 'password123',
        phone: '13800138011',
        name: '负积分测试',
        memberNumber: 'NEGATIVE001'
      };

      const createdMember = await request(app.getHttpServer())
        .post('/api/members')
        .send(memberData)
        .expect(201);

      const memberId = createdMember.body.id;

      // 尝试扣减超过现有积分的数量
      const deductData = {
        points: 100, // 会员当前只有0积分
        type: 'redemption',
        description: '尝试扣减积分'
      };

      await request(app.getHttpServer())
        .post(`/api/members/${memberId}/points`)
        .send(deductData)
        .expect(400);
    });
  });
});