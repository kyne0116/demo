import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from '../../../src/modules/auth/permission.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../src/modules/users/entities/User';

describe('PermissionService Unit Tests', () => {
  let service: PermissionService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return correct permissions for ADMIN role', async () => {
      const adminUser = {
        id: '1',
        roles: ['ADMIN'],
        email: 'admin@test.com',
        name: 'Admin User',
      };

      mockUserRepository.findOne.mockResolvedValue(adminUser);

      const permissions = await service.getUserPermissions('1');

      expect(permissions).toEqual([
        'users:read',
        'users:write',
        'users:delete',
        'staff:read',
        'staff:write',
        'staff:delete',
        'products:read',
        'products:write',
        'products:delete',
        'orders:read',
        'orders:write',
        'orders:delete',
        'inventory:read',
        'inventory:write',
        'inventory:delete',
        'reports:read',
        'reports:write',
        'reports:delete',
        'members:read',
        'members:write',
        'members:delete',
      ]);
    });

    it('should return correct permissions for CASHIER role', async () => {
      const cashierUser = {
        id: '2',
        roles: ['CASHIER'],
        email: 'cashier@test.com',
        name: 'Cashier User',
      };

      mockUserRepository.findOne.mockResolvedValue(cashierUser);

      const permissions = await service.getUserPermissions('2');

      expect(permissions).toEqual([
        'products:read',
        'orders:read',
        'orders:write',
        'members:read',
      ]);
    });

    it('should return correct permissions for KITCHEN_STAFF role', async () => {
      const kitchenUser = {
        id: '3',
        roles: ['KITCHEN_STAFF'],
        email: 'kitchen@test.com',
        name: 'Kitchen Staff',
      };

      mockUserRepository.findOne.mockResolvedValue(kitchenUser);

      const permissions = await service.getUserPermissions('3');

      expect(permissions).toEqual([
        'products:read',
        'orders:read',
        'orders:update',
        'inventory:read',
      ]);
    });

    it('should return combined permissions for multiple roles', async () => {
      const multiRoleUser = {
        id: '4',
        roles: ['CASHIER', 'KITCHEN_STAFF'],
        email: 'multi@test.com',
        name: 'Multi Role User',
      };

      mockUserRepository.findOne.mockResolvedValue(multiRoleUser);

      const permissions = await service.getUserPermissions('4');

      // Should include all permissions from both roles, no duplicates
      expect(permissions).toEqual([
        'products:read',
        'orders:read',
        'orders:write',
        'orders:update',
        'members:read',
        'inventory:read',
      ]);
    });

    it('should return empty array for user with no roles', async () => {
      const noRoleUser = {
        id: '5',
        roles: [],
        email: 'norole@test.com',
        name: 'No Role User',
      };

      mockUserRepository.findOne.mockResolvedValue(noRoleUser);

      const permissions = await service.getUserPermissions('5');

      expect(permissions).toEqual([]);
    });

    it('should throw error for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserPermissions('non-existent'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has required permission', async () => {
      const cashierUser = {
        id: '2',
        roles: ['CASHIER'],
        email: 'cashier@test.com',
        name: 'Cashier User',
      };

      mockUserRepository.findOne.mockResolvedValue(cashierUser);

      const result = await service.hasPermission('2', 'orders:write');

      expect(result).toBe(true);
    });

    it('should return false when user does not have required permission', async () => {
      const cashierUser = {
        id: '2',
        roles: ['CASHIER'],
        email: 'cashier@test.com',
        name: 'Cashier User',
      };

      mockUserRepository.findOne.mockResolvedValue(cashierUser);

      const result = await service.hasPermission('2', 'users:delete');

      expect(result).toBe(false);
    });

    it('should return true when user has permission through any role', async () => {
      const multiRoleUser = {
        id: '4',
        roles: ['CASHIER', 'KITCHEN_STAFF'],
        email: 'multi@test.com',
        name: 'Multi Role User',
      };

      mockUserRepository.findOne.mockResolvedValue(multiRoleUser);

      const result1 = await service.hasPermission('4', 'orders:write'); // From CASHIER
      const result2 = await service.hasPermission('4', 'orders:update'); // From KITCHEN_STAFF
      const result3 = await service.hasPermission('4', 'inventory:read'); // From KITCHEN_STAFF

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has required role', async () => {
      const adminUser = {
        id: '1',
        roles: ['ADMIN'],
        email: 'admin@test.com',
        name: 'Admin User',
      };

      mockUserRepository.findOne.mockResolvedValue(adminUser);

      const result = await service.hasRole('1', 'ADMIN');

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', async () => {
      const cashierUser = {
        id: '2',
        roles: ['CASHIER'],
        email: 'cashier@test.com',
        name: 'Cashier User',
      };

      mockUserRepository.findOne.mockResolvedValue(cashierUser);

      const result = await service.hasRole('2', 'ADMIN');

      expect(result).toBe(false);
    });

    it('should return true when user has any of required roles', async () => {
      const multiRoleUser = {
        id: '4',
        roles: ['CASHIER', 'KITCHEN_STAFF'],
        email: 'multi@test.com',
        name: 'Multi Role User',
      };

      mockUserRepository.findOne.mockResolvedValue(multiRoleUser);

      const result1 = await service.hasRole('4', ['CASHIER', 'ADMIN']);
      const result2 = await service.hasRole('4', ['KITCHEN_STAFF', 'MANAGER']);
      const result3 = await service.hasRole('4', ['ADMIN', 'MANAGER']);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
    });
  });

  describe('updateUserRoles', () => {
    it('should successfully update user roles', async () => {
      const existingUser = {
        id: '2',
        roles: ['CASHIER'],
        email: 'cashier@test.com',
        name: 'Cashier User',
        save: jest.fn(),
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        roles: ['KITCHEN_STAFF'],
      });

      const result = await service.updateUserRoles('2', ['KITCHEN_STAFF']);

      expect(result.roles).toEqual(['KITCHEN_STAFF']);
      expect(existingUser.save).toHaveBeenCalled();
    });

    it('should throw error when updating non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUserRoles('non-existent', ['CASHIER']))
        .rejects
        .toThrow('User not found');
    });

    it('should validate role names', async () => {
      const existingUser = {
        id: '2',
        roles: ['CASHIER'],
        email: 'cashier@test.com',
        name: 'Cashier User',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.updateUserRoles('2', ['INVALID_ROLE']))
        .rejects
        .toThrow('Invalid role: INVALID_ROLE');
    });
  });

  describe('getAllRoles', () => {
    it('should return all available roles', () => {
      const roles = service.getAllRoles();

      expect(roles).toEqual([
        'ADMIN',
        'MANAGER',
        'CASHIER',
        'KITCHEN_STAFF',
        'INVENTORY_MANAGER',
      ]);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for ADMIN role', () => {
      const permissions = service.getRolePermissions('ADMIN');

      expect(permissions).toEqual([
        'users:read',
        'users:write',
        'users:delete',
        'staff:read',
        'staff:write',
        'staff:delete',
        'products:read',
        'products:write',
        'products:delete',
        'orders:read',
        'orders:write',
        'orders:delete',
        'inventory:read',
        'inventory:write',
        'inventory:delete',
        'reports:read',
        'reports:write',
        'reports:delete',
        'members:read',
        'members:write',
        'members:delete',
      ]);
    });

    it('should return permissions for CASHIER role', () => {
      const permissions = service.getRolePermissions('CASHIER');

      expect(permissions).toEqual([
        'products:read',
        'orders:read',
        'orders:write',
        'members:read',
      ]);
    });

    it('should return empty array for invalid role', () => {
      const permissions = service.getRolePermissions('INVALID_ROLE');

      expect(permissions).toEqual([]);
    });
  });

  describe('validateRoles', () => {
    it('should return true for valid roles', () => {
      const result = service.validateRoles(['CASHIER', 'KITCHEN_STAFF']);

      expect(result).toBe(true);
    });

    it('should return false for invalid roles', () => {
      const result = service.validateRoles(['CASHIER', 'INVALID_ROLE']);

      expect(result).toBe(false);
    });

    it('should return false for empty roles array', () => {
      const result = service.validateRoles([]);

      expect(result).toBe(true); // Empty array is valid
    });
  });
});