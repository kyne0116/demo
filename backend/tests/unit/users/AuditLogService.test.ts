import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../../src/modules/users/audit-log.service';
import { OperationLog } from '../../../src/modules/users/entities/OperationLog';

describe('AuditLogService Unit Tests', () => {
  let service: AuditLogService;
  let repository: Repository<OperationLog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(OperationLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get<Repository<OperationLog>>(getRepositoryToken(OperationLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logOperation', () => {
    it('should successfully log a user operation', async () => {
      const operationData = {
        userId: '1',
        operation: 'USER_CREATE',
        targetId: 'user-123',
        details: { name: 'New User', email: 'new@test.com' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const expectedLog = {
        id: 'log-1',
        userId: '1',
        operation: 'USER_CREATE',
        targetId: 'user-123',
        details: operationData.details,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(expectedLog);
      mockRepository.save.mockResolvedValue(expectedLog);

      const result = await service.logOperation(operationData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: '1',
        operation: 'USER_CREATE',
        targetId: 'user-123',
        details: operationData.details,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedLog);
      expect(result).toEqual(expectedLog);
    });

    it('should handle missing optional fields', async () => {
      const operationData = {
        userId: '1',
        operation: 'USER_LOGIN',
        // Missing optional fields
      };

      const expectedLog = {
        id: 'log-2',
        userId: '1',
        operation: 'USER_LOGIN',
        targetId: null,
        details: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(expectedLog);
      mockRepository.save.mockResolvedValue(expectedLog);

      const result = await service.logOperation(operationData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: '1',
        operation: 'USER_LOGIN',
        targetId: null,
        details: null,
        ipAddress: null,
        userAgent: null,
      });
      expect(result).toEqual(expectedLog);
    });

    it('should handle repository save errors', async () => {
      const operationData = {
        userId: '1',
        operation: 'USER_CREATE',
      };

      const saveError = new Error('Database connection failed');
      mockRepository.save.mockRejectedValue(saveError);

      await expect(service.logOperation(operationData))
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return audit logs for a specific user', async () => {
      const userLogs = [
        {
          id: 'log-1',
          userId: '1',
          operation: 'USER_CREATE',
          targetId: 'user-123',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'log-2',
          userId: '1',
          operation: 'ROLE_UPDATE',
          targetId: 'user-123',
          createdAt: new Date('2023-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(userLogs);

      const result = await service.getUserAuditLogs('1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
        order: { createdAt: 'DESC' },
        take: 50, // Default limit
      });
      expect(result).toEqual(userLogs);
    });

    it('should return empty array when no logs found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getUserAuditLogs('non-existent-user');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'non-existent-user' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual([]);
    });

    it('should respect pagination parameters', async () => {
      const userLogs = [];
      mockRepository.find.mockResolvedValue(userLogs);

      const result = await service.getUserAuditLogs('1', 10, 20);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 10,
      });
      expect(result).toEqual(userLogs);
    });
  });

  describe('getOperationLogs', () => {
    it('should return logs filtered by operation type', async () => {
      const operationLogs = [
        {
          id: 'log-1',
          userId: '1',
          operation: 'USER_CREATE',
          targetId: 'user-123',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'log-3',
          userId: '3',
          operation: 'USER_CREATE',
          targetId: 'user-456',
          createdAt: new Date('2023-01-03'),
        },
      ];

      mockRepository.find.mockResolvedValue(operationLogs);

      const result = await service.getOperationLogs('USER_CREATE');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { operation: 'USER_CREATE' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(operationLogs);
    });

    it('should return all logs when no operation filter provided', async () => {
      const allLogs = [
        {
          id: 'log-1',
          userId: '1',
          operation: 'USER_CREATE',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'log-2',
          userId: '2',
          operation: 'ROLE_UPDATE',
          createdAt: new Date('2023-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(allLogs);

      const result = await service.getOperationLogs();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(allLogs);
    });
  });

  describe('getAuditLogsByTarget', () => {
    it('should return logs for a specific target entity', async () => {
      const targetLogs = [
        {
          id: 'log-1',
          userId: '1',
          operation: 'USER_UPDATE',
          targetId: 'user-123',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'log-2',
          userId: '2',
          operation: 'ROLE_UPDATE',
          targetId: 'user-123',
          createdAt: new Date('2023-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(targetLogs);

      const result = await service.getAuditLogsByTarget('user-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { targetId: 'user-123' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(targetLogs);
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit log statistics', async () => {
      const mockLogs = [
        { operation: 'USER_CREATE', createdAt: new Date('2023-01-01') },
        { operation: 'USER_CREATE', createdAt: new Date('2023-01-02') },
        { operation: 'ROLE_UPDATE', createdAt: new Date('2023-01-03') },
        { operation: 'USER_DELETE', createdAt: new Date('2023-01-04') },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getAuditStatistics();

      expect(result).toEqual({
        totalLogs: 4,
        operationCounts: {
          USER_CREATE: 2,
          ROLE_UPDATE: 1,
          USER_DELETE: 1,
        },
        dateRange: {
          earliest: new Date('2023-01-01'),
          latest: new Date('2023-01-04'),
        },
      });
    });

    it('should handle empty logs gracefully', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAuditStatistics();

      expect(result).toEqual({
        totalLogs: 0,
        operationCounts: {},
        dateRange: {
          earliest: null,
          latest: null,
        },
      });
    });
  });

  describe('cleanOldLogs', () => {
    it('should successfully remove old audit logs', async () => {
      const cutoffDate = new Date('2023-01-01');
      const oldLogs = [
        { id: 'log-1', createdAt: new Date('2022-12-31') },
        { id: 'log-2', createdAt: new Date('2022-12-30') },
      ];

      mockRepository.find.mockResolvedValue(oldLogs);
      mockRepository.remove.mockResolvedValue(oldLogs);

      const result = await service.cleanOldLogs(cutoffDate);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { createdAt: expect.any(Object) },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(oldLogs);
      expect(result.deletedCount).toBe(2);
    });

    it('should handle case where no old logs exist', async () => {
      const cutoffDate = new Date('2023-01-01');
      const noOldLogs = [];

      mockRepository.find.mockResolvedValue(noOldLogs);

      const result = await service.cleanOldLogs(cutoffDate);

      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(result.deletedCount).toBe(0);
    });

    it('should handle errors during log removal', async () => {
      const cutoffDate = new Date('2023-01-01');
      const oldLogs = [{ id: 'log-1' }];
      const removeError = new Error('Removal failed');

      mockRepository.find.mockResolvedValue(oldLogs);
      mockRepository.remove.mockRejectedValue(removeError);

      await expect(service.cleanOldLogs(cutoffDate))
        .rejects
        .toThrow('Removal failed');
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity for a user', async () => {
      const recentLogs = [
        {
          id: 'log-1',
          userId: '1',
          operation: 'USER_LOGIN',
          createdAt: new Date(Date.now() - 1000),
        },
        {
          id: 'log-2',
          userId: '1',
          operation: 'USER_LOGOUT',
          createdAt: new Date(Date.now() - 2000),
        },
      ];

      mockRepository.find.mockResolvedValue(recentLogs);

      const result = await service.getRecentActivity('1', 5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
        order: { createdAt: 'DESC' },
        take: 5,
      });
      expect(result).toEqual(recentLogs);
    });
  });

  describe('searchLogs', () => {
    it('should search logs by operation type and date range', async () => {
      const searchResults = [
        {
          id: 'log-1',
          userId: '1',
          operation: 'USER_CREATE',
          targetId: 'user-123',
          createdAt: new Date('2023-01-15'),
        },
      ];

      mockRepository.find.mockResolvedValue(searchResults);

      const result = await service.searchLogs({
        operation: 'USER_CREATE',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      });

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          operation: 'USER_CREATE',
          createdAt: expect.any(Object),
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(searchResults);
    });

    it('should handle search with partial criteria', async () => {
      const searchResults = [];
      mockRepository.find.mockResolvedValue(searchResults);

      const result = await service.searchLogs({
        userId: '1',
        // Only user ID specified
      });

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: '1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(searchResults);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection lost');
      mockRepository.find.mockRejectedValue(dbError);

      await expect(service.getUserAuditLogs('1'))
        .rejects
        .toThrow('Database connection lost');
    });

    it('should handle invalid parameters gracefully', async () => {
      mockRepository.find.mockResolvedValue([]);

      // Should handle null userId
      const result = await service.getUserAuditLogs(null);
      expect(result).toEqual([]);

      // Should handle empty string userId
      const result2 = await service.getUserAuditLogs('');
      expect(result2).toEqual([]);
    });
  });
});