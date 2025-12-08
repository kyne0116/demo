import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberService } from '../../../src/modules/members/member.service';
import { Member } from '../../../src/modules/members/entities/member.entity';

describe('MemberService', () => {
  let service: MemberService;
  let repository: Repository<Member>;

  const mockMember: Partial<Member> = {
    id: 'test-member-id',
    email: 'test@example.com',
    password: 'hashedPassword123',
    phone: '13800138000',
    name: '测试会员',
    memberNumber: 'TEST001',
    level: 'bronze',
    points: 100,
    totalSpent: 500,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date()
  };

  const mockMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: getRepositoryToken(Member),
          useValue: mockMemberRepository
        }
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    repository = module.get<Repository<Member>>(getRepositoryToken(Member));

    // Reset mock calls
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMember', () => {
    it('should create a new member', async () => {
      const createMemberDto = {
        email: 'new@example.com',
        password: 'password123',
        phone: '13800138001',
        name: '新会员',
        memberNumber: 'NEW001'
      };

      const expectedMember = {
        ...createMemberDto,
        id: 'new-member-id',
        level: 'bronze',
        points: 0,
        totalSpent: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      };

      mockMemberRepository.create.mockReturnValue(expectedMember);
      mockMemberRepository.save.mockResolvedValue(expectedMember);

      const result = await service.createMember(createMemberDto);

      expect(mockMemberRepository.create).toHaveBeenCalledWith(createMemberDto);
      expect(mockMemberRepository.save).toHaveBeenCalledWith(expectedMember);
      expect(result).toEqual(expectedMember);
    });

    it('should auto-generate member number if not provided', async () => {
      const createMemberDto = {
        email: 'autogen@example.com',
        password: 'password123',
        phone: '13800138002',
        name: '自动生成会员'
        // 没有提供memberNumber
      };

      const expectedMember = {
        ...createMemberDto,
        id: 'autogen-member-id',
        memberNumber: `M${Date.now()}`, // 自动生成的会员号
        level: 'bronze',
        points: 0,
        totalSpent: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      };

      mockMemberRepository.create.mockReturnValue(expectedMember);
      mockMemberRepository.save.mockResolvedValue(expectedMember);

      const result = await service.createMember(createMemberDto);

      expect(result.memberNumber).toMatch(/^M\d{13}$/);
      expect(mockMemberRepository.create).toHaveBeenCalledWith({
        ...createMemberDto,
        memberNumber: expect.stringMatching(/^M\d{13}$/)
      });
    });

    it('should throw error if email already exists', async () => {
      const createMemberDto = {
        email: 'existing@example.com',
        password: 'password123',
        phone: '13800138003',
        name: '已有邮箱会员',
        memberNumber: 'EXIST001'
      };

      mockMemberRepository.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.createMember(createMemberDto))
        .rejects.toThrow('Email already exists');
    });

    it('should throw error if member number already exists', async () => {
      const createMemberDto = {
        email: 'unique@example.com',
        password: 'password123',
        phone: '13800138004',
        name: '已有会员号会员',
        memberNumber: 'EXIST002'
      };

      mockMemberRepository.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.createMember(createMemberDto))
        .rejects.toThrow('Member number already exists');
    });
  });

  describe('findOne', () => {
    it('should return member by id', async () => {
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.findOne('test-member-id');

      expect(mockMemberRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-member-id', isActive: true }
      });
      expect(result).toEqual(mockMember);
    });

    it('should return null if member not found', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null if member is inactive', async () => {
      const inactiveMember = { ...mockMember, isActive: false };
      mockMemberRepository.findOne.mockResolvedValue(inactiveMember);

      const result = await service.findOne('inactive-member-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all active members', async () => {
      const members = [mockMember, { ...mockMember, id: 'member-2', name: '第二个会员' }];
      mockMemberRepository.find.mockResolvedValue(members);

      const result = await service.findAll();

      expect(mockMemberRepository.find).toHaveBeenCalledWith({
        where: { isActive: true }
      });
      expect(result).toEqual(members);
    });

    it('should support filtering by level', async () => {
      const bronzeMembers = [mockMember];
      mockMemberRepository.find.mockResolvedValue(bronzeMembers);

      const result = await service.findAll('bronze');

      expect(mockMemberRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, level: 'bronze' }
      });
      expect(result).toEqual(bronzeMembers);
    });

    it('should support pagination', async () => {
      const members = [mockMember];
      const total = 1;
      mockMemberRepository.findAndCount.mockResolvedValue([members, total]);

      const result = await service.findAll('bronze', 1, 10);

      expect(mockMemberRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true, level: 'bronze' },
        take: 10,
        skip: 0
      });
      expect(result).toEqual([members, total]);
    });
  });

  describe('updateMember', () => {
    it('should update member information', async () => {
      const updateData = { name: '更新的名称', phone: '13900139000' };
      const updatedMember = { ...mockMember, ...updateData };

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(updatedMember);

      const result = await service.updateMember('test-member-id', updateData);

      expect(mockMemberRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-member-id', isActive: true }
      });
      expect(mockMemberRepository.save).toHaveBeenCalledWith(updatedMember);
      expect(result).toEqual(updatedMember);
    });

    it('should update member level and points', async () => {
      const updateData = { level: 'silver', points: 1500 };
      const updatedMember = { ...mockMember, ...updateData };

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(updatedMember);

      const result = await service.updateMember('test-member-id', updateData);

      expect(result.level).toBe('silver');
      expect(result.points).toBe(1500);
    });

    it('should throw error if member not found', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.updateMember('non-existent-id', { name: '新名称' }))
        .rejects.toThrow('Member not found');
    });
  });

  describe('deactivateMember', () => {
    it('should deactivate member', async () => {
      const deactivatedMember = { ...mockMember, isActive: false };

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(deactivatedMember);

      const result = await service.deactivateMember('test-member-id');

      expect(mockMemberRepository.save).toHaveBeenCalledWith({
        ...mockMember,
        isActive: false
      });
      expect(result.isActive).toBe(false);
    });

    it('should throw error if member not found', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.deactivateMember('non-existent-id'))
        .rejects.toThrow('Member not found');
    });
  });

  describe('addPoints', () => {
    it('should add points to member', async () => {
      const pointsData = {
        points: 500,
        type: 'purchase',
        description: '购买获得积分'
      };

      const memberWithPoints = { ...mockMember, points: 100 };
      const updatedMember = { ...memberWithPoints, points: 600, lastActiveAt: new Date() };

      mockMemberRepository.findOne.mockResolvedValue(memberWithPoints);
      mockMemberRepository.save.mockResolvedValue(updatedMember);

      const result = await service.addPoints('test-member-id', pointsData);

      expect(mockMemberRepository.save).toHaveBeenCalledWith({
        ...memberWithPoints,
        points: 600,
        lastActiveAt: expect.any(Date)
      });
      expect(result.points).toBe(600);
    });

    it('should deduct points from member', async () => {
      const pointsData = {
        points: 50,
        type: 'redemption',
        description: '积分兑换'
      };

      const memberWithPoints = { ...mockMember, points: 200 };
      const updatedMember = { ...memberWithPoints, points: 150 };

      mockMemberRepository.findOne.mockResolvedValue(memberWithPoints);
      mockMemberRepository.save.mockResolvedValue(updatedMember);

      const result = await service.addPoints('test-member-id', pointsData);

      expect(result.points).toBe(150);
    });

    it('should throw error if insufficient points for redemption', async () => {
      const pointsData = {
        points: 100,
        type: 'redemption',
        description: '积分兑换'
      };

      const memberWithPoints = { ...mockMember, points: 50 };

      mockMemberRepository.findOne.mockResolvedValue(memberWithPoints);

      await expect(service.addPoints('test-member-id', pointsData))
        .rejects.toThrow('Insufficient points for redemption');
    });

    it('should throw error if member not found', async () => {
      const pointsData = { points: 100, type: 'manual' };

      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.addPoints('non-existent-id', pointsData))
        .rejects.toThrow('Member not found');
    });
  });

  describe('updateMemberLevel', () => {
    it('should update member level based on total spent', async () => {
      const testCases = [
        { totalSpent: 0, expectedLevel: 'bronze' },
        { totalSpent: 500, expectedLevel: 'bronze' },
        { totalSpent: 1000, expectedLevel: 'silver' },
        { totalSpent: 3000, expectedLevel: 'silver' },
        { totalSpent: 5000, expectedLevel: 'gold' },
        { totalSpent: 10000, expectedLevel: 'gold' },
        { totalSpent: 15000, expectedLevel: 'platinum' }
      ];

      for (const testCase of testCases) {
        const memberWithSpent = { ...mockMember, totalSpent: testCase.totalSpent };
        const updatedMember = { ...memberWithSpent, level: testCase.expectedLevel };

        mockMemberRepository.findOne.mockResolvedValue(memberWithSpent);
        mockMemberRepository.save.mockResolvedValue(updatedMember);

        const result = await service.updateMemberLevel('test-member-id');

        expect(result.level).toBe(testCase.expectedLevel);
      }
    });

    it('should update level based on points earned', async () => {
      const memberWithPoints = { ...mockMember, points: 1200 };
      const updatedMember = { ...memberWithPoints, level: 'silver' };

      mockMemberRepository.findOne.mockResolvedValue(memberWithPoints);
      mockMemberRepository.save.mockResolvedValue(updatedMember);

      const result = await service.updateMemberLevel('test-member-id');

      expect(result.level).toBe('silver');
    });
  });

  describe('calculateLevel', () => {
    it('should return correct level based on total spent', () => {
      const testCases = [
        { totalSpent: 0, expectedLevel: 'bronze' },
        { totalSpent: 999, expectedLevel: 'bronze' },
        { totalSpent: 1000, expectedLevel: 'silver' },
        { totalSpent: 4999, expectedLevel: 'silver' },
        { totalSpent: 5000, expectedLevel: 'gold' },
        { totalSpent: 9999, expectedLevel: 'gold' },
        { totalSpent: 10000, expectedLevel: 'platinum' }
      ];

      for (const testCase of testCases) {
        const result = service.calculateLevel(testCase.totalSpent);
        expect(result).toBe(testCase.expectedLevel);
      }
    });

    it('should return correct level based on points', () => {
      const testCases = [
        { points: 0, expectedLevel: 'bronze' },
        { points: 999, expectedLevel: 'bronze' },
        { points: 1000, expectedLevel: 'silver' },
        { points: 4999, expectedLevel: 'silver' },
        { points: 5000, expectedLevel: 'gold' },
        { points: 9999, expectedLevel: 'gold' },
        { points: 10000, expectedLevel: 'platinum' }
      ];

      for (const testCase of testCases) {
        const result = service.calculateLevel(testCase.points);
        expect(result).toBe(testCase.expectedLevel);
      }
    });
  });

  describe('validateMemberData', () => {
    it('should validate correct member data', () => {
      const validMemberData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '13800138000',
        name: '测试会员'
      };

      expect(() => service.validateMemberData(validMemberData)).not.toThrow();
    });

    it('should throw error for invalid email', () => {
      const invalidMemberData = {
        email: 'invalid-email',
        password: 'password123',
        phone: '13800138000',
        name: '测试会员'
      };

      expect(() => service.validateMemberData(invalidMemberData))
        .toThrow('Invalid email format');
    });

    it('should throw error for invalid phone', () => {
      const invalidMemberData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '123',
        name: '测试会员'
      };

      expect(() => service.validateMemberData(invalidMemberData))
        .toThrow('Invalid phone number format');
    });

    it('should throw error for missing required fields', () => {
      const invalidMemberData = {
        email: 'test@example.com'
        // 缺少 password, phone, name
      };

      expect(() => service.validateMemberData(invalidMemberData))
        .toThrow('Missing required fields');
    });
  });
});