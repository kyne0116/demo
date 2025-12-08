import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum MemberLevel {
  BRONZE = 'bronze',
  SILVER = 'silver', 
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

@Entity('member_profiles')
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true })
@Index(['memberNumber'], { unique: true })
export class MemberProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true })
  @Index()
  phone: string;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  memberNumber: string;

  @Column({
    type: 'enum',
    enum: MemberLevel,
    default: MemberLevel.BRONZE
  })
  level: MemberLevel;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  getPointsConversionRate(): number {
    return 100; // 100 points = 1 yuan
  }

  calculatePointsDiscount(availablePoints: number, orderAmount: number): number {
    const maxDiscountablePoints = Math.min(availablePoints, orderAmount * this.getPointsConversionRate());
    return maxDiscountablePoints / this.getPointsConversionRate();
  }

  getMemberDiscountRate(): number {
    switch (this.level) {
      case MemberLevel.BRONZE:
        return 0;
      case MemberLevel.SILVER:
        return 0.05; // 5%
      case MemberLevel.GOLD:
        return 0.08; // 8%
      case MemberLevel.PLATINUM:
        return 0.10; // 10%
      default:
        return 0;
    }
  }

  getLevelThreshold(level: MemberLevel): number {
    switch (level) {
      case MemberLevel.BRONZE:
        return 0;
      case MemberLevel.SILVER:
        return 1000; // 1000 points or equivalent spent
      case MemberLevel.GOLD:
        return 5000;
      case MemberLevel.PLATINUM:
        return 10000;
      default:
        return 0;
    }
  }

  shouldUpgradeLevel(): boolean {
    const currentThreshold = this.getLevelThreshold(this.level);
    const nextLevel = this.getNextLevel();
    if (!nextLevel) return false;

    const nextThreshold = this.getLevelThreshold(nextLevel);
    return this.points >= nextThreshold || this.totalSpent >= nextThreshold;
  }

  getNextLevel(): MemberLevel | null {
    switch (this.level) {
      case MemberLevel.BRONZE:
        return MemberLevel.SILVER;
      case MemberLevel.SILVER:
        return MemberLevel.GOLD;
      case MemberLevel.GOLD:
        return MemberLevel.PLATINUM;
      case MemberLevel.PLATINUM:
        return null; // Already at highest level
      default:
        return null;
    }
  }

  upgradeLevel(): void {
    const nextLevel = this.getNextLevel();
    if (nextLevel) {
      this.level = nextLevel;
    }
  }

  addPoints(points: number): void {
    if (points < 0) {
      throw new Error('Cannot add negative points');
    }
    this.points += points;
    this.lastActiveAt = new Date();
    
    // Check if should upgrade level
    if (this.shouldUpgradeLevel()) {
      this.upgradeLevel();
    }
  }

  deductPoints(points: number): void {
    if (points < 0) {
      throw new Error('Cannot deduct negative points');
    }
    if (this.points < points) {
      throw new Error('Insufficient points');
    }
    this.points -= points;
    this.lastActiveAt = new Date();
  }

  addSpent(amount: number): void {
    if (amount < 0) {
      throw new Error('Cannot add negative spent amount');
    }
    this.totalSpent += amount;
    this.lastActiveAt = new Date();

    // Check if should upgrade level based on total spent
    if (this.shouldUpgradeLevel()) {
      this.upgradeLevel();
    }
  }

  isEligibleForWelcomeBonus(): boolean {
    return this.points === 0 && this.totalSpent === 0;
  }

  getWelcomeBonus(): number {
    return this.isEligibleForWelcomeBonus() ? 100 : 0;
  }

  toResponseObject(): any {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      phone: this.phone,
      memberNumber: this.memberNumber,
      level: this.level,
      points: this.points,
      totalSpent: this.totalSpent,
      isActive: this.isActive,
      lastActiveAt: this.lastActiveAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}