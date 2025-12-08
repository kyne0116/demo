import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MemberLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('member_profiles')
export class MemberProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  memberNumber: string;

  @Column({
    type: 'enum',
    enum: MemberLevel,
    default: MemberLevel.BRONZE,
  })
  level: MemberLevel;

  @Column({ default: 0 })
  points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ default: 0 })
  pointsUsed: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  discountRate: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  lastActiveAt: Date;

  // 关系
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}