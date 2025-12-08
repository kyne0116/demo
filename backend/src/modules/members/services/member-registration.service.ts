import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateMemberDto } from '../dto/member.dto';
import { MemberProfile, MemberLevel } from '../entities/member-profile.entity';
import { PointCalculationService } from './point-calculation.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MemberRegistrationService {
  constructor(
    private readonly pointCalculationService: PointCalculationService
  ) {}

  /**
   * 注册新会员
   */
  async registerNewMember(registrationData: CreateMemberDto): Promise<MemberProfile> {
    // 验证注册数据
    this.validateRegistrationData(registrationData);

    // 清理和标准化数据
    const cleanedData = this.sanitizeRegistrationData(registrationData);

    // 检查邮箱是否已存在
    if (await this.isEmailExists(cleanedData.email)) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查手机号是否已存在
    if (await this.isPhoneExists(cleanedData.phone)) {
      throw new ConflictException('手机号已被注册');
    }

    // 检查会员号是否已存在
    if (cleanedData.memberNumber && await this.isMemberNumberExists(cleanedData.memberNumber)) {
      throw new ConflictException('会员号已存在');
    }

    // 如果没有提供会员号，自动生成
    if (!cleanedData.memberNumber) {
      cleanedData.memberNumber = this.generateMemberNumber();
    }

    // 加密密码
    const hashedPassword = await this.hashPassword(cleanedData.password);

    // 计算欢迎积分
    const welcomeBonus = this.pointCalculationService.calculateWelcomeBonus(cleanedData.referralCode);

    // 创建会员对象
    const memberProfile = new MemberProfile();
    memberProfile.email = cleanedData.email;
    memberProfile.password = hashedPassword;
    memberProfile.phone = cleanedData.phone;
    memberProfile.name = cleanedData.name;
    memberProfile.memberNumber = cleanedData.memberNumber;
    memberProfile.level = MemberLevel.BRONZE;
    memberProfile.points = welcomeBonus;
    memberProfile.totalSpent = 0;
    memberProfile.isActive = true;
    memberProfile.lastActiveAt = new Date();

    // 保存到数据库（这里需要实际的数据访问层）
    const savedMember = await this.saveMember(memberProfile);

    return savedMember;
  }

  /**
   * 验证注册数据
   */
  private validateRegistrationData(data: CreateMemberDto): void {
    if (!data.email) {
      throw new BadRequestException('邮箱不能为空');
    }
    if (!data.password) {
      throw new BadRequestException('密码不能为空');
    }
    if (!data.phone) {
      throw new BadRequestException('手机号不能为空');
    }
    if (!data.name) {
      throw new BadRequestException('姓名不能为空');
    }

    this.validateEmailFormat(data.email);
    this.validatePasswordStrength(data.password);
    this.validatePhoneFormat(data.phone);
    this.validateNameLength(data.name);

    if (data.memberNumber) {
      this.validateMemberNumberFormat(data.memberNumber);
    }

    if (data.referralCode) {
      this.validateReferralCodeFormat(data.referralCode);
    }
  }

  /**
   * 清理和标准化数据
   */
  private sanitizeRegistrationData(data: CreateMemberDto): CreateMemberDto {
    return {
      ...data,
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      name: data.name.trim(),
      memberNumber: data.memberNumber?.trim(),
      referralCode: data.referralCode?.trim().toUpperCase()
    };
  }

  /**
   * 验证邮箱格式
   */
  private validateEmailFormat(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('邮箱格式不正确');
    }
  }

  /**
   * 验证密码强度
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 6) {
      throw new BadRequestException('密码至少6个字符');
    }
  }

  /**
   * 验证手机号格式
   */
  private validatePhoneFormat(phone: string): void {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('请输入有效的手机号码');
    }
  }

  /**
   * 验证姓名长度
   */
  private validateNameLength(name: string): void {
    if (name.length < 2) {
      throw new BadRequestException('姓名至少2个字符');
    }
    if (name.length > 50) {
      throw new BadRequestException('姓名不能超过50个字符');
    }
  }

  /**
   * 验证会员号格式
   */
  private validateMemberNumberFormat(memberNumber: string): void {
    const memberNumberRegex = /^M\d{13}$/;
    if (!memberNumberRegex.test(memberNumber)) {
      throw new BadRequestException('会员号格式不正确，应为M开头的13位数字');
    }
  }

  /**
   * 验证推荐码格式
   */
  private validateReferralCodeFormat(referralCode: string): void {
    const referralCodeRegex = /^[A-Z0-9]{3,10}$/;
    if (!referralCodeRegex.test(referralCode)) {
      throw new BadRequestException('推荐码格式不正确，应为3-10位大写字母或数字');
    }
  }

  /**
   * 生成唯一会员号
   */
  private generateMemberNumber(): string {
    return `M${Date.now()}`;
  }

  /**
   * 加密密码
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 检查邮箱是否已存在
   */
  private async isEmailExists(email: string): Promise<boolean> {
    // 这里需要实际的数据库查询
    // 暂时返回false，实际实现中需要查询数据库
    return false;
  }

  /**
   * 检查手机号是否已存在
   */
  private async isPhoneExists(phone: string): Promise<boolean> {
    // 这里需要实际的数据库查询
    return false;
  }

  /**
   * 检查会员号是否已存在
   */
  private async isMemberNumberExists(memberNumber: string): Promise<boolean> {
    // 这里需要实际的数据库查询
    return false;
  }

  /**
   * 保存会员到数据库
   */
  private async saveMember(member: MemberProfile): Promise<MemberProfile> {
    // 这里需要实际的数据访问层实现
    // 暂时返回原对象，实际实现中需要保存到数据库
    return member;
  }

  /**
   * 根据邮箱查找会员
   */
  async findByEmail(email: string): Promise<MemberProfile | null> {
    // 这里需要实际的数据库查询
    return null;
  }

  /**
   * 根据手机号查找会员
   */
  async findByPhone(phone: string): Promise<MemberProfile | null> {
    // 这里需要实际的数据库查询
    return null;
  }

  /**
   * 根据会员号查找会员
   */
  async findByMemberNumber(memberNumber: string): Promise<MemberProfile | null> {
    // 这里需要实际的数据库查询
    return null;
  }

  /**
   * 根据ID查找会员
   */
  async findById(id: string): Promise<MemberProfile | null> {
    // 这里需要实际的数据库查询
    return null;
  }

  /**
   * 验证会员数据格式
   */
  validateMemberData(data: any): void {
    if (!data.email || !data.password || !data.phone || !data.name) {
      throw new BadRequestException('缺少必要字段');
    }
    
    this.validateEmailFormat(data.email);
    this.validatePasswordStrength(data.password);
    this.validatePhoneFormat(data.phone);
    this.validateNameLength(data.name);
  }
}