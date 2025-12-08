import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException, 
  ForbiddenException,
  SetMetadata
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../modules/auth/permission.service';

// 装饰器元数据键名
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

// 角色装饰器
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// 权限装饰器
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否需要权限验证
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置权限要求，允许访问
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 检查用户是否已认证
    if (!user || !user.id) {
      throw new UnauthorizedException('用户未认证');
    }

    // 如果只要求角色验证
    if (requiredRoles && !requiredPermissions) {
      return await this.checkRoles(user.id, requiredRoles);
    }

    // 如果只要求权限验证
    if (!requiredRoles && requiredPermissions) {
      return await this.checkPermissions(user.id, requiredPermissions);
    }

    // 如果同时要求角色和权限验证
    if (requiredRoles && requiredPermissions) {
      const hasRoles = await this.checkRoles(user.id, requiredRoles);
      const hasPermissions = await this.checkPermissions(user.id, requiredPermissions);
      
      return hasRoles && hasPermissions;
    }

    return false;
  }

  private async checkRoles(userId: string, requiredRoles: string[]): Promise<boolean> {
    try {
      const hasRole = await this.permissionService.hasRole(userId, requiredRoles);
      
      if (!hasRole) {
        throw new ForbiddenException('权限不足：需要指定的角色');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('权限验证失败');
    }
  }

  private async checkPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    try {
      // 检查用户是否拥有所有要求的权限
      for (const permission of requiredPermissions) {
        const hasPermission = await this.permissionService.hasPermission(userId, permission);
        
        if (!hasPermission) {
          throw new ForbiddenException(`权限不足：需要权限 ${permission}`);
        }
      }
      
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('权限验证失败');
    }
  }

  // 辅助方法：获取用户的有效权限
  async getUserEffectivePermissions(userId: string): Promise<string[]> {
    return this.permissionService.getUserPermissions(userId);
  }

  // 辅助方法：检查用户是否拥有特定角色
  async checkUserRole(userId: string, role: string): Promise<boolean> {
    return this.permissionService.hasRole(userId, [role]);
  }
}