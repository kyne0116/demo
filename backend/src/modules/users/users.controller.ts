import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query,
  Request,
  HttpStatus,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { 
  AuthGuard, 
} from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { UsersService, StaffQueryOptions } from './users.service';
import { User } from './entities/user.entity';
import { RolesGuard, Roles, Permissions } from '../../common/guards/roles.guard';
import { SystemPermission, UserRole } from './entities/user.entity';

@ApiTags('员工管理')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 创建员工
   * 需要 ADMIN 或 MANAGER 权限
   */
  @Post('staff')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('staff:write')
  @ApiOperation({ summary: '创建员工' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '张三' },
        email: { type: 'string', example: 'zhangsan@test.com' },
        phone: { type: 'string', example: '13800138000' },
        roles: { 
          type: 'array', 
          items: { type: 'string' }, 
          example: ['CASHIER'] 
        },
        password: { type: 'string', example: 'password123' },
      },
      required: ['name', 'email', 'password', 'roles']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '员工创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: '权限不足' 
  })
  async createStaff(
    @Body() createUserDto: any,
    @Request() req: any
  ) {
    return this.usersService.create(createUserDto, req.user.id, req);
  }

  /**
   * 获取员工列表
   * 需要 ADMIN 或 MANAGER 权限
   */
  @Get('staff')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('staff:read')
  @ApiOperation({ summary: '获取员工列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['ASC', 'DESC'] })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              roles: { type: 'array', items: { type: 'string' } },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      }
    }
  })
  async getStaffList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('role') role?: string,
    @Query('isActive', ParseIntPipe) isActive?: boolean,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const options: StaffQueryOptions = {
      page,
      limit,
      role,
      isActive,
      search,
      sortBy,
      sortOrder,
    };
    
    return this.usersService.findStaff(options);
  }

  /**
   * 获取员工详情
   * 需要 ADMIN 或 MANAGER 权限，或查看自己的信息
   */
  @Get('staff/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('staff:read')
  @ApiOperation({ summary: '获取员工详情' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '员工不存在' })
  async getStaffDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    // 员工可以查看自己的信息
    if (req.user.id !== id) {
      // 这里可以通过RolesGuard自动处理权限检查
    }
    
    return this.usersService.findById(id);
  }

  /**
   * 更新员工信息
   * 需要 ADMIN 或 MANAGER 权限
   */
  @Put('staff/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('staff:write')
  @ApiOperation({ summary: '更新员工信息' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        isActive: { type: 'boolean' },
        profileImageUrl: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  async updateStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: any,
    @Request() req: any
  ) {
    return this.usersService.update(id, updateUserDto, req.user.id, req);
  }

  /**
   * 删除员工
   * 需要 ADMIN 权限
   */
  @Delete('staff/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Permissions('staff:delete')
  @ApiOperation({ summary: '删除员工' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '不能删除管理员' })
  async deleteStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    await this.usersService.remove(id, req.user.id, req);
    return { message: '员工删除成功' };
  }

  /**
   * 更新员工角色
   * 需要 ADMIN 或 MANAGER 权限
   */
  @Put('staff/:id/roles')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('staff:write')
  @ApiOperation({ summary: '更新员工角色' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: { type: 'string' },
          example: ['CASHIER', 'KITCHEN_STAFF']
        }
      },
      required: ['roles']
    }
  })
  @ApiResponse({ status: HttpStatus.OK, description: '角色更新成功' })
  async updateStaffRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { roles: string[] },
    @Request() req: any
  ) {
    return this.usersService.updateUserRoles(id, body.roles, req.user.id, req);
  }

  /**
   * 获取员工权限信息
   * 需要 ADMIN 或 MANAGER 权限，或查看自己的权限
   */
  @Get('staff/:id/permissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('staff:read')
  @ApiOperation({ summary: '获取员工权限信息' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        roles: { type: 'array', items: { type: 'string' } },
        permissions: { type: 'array', items: { type: 'string' } },
        effectivePermissions: { type: 'array', items: { type: 'string' } },
      }
    }
  })
  async getStaffPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserPermissions(id);
  }

  /**
   * 获取员工审计日志
   * 需要 ADMIN 或 MANAGER 权限
   */
  @Get('staff/:id/audit-logs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('staff:read')
  @ApiOperation({ summary: '获取员工审计日志' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              operation: { type: 'string' },
              targetId: { type: 'string' },
              details: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' },
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      }
    }
  })
  async getStaffAuditLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getUserAuditLogs(id, page, limit);
  }

  /**
   * 激活/停用员工
   * 需要 ADMIN 权限
   */
  @Put('staff/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Permissions('staff:write')
  @ApiOperation({ summary: '激活/停用员工' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', example: true }
      },
      required: ['isActive']
    }
  })
  @ApiResponse({ status: HttpStatus.OK, description: '状态更新成功' })
  async toggleStaffStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { isActive: boolean },
    @Request() req: any
  ) {
    return this.usersService.toggleUserStatus(id, body.isActive, req.user.id, req);
  }

  /**
   * 获取当前用户资料
   * 需要认证
   */
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户资料' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getCurrentUser(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  /**
   * 更新当前用户资料
   * 需要认证
   */
  @Put('profile')
  @ApiOperation({ summary: '更新当前用户资料' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        profileImageUrl: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  async updateCurrentUser(
    @Body() updateUserDto: any,
    @Request() req: any
  ) {
    return this.usersService.update(req.user.id, updateUserDto, req.user.id, req);
  }

  /**
   * 获取用户统计信息
   * 需要 ADMIN 权限
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取用户统计信息' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number' },
        activeUsers: { type: 'number' },
        staffUsers: { type: 'number' },
        roleDistribution: { 
          type: 'object',
          additionalProperties: { type: 'number' }
        },
      }
    }
  })
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  /**
   * 获取所有用户（管理员功能）
   * 需要 ADMIN 权限
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '获取所有用户' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ page, limit, search });
  }
}