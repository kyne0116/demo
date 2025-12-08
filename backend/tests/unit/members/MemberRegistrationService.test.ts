import { Test, TestingModule } from '@nestjs/testing';
import { MemberRegistrationService } from '../../../src/modules/members/services/member-registration.service';
import { MemberService } from '../../../src/modules/members/member.service';
import { PointCalculationService } from '../../../src/modules/members/services/point-calculation.service';
import { Member } from '../../../src/modules/members/entities/member.entity';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('MemberRegistrationService', () => {
  let service: MemberRegistrationService;
  let memberService: MemberService;
  let pointCalculationService: PointCalculationService;

  const mockMember: Partial<Member> = {
    id: 'test-member-id',
    email: 'test@example.com',
    password: 'hashedPassword123',
    phone: '13800138000',
    name: '测试会员',
    memberNumber: 'TEST001',
    level: 'bronze',
    points: 0,
    totalSpent: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date()
  };

  const mockMemberService = {
    createMember: jest.fn(),
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    findByMemberNumber: jest.fn(),
    validateMemberData: jest.fn()
  };

  const mockPointCalculationService = {
    calculateInitialPoints: jest.fn(),
    calculateWelcomeBonus: jest.fn(),
    isValidPoints: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberRegistrationService,
        {
          provide: MemberService,
          useValue: mockMemberService
        },
        {
          provide: PointCalculationService,
          useValue: mockPointCalculationService
        }
      ],
    }).compile();

    service = module.get<MemberRegistrationService>(MemberRegistrationService);
    memberService = module.get<MemberService>(MemberService);
    pointCalculationService = module.get<PointCalculationService>(PointCalculationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerNewMember', () => {
    const validRegistrationData = {
      email: 'newmember@example.com',
      password: 'password123',
      phone: '13800138001',
      name: '新会员',
      memberNumber: 'NEW001',
      referralCode: 'REF123'
    };

    it('should successfully register a new member', async () => {
      // Mock service responses
      mockMemberService.findByEmail.mockResolvedValue(null);
      mockMemberService.findByPhone.mockResolvedValue(null);
      mockMemberService.findByMemberNumber.mockResolvedValue(null);
      mockPointCalculationService.calculateWelcomeBonus.mockReturnValue(100);
      mockMemberService.createMember.mockResolvedValue({
        ...mockMember,
        id: 'new-member-id',
        email: validRegistrationData.email,
        name: validRegistrationData.name,
        memberNumber: validRegistrationData.memberNumber,
        points: 100 // 包含欢迎积分
      });

      const result = await service.registerNewMember(validRegistrationData);

      expect(mockMemberService.findByEmail).toHaveBeenCalledWith(validRegistrationData.email);
      expect(mockMemberService.findByPhone).toHaveBeenCalledWith(validRegistrationData.phone);
      expect(mockMemberService.findByMemberNumber).toHaveBeenCalledWith(validRegistrationData.memberNumber);
      expect(mockPointCalculationService.calculateWelcomeBonus).toHaveBeenCalledWith(validRegistrationData.referralCode);
      expect(mockMemberService.createMember).toHaveBeenCalled();
      
      expect(result.email).toBe(validRegistrationData.email);
      expect(result.name).toBe(validRegistrationData.name);
      expect(result.memberNumber).toBe(validRegistrationData.memberNumber);
      expect(result.points).toBe(100);
    });

    it('should auto-generate member number if not provided', async () => {
      const registrationDataWithoutNumber = {
        ...validRegistrationData
      };
      delete (registrationDataWithoutNumber as any).memberNumber;

      mockMemberService.findByEmail.mockResolvedValue(null);
      mockMemberService.findByPhone.mockResolvedValue(null);
      mockMemberService.findByMemberNumber.mockResolvedValue(null);
      mockPointCalculationService.calculateWelcomeBonus.mockReturnValue(100);
      mockMemberService.createMember.mockResolvedValue({
        ...mockMember,
        id: 'new-member-id',
        email: registrationDataWithoutNumber.email,
        name: registrationDataWithoutNumber.name,
        memberNumber: `M${Date.now()}`, // 自动生成的会员号
        points: 100
      });

      const result = await service.registerNewMember(registrationDataWithoutNumber);

      expect(mockMemberService.createMember).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registrationDataWithoutNumber.email,
          password: registrationDataWithoutNumber.password,
          phone: registrationDataWithoutNumber.phone,
          name: registrationDataWithoutNumber.name,
          memberNumber: expect.stringMatching(/^M\d{13}$/)
        })
      );
      expect(result.memberNumber).toMatch(/^M\d{13}$/);
    });

    it('should handle email conflict', async () => {
      mockMemberService.findByEmail.mockResolvedValue(mockMember);

      await expect(service.registerNewMember(validRegistrationData))
        .rejects.toThrow(ConflictException);
    });

    it('should handle phone conflict', async () => {
      mockMemberService.findByEmail.mockResolvedValue(null);
      mockMemberService.findByPhone.mockResolvedValue(mockMember);

      await expect(service.registerNewMember(validRegistrationData))
        .rejects.toThrow(ConflictException);
    });

    it('should handle member number conflict', async () => {
      mockMemberService.findByEmail.mockResolvedValue(null);
      mockMemberService.findByPhone.mockResolvedValue(null);
      mockMemberService.findByMemberNumber.mockResolvedValue(mockMember);

      await expect(service.registerNewMember(validRegistrationData))
        .rejects.toThrow(ConflictException);
    });

    it('should validate registration data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        phone: '123',
        name: ''
      };

      mockMemberService.validateMemberData.mockImplementation(() => {
        throw new BadRequestException('Invalid member data');
      });

      await expect(service.registerNewMember(invalidData))
        .rejects.toThrow(BadRequestException);
    });

    it('should apply referral bonus when referral code is provided', async () => {
      const registrationWithReferral = {
        ...validRegistrationData,
        referralCode: 'REF456'
      };

      mockMemberService.findByEmail.mockResolvedValue(null);
      mockMemberService.findByPhone.mockResolvedValue(null);
      mockMemberService.findByMemberNumber.mockResolvedValue(null);
      mockPointCalculationService.calculateWelcomeBonus.mockReturnValue(200); // 基础100 + 推荐50
      mockMemberService.createMember.mockResolvedValue({
        ...mockMember,
        id: 'referral-member-id',
        email: registrationWithReferral.email,
        name: registrationWithReferral.name,
        memberNumber: registrationWithReferral.memberNumber,
        points: 200
      });

      const result = await service.registerNewMember(registrationWithReferral);

      expect(mockPointCalculationService.calculateWelcomeBonus).toHaveBeenCalledWith('REF456');
      expect(result.points).toBe(200);
    });
  });

  describe('validateRegistrationData', () => {
    it('should validate all required fields', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '13800138000',
        name: '测试用户'
      };

      expect(() => service.validateRegistrationData(validData)).not.toThrow();
    });

    it('should throw error for missing email', () => {
      const invalidData = {
        password: 'password123',
        phone: '13800138000',
        name: '测试用户'
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Email is required');
    });

    it('should throw error for missing password', () => {
      const invalidData = {
        email: 'test@example.com',
        phone: '13800138000',
        name: '测试用户'
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Password is required');
    });

    it('should throw error for missing phone', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: '测试用户'
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Phone is required');
    });

    it('should throw error for missing name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '13800138000'
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Name is required');
    });

    it('should validate email format', () => {
      const invalidData = {
        email: 'invalid-email-format',
        password: 'password123',
        phone: '13800138000',
        name: '测试用户'
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Invalid email format');
    });

    it('should validate password strength', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        phone: '13800138000',
        name: '测试用户'
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Password must be at least 6 characters long');
    });

    it('should validate phone format', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '123',
        name: '测试用户'
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Invalid phone number format');
    });

    it('should validate name length', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '13800138000',
        name: '' // 空名称
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Name must be at least 2 characters long');
    });

    it('should validate member number format if provided', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '13800138000',
        name: '测试用户',
        memberNumber: 'INVALID' // 无效格式
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Invalid member number format');
    });

    it('should validate referral code format if provided', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '13800138000',
        name: '测试用户',
        referralCode: 'TOOLONG' // 超过限制长度
      };

      expect(() => service.validateRegistrationData(invalidData))
        .toThrow('Invalid referral code format');
    });
  });

  describe('generateMemberNumber', () => {
    it('should generate unique member number', () => {
      const memberNumber = service.generateMemberNumber();
      expect(memberNumber).toMatch(/^M\d{13}$/);
    });

    it('should generate different numbers in different calls', () => {
      const number1 = service.generateMemberNumber();
      const number2 = service.generateMemberNumber();
      expect(number1).not.toBe(number2);
    });
  });

  describe('validateEmailFormat', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(() => service.validateEmailFormat(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..user@example.com',
        '.user@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => service.validateEmailFormat(email))
          .toThrow('Invalid email format');
      });
    });
  });

  describe('validatePhoneFormat', () => {
    it('should validate correct phone format', () => {
      const validPhones = [
        '13800138000',
        '15900139001',
        '+8613800138000',
        '4001234567'
      ];

      validPhones.forEach(phone => {
        expect(() => service.validatePhoneFormat(phone)).not.toThrow();
      });
    });

    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        '123',
        '13800138',
        'abc13800138000',
        '138001380000',
        ''
      ];

      invalidPhones.forEach(phone => {
        expect(() => service.validatePhoneFormat(phone))
          .toThrow('Invalid phone number format');
      });
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'password123',
        'MyPassword2023',
        'C0mplexPass!',
        'Secure_P@ssw0rd'
      ];

      strongPasswords.forEach(password => {
        expect(() => service.validatePasswordStrength(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123',
        'password',
        'abc123',
        '123456',
        '',
        'pass'
      ];

      weakPasswords.forEach(password => {
        expect(() => service.validatePasswordStrength(password))
          .toThrow('Password must be at least 6 characters long');
      });
    });
  });

  describe('sanitizeRegistrationData', () => {
    it('should sanitize and trim string fields', () => {
      const dirtyData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        phone: '  13800138000  ',
        name: '  测试用户  '
      };

      const sanitized = service.sanitizeRegistrationData(dirtyData);
      
      expect(sanitized.email).toBe('TEST@EXAMPLE.COM');
      expect(sanitized.phone).toBe('13800138000');
      expect(sanitized.name).toBe('测试用户');
      expect(sanitized.password).toBe('password123'); // 不应该改变密码
    });

    it('should normalize email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        phone: '13800138000',
        name: '测试用户'
      };

      const sanitized = service.sanitizeRegistrationData(data);
      expect(sanitized.email).toBe('test@example.com');
    });
  });
});