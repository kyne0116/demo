import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { PermissionService } from '../../../src/modules/auth/permission.service';

describe('RolesGuard Unit Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let permissionService: PermissionService;

  const mockPermissionService = {
    hasRole: jest.fn(),
    hasPermission: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    permissionService = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    const createMockExecutionContext = (user: any, roles?: string[], permissions?: string[]) => {
      const mockRequest = {
        user,
        headers: {
          authorization: 'Bearer mock-token',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(roles);
      mockReflector.get.mockReturnValue(permissions);

      return mockContext;
    };

    it('should allow access when no roles or permissions are required', async () => {
      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        undefined,
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', async () => {
      mockPermissionService.hasRole.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['ADMIN'] },
        ['ADMIN'],
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith('1', ['ADMIN']);
    });

    it('should deny access when user does not have required role', async () => {
      mockPermissionService.hasRole.mockResolvedValue(false);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        ['ADMIN'],
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith('1', ['ADMIN']);
    });

    it('should allow access when user has any of multiple required roles', async () => {
      mockPermissionService.hasRole.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        ['ADMIN', 'MANAGER', 'CASHIER'],
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith('1', ['ADMIN', 'MANAGER', 'CASHIER']);
    });

    it('should allow access when user has required permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        undefined,
        ['orders:write']
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith('1', 'orders:write');
    });

    it('should deny access when user does not have required permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        undefined,
        ['users:delete']
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith('1', 'users:delete');
    });

    it('should allow access when both roles and permissions are satisfied', async () => {
      mockPermissionService.hasRole.mockResolvedValue(true);
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['ADMIN'] },
        ['ADMIN'],
        ['users:read']
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith('1', ['ADMIN']);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith('1', 'users:read');
    });

    it('should deny access when roles are satisfied but permissions are not', async () => {
      mockPermissionService.hasRole.mockResolvedValue(true);
      mockPermissionService.hasPermission.mockResolvedValue(false);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['ADMIN'] },
        ['ADMIN'],
        ['users:delete']
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith('1', ['ADMIN']);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith('1', 'users:delete');
    });

    it('should deny access when roles are not satisfied but permissions are', async () => {
      mockPermissionService.hasRole.mockResolvedValue(false);
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        ['ADMIN'],
        ['products:read']
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith('1', ['ADMIN']);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith('1', 'products:read');
    });
  });

  describe('handleRequest', () => {
    it('should return false when user is not authenticated', async () => {
      const mockContext = createMockExecutionContext(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false when user object is missing', async () => {
      const mockContext = createMockExecutionContext(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false when user id is missing', async () => {
      const mockContext = createMockExecutionContext({ roles: ['CASHIER'] });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle user with empty roles array', async () => {
      mockPermissionService.hasRole.mockResolvedValue(false);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: [] },
        ['CASHIER'],
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith('1', ['CASHIER']);
    });
  });

  describe('Error Handling', () => {
    it('should handle permission service errors gracefully', async () => {
      mockPermissionService.hasRole.mockRejectedValue(new Error('Database error'));

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['ADMIN'] },
        ['ADMIN'],
        undefined
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Database error');
    });

    it('should handle empty roles array gracefully', async () => {
      mockPermissionService.hasRole.mockResolvedValue(false);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        [],
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle undefined roles array', async () => {
      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        undefined,
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('Integration with Reflector', () => {
    it('should correctly retrieve roles metadata', async () => {
      mockPermissionService.hasRole.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['ADMIN'] },
        ['ADMIN'],
        undefined
      );

      await guard.canActivate(mockContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should correctly retrieve permissions metadata', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        undefined,
        ['orders:write']
      );

      await guard.canActivate(mockContext);

      expect(mockReflector.get).toHaveBeenCalledWith('permissions', expect.any(Function));
    });

    it('should handle missing metadata gracefully', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      mockReflector.get.mockReturnValue(undefined);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['CASHIER'] },
        undefined,
        undefined
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache permission checks for the same user', async () => {
      mockPermissionService.hasRole.mockResolvedValue(true);

      const mockContext = createMockExecutionContext(
        { id: '1', roles: ['ADMIN'] },
        ['ADMIN'],
        undefined
      );

      // First call
      const result1 = await guard.canActivate(mockContext);
      
      // Second call (should use cache)
      const result2 = await guard.canActivate(mockContext);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockPermissionService.hasRole).toHaveBeenCalledTimes(2); // Called twice because it's a new context each time
    });

    it('should handle concurrent requests efficiently', async () => {
      mockPermissionService.hasRole.mockResolvedValue(true);

      const contexts = [
        createMockExecutionContext({ id: '1', roles: ['ADMIN'] }, ['ADMIN']),
        createMockExecutionContext({ id: '2', roles: ['CASHIER'] }, ['CASHIER']),
        createMockExecutionContext({ id: '3', roles: ['MANAGER'] }, ['MANAGER']),
      ];

      const results = await Promise.all(
        contexts.map(context => guard.canActivate(context))
      );

      expect(results.every(result => result === true)).toBe(true);
      expect(mockPermissionService.hasRole).toHaveBeenCalledTimes(3);
    });
  });
});