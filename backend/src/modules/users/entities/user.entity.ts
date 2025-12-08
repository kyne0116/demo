import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { MemberProfile } from '../members/entities/member-profile.entity';
import { OperationLog } from '../common/entities/operation-log.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  STAFF = 'staff',
  MANAGER = 'manager',
  OWNER = 'owner',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关系
  @OneToMany(() => Order, order => order.customer)
  orders: Order[];

  @OneToMany(() => MemberProfile, member => member.user)
  memberProfiles: MemberProfile[];

  @OneToMany(() => OperationLog, log => log.user)
  operationLogs: OperationLog[];
}