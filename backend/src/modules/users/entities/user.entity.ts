import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { MemberProfile } from '../members/entities/member-profile.entity';
import { OperationLog } from './operation-log.entity';

// 角色定义 - 支持多角色
export enum UserRole {
  ADMIN = 'ADMIN',           // 超级管理员
  MANAGER = 'MANAGER',       // 门店经理
  CASHIER = 'CASHIER',       // 收银员
  KITCHEN_STAFF = 'KITCHEN_STAFF',  // 厨房员工
  INVENTORY_MANAGER = 'INVENTORY_MANAGER', // 库存管理员
  CUSTOMER = 'CUSTOMER',     // 普通客户
}

// 系统权限定义
export enum SystemPermission {
  // 用户管理权限
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',

  // 员工管理权限
  STAFF_READ = 'staff:read',
  STAFF_WRITE = 'staff:write',
  STAFF_DELETE = 'staff:delete',

  // 产品管理权限
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',

  // 订单管理权限
  ORDERS_READ = 'orders:read',
  ORDERS_WRITE = 'orders:write',
  ORDERS_UPDATE = 'orders:update',
  ORDERS_DELETE = 'orders:delete',

  // 库存管理权限
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',
  INVENTORY_DELETE = 'inventory:delete',

  // 报表权限
  REPORTS_READ = 'reports:read',
  REPORTS_WRITE = 'reports:write',
  REPORTS_DELETE = 'reports:delete',

  // 会员管理权限
  MEMBERS_READ = 'members:read',
  MEMBERS_WRITE = 'members:write',
  MEMBERS_DELETE = 'members:delete',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column()
  name: string;

  // 支持多角色系统
  @Column('simple-array', { default: '' })
  roles: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'text', nullable: true })
  profileImageUrl: string;

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

  // 辅助方法
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.roles.includes(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.roles.includes(role));
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isManager(): boolean {
    return this.hasRole(UserRole.MANAGER);
  }

  isStaff(): boolean {
    return this.hasAnyRole([
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.CASHIER,
      UserRole.KITCHEN_STAFF,
      UserRole.INVENTORY_MANAGER,
    ]);
  }

  addRole(role: string): void {
    if (!this.roles.includes(role)) {
      this.roles.push(role);
    }
  }

  removeRole(role: string): void {
    this.roles = this.roles.filter(r => r !== role);
  }

  setRoles(roles: string[]): void {
    this.roles = [...new Set(roles)]; // 去重
  }
}