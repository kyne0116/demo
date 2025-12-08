import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberProfile, MemberLevel } from './entities/member-profile.entity';
import { CreateMemberDto, UpdateMemberDto, AddPointsDto } from './dto/member.dto';
import { PointCalculationService } from './services/point-calculation.service';
import { MemberRegistrationService } from './services/member-registration.service';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberProfile)
    private readonly memberRepository: Repository<MemberProfile>,
    private readonly pointCalculationService: PointCalculationService,
    private readonly memberRegistrationService: MemberRegistrationService
  ) {}

  /**
   * 创建新会员
   */
  async createMember(createMemberDto: CreateMemberDto): Promise<MemberProfile> {
    return await this.memberRegistrationService.registerNewMember(createMemberDto);
  }

  /**
   * 根据ID查找会员
   */
  async findOne(id: string): Promise<MemberProfile> {
    const member = await this.memberRepository.findOne({
      where: { id, isActive: true },
      select: [
        'id', 'email', 'name', 'phone', 'memberNumber', 'level', 
        'points', 'totalSpent', 'isActive', 'lastActiveAt', 
        'createdAt', 'updatedAt'
      ]
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    return member;
  }

  /**
   * 根据邮箱查找会员
   */
  async findByEmail(email: string): Promise<MemberProfile | null> {
    return await this.memberRepository.findOne({
      where: { email, isActive: true },
      select: [
        'id', 'email', 'name', 'phone', 'memberNumber', 'level',
        'points', 'totalSpent', 'isActive', 'lastActiveAt',
        'createdAt', 'updatedAt'
      ]
    });
  }

  /**
   * 根据手机号查找会员
   */
  async findByPhone(phone: string): Promise<MemberProfile | null> {
    return await this.memberRepository.findOne({
      where: { phone, isActive: true },
      select: [
        'id', 'email', 'name', 'phone', 'memberNumber', 'level',
        'points', 'totalSpent', 'isActive', 'lastActiveAt',
        'createdAt', 'updatedAt'
      ]
    });
  }

  /**
   * 根据会员号查找会员
   */
  async findByMemberNumber(memberNumber: string): Promise<MemberProfile | null> {
    return await this.memberRepository.findOne({
      where: { memberNumber, isActive: true },
      select: [
        'id', 'email', 'name', 'phone', 'memberNumber', 'level',
        'points', 'totalSpent', 'isActive', 'lastActiveAt',
        'createdAt', 'updatedAt'
      ]
    });
  }

  /**
   * 查找所有会员
   */
  async findAll(level?: MemberLevel, page: number = 1, limit: number = 10) {
    const queryBuilder = this.memberRepository.createQueryBuilder('member')
      .where('member.isActive = :isActive', { isActive: true });

    if (level) {
      queryBuilder.andWhere('member.level = :level', { level });
    }

    const [members, total] = await queryBuilder
      .select([
        'member.id', 'member.email', 'member.name', 'member.phone', 
        'member.memberNumber', 'member.level', 'member.points', 
        'member.totalSpent', 'member.isActive', 'member.lastActiveAt',
        'member.createdAt', 'member.updatedAt'
      ])
      .orderBy('member.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      members,
      total,
      page,
      limit
    };
  }

  /**
   * 更新会员信息
   */
  async updateMember(id: string, updateMemberDto: UpdateMemberDto): Promise<MemberProfile> {
    const member = await this.findOne(id);

    // 允许更新的字段
    const allowedFields = ['name', 'phone', 'level', 'points', 'totalSpent', 'isActive'];
    const updateData: any = {};

    for (const [key, value] of Object.entries(updateMemberDto)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    }

    // 如果更新了等级，手动检查升级逻辑
    if (updateData.level && updateData.level !== member.level) {
      updateData.level = updateData.level;
    }

    // 如果更新了积分或消费，检查等级升级
    if (updateData.points !== undefined || updateData.totalSpent !== undefined) {
      const newPoints = updateData.points !== undefined ? updateData.points : member.points;
      const newSpent = updateData.totalSpent !== undefined ? updateData.totalSpent : member.totalSpent;
      
      if (this.pointCalculationService.canUpgradeLevel(member.level, newPoints, newSpent)) {
        const newLevel = this.pointCalculationService.calculateLevel(Math.max(newPoints, newSpent));
        updateData.level = newLevel;
      }
    }

    await this.memberRepository.update(id, updateData);
    return await this.findOne(id);
  }

  /**
   * 停用会员
   */
  async deactivateMember(id: string): Promise<MemberProfile> {
    const member = await this.findOne(id);
    
    await this.memberRepository.update(id, { isActive: false });
    return await this.findOne(id);
  }

  /**
   * 添加积分
   */
  async addPoints(id: string, pointsData: AddPointsDto): Promise<MemberProfile> {
    const member = await this.findOne(id);

    this.pointCalculationService.validatePoints(pointsData.points);

    if (pointsData.points < 0) {
      // 扣减积分
      if (member.points < Math.abs(pointsData.points)) {
        throw new BadRequestException('积分不足');
      }
      member.deductPoints(Math.abs(pointsData.points));
    } else {
      // 添加积分
      member.addPoints(pointsData.points);
    }

    await this.memberRepository.save(member);
    return member;
  }

  /**
   * 更新会员等级
   */
  async updateMemberLevel(id: string): Promise<MemberProfile> {
    const member = await this.findOne(id);

    const currentPoints = member.points;
    const currentSpent = member.totalSpent;

    if (this.pointCalculationService.canUpgradeLevel(member.level, currentPoints, currentSpent)) {
      const newLevel = this.pointCalculationService.calculateLevel(Math.max(currentPoints, currentSpent));
      member.level = newLevel;
      await this.memberRepository.save(member);
    }

    return member;
  }

  /**
   * 计算会员折扣
   */
  calculateMemberDiscount(member: MemberProfile, orderAmount: number) {
    return this.pointCalculationService.calculateMemberDiscount(member.level, orderAmount);
  }

  /**
   * 计算积分折扣
   */
  calculatePointsDiscount(availablePoints: number) {
    return this.pointCalculationService.calculatePointsDiscount(availablePoints);
  }

  /**
   * 计算总折扣
   */
  calculateTotalDiscount(member: MemberProfile, orderAmount: number, pointsToUse: number = 0) {
    const memberDiscount = this.calculateMemberDiscount(member, orderAmount);
    
    let pointsDiscount = { discountAmount: 0, usedPoints: 0 };
    if (pointsToUse > 0) {
      pointsDiscount = this.calculatePointsDiscount(pointsToUse);
    }

    const totalDiscount = this.pointCalculationService.calculateTotalDiscount(memberDiscount, pointsDiscount);
    
    return {
      ...totalDiscount,
      finalAmount: this.pointCalculationService.calculateFinalAmount(
        orderAmount,
        memberDiscount.discountAmount,
        pointsDiscount.discountAmount
      )
    };
  }

  /**
   * 计算订单积分获得
   */
  calculatePointsEarned(orderAmount: number, member: MemberProfile): number {
    return this.pointCalculationService.calculatePointsEarned(orderAmount, member.level);
  }

  /**
   * 获取会员等级阈值
   */
  getLevelThresholds() {
    return this.pointCalculationService.getMemberLevelThresholds();
  }

  /**
   * 获取折扣比例
   */
  getDiscountRates() {
    return this.pointCalculationService.getDiscountRates();
  }

  /**
   * 验证会员数据
   */
  validateMemberData(data: any): void {
    this.memberRegistrationService.validateMemberData(data);
  }

  /**
   * 会员登录验证
   */
  async validateLogin(email: string, password: string): Promise<MemberProfile | null> {
    const member = await this.memberRepository.findOne({
      where: { email, isActive: true },
      select: [
        'id', 'email', 'password', 'name', 'phone', 'memberNumber',
        'level', 'points', 'totalSpent', 'isActive', 'lastActiveAt',
        'createdAt', 'updatedAt'
      ]
    });

    if (!member) {
      return null;
    }

    const isPasswordValid = await this.memberRegistrationService.verifyPassword(password, member.password);
    if (!isPasswordValid) {
      return null;
    }

    // 更新最后活跃时间
    member.lastActiveAt = new Date();
    await this.memberRepository.save(member);

    // 不返回密码
    const { password: _, ...memberWithoutPassword } = member;
    return memberWithoutPassword as MemberProfile;
  }

  /**
   * 批量更新会员等级
   */
  async batchUpdateMemberLevels(): Promise<number> {
    const members = await this.memberRepository.find({
      where: { isActive: true }
    });

    let updatedCount = 0;

    for (const member of members) {
      const shouldUpgrade = this.pointCalculationService.canUpgradeLevel(
        member.level,
        member.points,
        member.totalSpent
      );

      if (shouldUpgrade) {
        const newLevel = this.pointCalculationService.calculateLevel(
          Math.max(member.points, member.totalSpent)
        );
        
        if (newLevel !== member.level) {
          member.level = newLevel;
          await this.memberRepository.save(member);
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }

  /**
   * 获取会员统计信息
   */
  async getMemberStatistics() {
    const totalMembers = await this.memberRepository.count({ where: { isActive: true } });
    
    const levelStats = await this.memberRepository
      .createQueryBuilder('member')
      .select('member.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('member.isActive = :isActive', { isActive: true })
      .groupBy('member.level')
      .getRawMany();

    const totalPoints = await this.memberRepository
      .createQueryBuilder('member')
      .select('SUM(member.points)', 'total')
      .where('member.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      totalMembers,
      levelDistribution: levelStats.reduce((acc, stat) => {
        acc[stat.level] = parseInt(stat.count);
        return acc;
      }, {} as Record<string, number>),
      totalPoints: parseInt(totalPoints?.total || '0')
    };
  }
}