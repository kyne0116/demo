import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import {
  User,
  UserRole,
  SystemPermission
} from './entities/user.entity';
import { OperationType } from './entities/operation-log.entity';
import { PermissionService } from '../auth/permission.service';
import { AuditLogService } from './audit-log.service';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  roles?: string[];
  isActive?: boolean;
  profileImageUrl?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  roles?: string[];
  isActive?: boolean;
  profileImageUrl?: string;
}

export interface StaffQueryOptions {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private permissionService: PermissionService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * 创建新用户
   */
  async create(userData: CreateUserData, actorId?: string, request?: any): Promise<User> {
    // 检查邮箱和手机号唯一性
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: userData.email },
        ...(userData.phone ? [{ phone: userData.phone }] : []),
      ],
    });

    if (existingUser) {
      throw new ConflictException('邮箱或手机号已被使用');
    }

    // 验证角色
    if (userData.roles) {
      const { valid, invalid } = this.permissionService.validateRoles(userData.roles);
      if (invalid.length > 0) {
        throw new BadRequestException(`无效的角色: ${invalid.join(', ')}`);
      }
    }

    // 设置默认角色
    const defaultRoles = userData.roles || [UserRole.CUSTOMER];

    const user = this.userRepository.create({
      ...userData,
      roles: defaultRoles,
      isActive: userData.isActive !== false,
    });

    const savedUser = await this.userRepository.save(user);

    // 记录审计日志
    if (actorId) {
      await this.auditLogService.logOperation({
        userId: actorId,
        operation: OperationType.USER_CREATE,
        targetId: savedUser.id,
        details: {
          createdUser: {
            email: savedUser.email,
            name: savedUser.name,
            roles: savedUser.roles,
          },
        },
        ipAddress: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      });
    }

    return this.sanitizeUser(savedUser);
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isDeleted: false }
    });
  }

  /**
   * 根据手机号查找用户
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phone, isDeleted: false }
    });
  }

  /**
   * 获取用户列表（分页）
   */
  async findAll(options: StaffQueryOptions = {}): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isDeleted = :isDeleted', { isDeleted: false });

    // 角色过滤
    if (role) {
      queryBuilder.andWhere('user.roles LIKE :role', { role: `%${role}%` });
    }

    // 状态过滤
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // 搜索过滤
    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.phone LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 排序
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map(user => this.sanitizeUser(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取员工列表（只显示员工角色）
   */
  async findStaff(options: StaffQueryOptions = {}): Promise<PaginatedUsers> {
    const staffRoles = [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.CASHIER,
      UserRole.KITCHEN_STAFF,
      UserRole.INVENTORY_MANAGER,
    ];

    return this.findAll({
      ...options,
      // 这里可以进一步过滤只显示员工角色的用户
    });
  }

  /**
   * 更新用户信息
   */
  async update(
    id: string,
    updateData: UpdateUserData,
    actorId?: string,
    request?: any
  ): Promise<User> {
    const user = await this.findById(id);

    // 如果要更新角色，需要检查权限
    if (updateData.roles) {
      const { valid, invalid } = this.permissionService.validateRoles(updateData.roles);
      if (invalid.length > 0) {
        throw new BadRequestException(`无效的角色: ${invalid.join(', ')}`);
      }

      // 检查操作者是否有权限更新此用户的角色
      if (actorId) {
        const oldRoles = user.roles;
        const newRoles = updateData.roles;

        // 检查是否有角色变更
        const rolesChanged = JSON.stringify(oldRoles.sort()) !== JSON.stringify(newRoles.sort());

        if (rolesChanged) {
          // 检查是否可以分配新角色
          for (const newRole of newRoles) {
            if (!oldRoles.includes(newRole)) {
              const canAssign = await this.permissionService.canAssignRoles(actorId, newRole);
              if (!canAssign) {
                throw new ForbiddenException(`没有权限分配角色: ${newRole}`);
              }
            }
          }
        }
      }
    }

    // 保存更新前的数据用于审计
    const oldData = { ...user };

    // 更新用户
    Object.assign(user, updateData);
    const savedUser = await this.userRepository.save(user);

    // 记录审计日志
    if (actorId) {
      await this.auditLogService.logOperation({
        userId: actorId,
        operation: OperationType.USER_UPDATE,
        targetId: savedUser.id,
        details: {
          changes: updateData,
          oldData: {
            name: oldData.name,
            phone: oldData.phone,
            roles: oldData.roles,
            isActive: oldData.isActive,
          },
        },
        ipAddress: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      });
    }

    return this.sanitizeUser(savedUser);
  }

  /**
   * 删除用户（软删除）
   */
  async remove(id: string, actorId?: string, request?: any): Promise<void> {
    const user = await this.findById(id);

    // 防止删除管理员
    if (user.isAdmin()) {
      throw new BadRequestException('不能删除管理员账户');
    }

    // 软删除
    user.isDeleted = true;
    await this.userRepository.save(user);

    // 记录审计日志
    if (actorId) {
      await this.auditLogService.logOperation({
        userId: actorId,
        operation: OperationType.USER_DELETE,
        targetId: user.id,
        details: {
          deletedUser: {
            email: user.email,
            name: user.name,
            roles: user.roles,
          },
        },
        ipAddress: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      });
    }
  }

  /**
   * 更新用户角色
   */
  async updateUserRoles(
    userId: string,
    newRoles: string[],
    actorId?: string,
    request?: any
  ): Promise<User> {
    const user = await this.findById(userId);

    // 检查操作者权限
    if (actorId) {
      // 防止用户修改自己的角色
      if (actorId === userId) {
        throw new BadRequestException('不能修改自己的角色');
      }

      // 检查是否可以分配这些角色
      for (const role of newRoles) {
        if (!user.roles.includes(role)) {
          const canAssign = await this.permissionService.canAssignRoles(actorId, role);
          if (!canAssign) {
            throw new ForbiddenException(`没有权限分配角色: ${role}`);
          }
        }
      }
    }

    // 更新角色
    await this.permissionService.updateUserRoles(userId, newRoles);
    const updatedUser = await this.findById(userId);

    // 记录审计日志
    if (actorId) {
      await this.auditLogService.logOperation({
        userId: actorId,
        operation: OperationType.ROLE_UPDATE,
        targetId: userId,
        details: {
          oldRoles: user.roles,
          newRoles: newRoles,
        },
        ipAddress: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      });
    }

    return this.sanitizeUser(updatedUser);
  }

  /**
   * 获取用户权限信息
   */
  async getUserPermissions(userId: string): Promise<{
    roles: string[];
    permissions: string[];
    effectivePermissions: string[];
  }> {
    const user = await this.findById(userId);
    const effectivePermissions = await this.permissionService.getUserPermissions(userId);

    return {
      roles: user.roles,
      permissions: effectivePermissions,
      effectivePermissions,
    };
  }

  /**
   * 获取用户审计日志
   */
  async getUserAuditLogs(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const auditLogs = await this.auditLogService.getUserAuditLogs(userId, limit, (page - 1) * limit);
    const total = await this.auditLogService.getUserAuditLogs(userId, 1000).then(logs => logs.length);

    return {
      data: auditLogs.map(log => ({
        ...log,
        details: log.getDetails(),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * 激活/停用用户
   */
  async toggleUserStatus(
    userId: string,
    isActive: boolean,
    actorId?: string,
    request?: any
  ): Promise<User> {
    const user = await this.findById(userId);

    // 防止停用管理员
    if (!isActive && user.isAdmin()) {
      throw new BadRequestException('不能停用管理员账户');
    }

    user.isActive = isActive;
    const savedUser = await this.userRepository.save(user);

    // 记录审计日志
    if (actorId) {
      await this.auditLogService.logOperation({
        userId: actorId,
        operation: isActive ? OperationType.STAFF_ACTIVATE : OperationType.STAFF_DEACTIVATE,
        targetId: userId,
        details: {
          targetUser: {
            email: user.email,
            name: user.name,
          },
          status: isActive ? 'active' : 'inactive',
        },
        ipAddress: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      });
    }

    return this.sanitizeUser(savedUser);
  }

  /**
   * 清理用户数据（移除敏感信息）
   */
  private sanitizeUser(user: User): User {
    const { password, ...sanitized } = user;
    return sanitized as User;
  }

  /**
   * 检查用户是否存在
   */
  async userExists(id: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { id, isDeleted: false },
    });
    return count > 0;
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    staffUsers: number;
    roleDistribution: Record<string, number>;
  }> {
    const users = await this.userRepository.find({
      where: { isDeleted: false },
    });

    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const staffUsers = users.filter(user => user.isStaff()).length;

    const roleDistribution: Record<string, number> = {};
    users.forEach(user => {
      user.roles.forEach(role => {
        roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      });
    });

    return {
      totalUsers,
      activeUsers,
      staffUsers,
      roleDistribution,
    };
  }
}