import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, SystemPermission } from '../users/entities/user.entity';

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    // 用户管理权限
    SystemPermission.USERS_READ,
    SystemPermission.USERS_WRITE,
    SystemPermission.USERS_DELETE,
    
    // 员工管理权限
    SystemPermission.STAFF_READ,
    SystemPermission.STAFF_WRITE,
    SystemPermission.STAFF_DELETE,
    
    // 产品管理权限
    SystemPermission.PRODUCTS_READ,
    SystemPermission.PRODUCTS_WRITE,
    SystemPermission.PRODUCTS_DELETE,
    
    // 订单管理权限
    SystemPermission.ORDERS_READ,
    SystemPermission.ORDERS_WRITE,
    SystemPermission.ORDERS_UPDATE,
    SystemPermission.ORDERS_DELETE,
    
    // 库存管理权限
    SystemPermission.INVENTORY_READ,
    SystemPermission.INVENTORY_WRITE,
    SystemPermission.INVENTORY_DELETE,
    
    // 报表权限
    SystemPermission.REPORTS_READ,
    SystemPermission.REPORTS_WRITE,
    SystemPermission.REPORTS_DELETE,
    
    // 会员管理权限
    SystemPermission.MEMBERS_READ,
    SystemPermission.MEMBERS_WRITE,
    SystemPermission.MEMBERS_DELETE,
  ],
  
  [UserRole.MANAGER]: [
    // 员工管理权限（只读）
    SystemPermission.STAFF_READ,
    SystemPermission.STAFF_WRITE,
    
    // 产品管理权限
    SystemPermission.PRODUCTS_READ,
    SystemPermission.PRODUCTS_WRITE,
    
    // 订单管理权限
    SystemPermission.ORDERS_READ,
    SystemPermission.ORDERS_WRITE,
    SystemPermission.ORDERS_UPDATE,
    
    // 库存管理权限
    SystemPermission.INVENTORY_READ,
    SystemPermission.INVENTORY_WRITE,
    
    // 报表权限
    SystemPermission.REPORTS_READ,
    SystemPermission.REPORTS_WRITE,
    
    // 会员管理权限
    SystemPermission.MEMBERS_READ,
    SystemPermission.MEMBERS_WRITE,
  ],
  
  [UserRole.CASHIER]: [
    // 产品权限（只读）
    SystemPermission.PRODUCTS_READ,
    
    // 订单权限
    SystemPermission.ORDERS_READ,
    SystemPermission.ORDERS_WRITE,
    
    // 会员权限（只读）
    SystemPermission.MEMBERS_READ,
  ],
  
  [UserRole.KITCHEN_STAFF]: [
    // 产品权限（只读）
    SystemPermission.PRODUCTS_READ,
    
    // 订单权限（只读和更新状态）
    SystemPermission.ORDERS_READ,
    SystemPermission.ORDERS_UPDATE,
    
    // 库存权限（只读）
    SystemPermission.INVENTORY_READ,
  ],
  
  [UserRole.INVENTORY_MANAGER]: [
    // 产品权限（只读）
    SystemPermission.PRODUCTS_READ,
    
    // 订单权限（只读）
    SystemPermission.ORDERS_READ,
    
    // 库存管理权限
    SystemPermission.INVENTORY_READ,
    SystemPermission.INVENTORY_WRITE,
    SystemPermission.INVENTORY_DELETE,
    
    // 报表权限（只读）
    SystemPermission.REPORTS_READ,
  ],
  
  [UserRole.CUSTOMER]: [
    // 基本权限
    SystemPermission.MEMBERS_READ,
  ],
};

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const permissions = new Set<string>();

    // 聚合用户所有角色的权限
    for (const role of user.roles) {
      if (ROLE_PERMISSIONS[role as UserRole]) {
        ROLE_PERMISSIONS[role as UserRole].forEach(permission => {
          permissions.add(permission);
        });
      }
    }

    return Array.from(permissions);
  }

  /**
   * 检查用户是否拥有特定权限
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(permission);
  }

  /**
   * 检查用户是否拥有指定角色
   */
  async hasRole(userId: string, roles: string | string[]): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const targetRoles = Array.isArray(roles) ? roles : [roles];
    
    // 检查用户是否拥有任何一个目标角色
    return targetRoles.some(role => user.roles.includes(role));
  }

  /**
   * 更新用户角色
   */
  async updateUserRoles(userId: string, newRoles: string[]): Promise<User> {
    // 验证角色是否有效
    for (const role of newRoles) {
      if (!this.validateRole(role)) {
        throw new BadRequestException(`无效的角色: ${role}`);
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 防止删除所有角色
    if (newRoles.length === 0) {
      throw new BadRequestException('用户必须至少拥有一个角色');
    }

    // 更新角色（去重）
    user.setRoles(newRoles);
    
    return this.userRepository.save(user);
  }

  /**
   * 获取所有可用角色
   */
  getAllRoles(): string[] {
    return Object.values(UserRole);
  }

  /**
   * 获取指定角色的所有权限
   */
  getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role as UserRole] || [];
  }

  /**
   * 验证角色是否有效
   */
  validateRole(role: string): boolean {
    return Object.values(UserRole).includes(role as UserRole);
  }

  /**
   * 验证权限是否有效
   */
  validatePermission(permission: string): boolean {
    return Object.values(SystemPermission).includes(permission as SystemPermission);
  }

  /**
   * 批量验证权限
   */
  validatePermissions(permissions: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    permissions.forEach(permission => {
      if (this.validatePermission(permission)) {
        valid.push(permission);
      } else {
        invalid.push(permission);
      }
    });

    return { valid, invalid };
  }

  /**
   * 批量验证角色
   */
  validateRoles(roles: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    roles.forEach(role => {
      if (this.validateRole(role)) {
        valid.push(role);
      } else {
        invalid.push(role);
      }
    });

    return { valid, invalid };
  }

  /**
   * 获取角色的继承关系
   */
  getRoleHierarchy(): Record<string, string[]> {
    return {
      [UserRole.ADMIN]: [UserRole.MANAGER, UserRole.CASHIER, UserRole.KITCHEN_STAFF, UserRole.INVENTORY_MANAGER],
      [UserRole.MANAGER]: [UserRole.CASHIER, UserRole.KITCHEN_STAFF, UserRole.INVENTORY_MANAGER],
    };
  }

  /**
   * 检查角色继承关系
   */
  hasRoleInheritance(userId: string, requiredRole: string): Promise<boolean> {
    return this.hasRole(userId, requiredRole);
  }

  /**
   * 获取用户权限统计信息
   */
  async getUserPermissionStats(userId: string): Promise<{
    totalPermissions: number;
    roles: string[];
    permissionsByCategory: Record<string, number>;
  }> {
    const permissions = await this.getUserPermissions(userId);
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 按类别统计权限
    const permissionsByCategory: Record<string, number> = {};
    permissions.forEach(permission => {
      const category = permission.split(':')[0]; // 如 'users', 'products' 等
      permissionsByCategory[category] = (permissionsByCategory[category] || 0) + 1;
    });

    return {
      totalPermissions: permissions.length,
      roles: user.roles,
      permissionsByCategory,
    };
  }

  /**
   * 检查用户是否可以为其他用户分配角色
   */
  async canAssignRoles(assignorId: string, targetRole: string): Promise<boolean> {
    // 管理员可以为任何人分配角色
    if (await this.hasRole(assignorId, [UserRole.ADMIN])) {
      return true;
    }

    // 经理只能为收银员、厨房员工、库存管理员分配角色
    if (await this.hasRole(assignorId, [UserRole.MANAGER])) {
      const allowedRoles = [UserRole.CASHIER, UserRole.KITCHEN_STAFF, UserRole.INVENTORY_MANAGER];
      return allowedRoles.includes(targetRole as UserRole);
    }

    return false;
  }

  /**
   * 获取权限摘要信息
   */
  getPermissionsSummary(): {
    totalRoles: number;
    totalPermissions: number;
    rolePermissions: Record<string, number>;
  } {
    const rolePermissions: Record<string, number> = {};
    
    Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      rolePermissions[role] = permissions.length;
    });

    return {
      totalRoles: this.getAllRoles().length,
      totalPermissions: Object.values(SystemPermission).length,
      rolePermissions,
    };
  }
}