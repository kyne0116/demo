import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OperationLog, OperationType } from '../users/entities/operation-log.entity';

export interface LogOperationData {
  userId: string;
  operation: OperationType;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface SearchLogsCriteria {
  userId?: string;
  operation?: OperationType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalLogs: number;
  operationCounts: Record<OperationType, number>;
  dateRange: {
    earliest: Date | null;
    latest: Date | null;
  };
  userActivity: Record<string, number>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
  ) {}

  /**
   * 记录用户操作
   */
  async logOperation(data: LogOperationData): Promise<OperationLog> {
    const operationLog = this.operationLogRepository.create({
      userId: data.userId,
      operation: data.operation,
      targetId: data.targetId || null,
      details: data.details ? JSON.stringify(data.details) : null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      sessionId: data.sessionId || null,
      errorMessage: data.errorMessage || null,
      metadata: data.metadata || null,
    });

    return this.operationLogRepository.save(operationLog);
  }

  /**
   * 获取用户的审计日志
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<OperationLog[]> {
    return this.operationLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(operation?: OperationType): Promise<OperationLog[]> {
    const where = operation ? { operation } : {};
    
    return this.operationLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据目标ID获取审计日志
   */
  async getAuditLogsByTarget(targetId: string): Promise<OperationLog[]> {
    return this.operationLogRepository.find({
      where: { targetId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取审计统计信息
   */
  async getAuditStatistics(): Promise<AuditStatistics> {
    const logs = await this.operationLogRepository.find();

    const operationCounts: Record<OperationType, number> = {} as Record<OperationType, number>;
    const userActivity: Record<string, number> = {};

    let earliest: Date | null = null;
    let latest: Date | null = null;

    logs.forEach(log => {
      // 统计操作类型
      operationCounts[log.operation] = (operationCounts[log.operation] || 0) + 1;

      // 统计用户活动
      userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;

      // 记录时间范围
      if (!earliest || log.createdAt < earliest) {
        earliest = log.createdAt;
      }
      if (!latest || log.createdAt > latest) {
        latest = log.createdAt;
      }
    });

    return {
      totalLogs: logs.length,
      operationCounts,
      dateRange: {
        earliest,
        latest,
      },
      userActivity,
    };
  }

  /**
   * 清理旧的审计日志
   */
  async cleanOldLogs(cutoffDate: Date): Promise<{ deletedCount: number }> {
    const oldLogs = await this.operationLogRepository.find({
      where: {
        createdAt: LessThan(cutoffDate),
      },
    });

    if (oldLogs.length > 0) {
      await this.operationLogRepository.remove(oldLogs);
    }

    return { deletedCount: oldLogs.length };
  }

  /**
   * 获取用户最近活动
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<OperationLog[]> {
    return this.operationLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 搜索审计日志
   */
  async searchLogs(criteria: SearchLogsCriteria): Promise<OperationLog[]> {
    const queryBuilder = this.operationLogRepository.createQueryBuilder('log');

    if (criteria.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: criteria.userId });
    }

    if (criteria.operation) {
      queryBuilder.andWhere('log.operation = :operation', { operation: criteria.operation });
    }

    if (criteria.targetId) {
      queryBuilder.andWhere('log.targetId = :targetId', { targetId: criteria.targetId });
    }

    if (criteria.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: criteria.startDate });
    }

    if (criteria.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: criteria.endDate });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');

    if (criteria.limit) {
      queryBuilder.take(criteria.limit);
    }

    if (criteria.offset) {
      queryBuilder.skip(criteria.offset);
    }

    return queryBuilder.getMany();
  }

  /**
   * 批量记录操作
   */
  async batchLogOperations(operations: LogOperationData[]): Promise<OperationLog[]> {
    const operationLogs = operations.map(data => 
      this.operationLogRepository.create({
        userId: data.userId,
        operation: data.operation,
        targetId: data.targetId || null,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        sessionId: data.sessionId || null,
        errorMessage: data.errorMessage || null,
        metadata: data.metadata || null,
      })
    );

    return this.operationLogRepository.save(operationLogs);
  }

  /**
   * 获取操作日志的分页数据
   */
  async getPaginatedLogs(
    page: number = 1,
    limit: number = 20,
    filters?: Partial<SearchLogsCriteria>
  ): Promise<{
    data: OperationLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [logs, total] = await this.operationLogRepository.findAndCount({
      where: filters || {},
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取用户操作趋势
   */
  async getUserActivityTrend(
    userId: string,
    days: number = 30
  ): Promise<{
    date: string;
    count: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.operationLogRepository
      .createQueryBuilder('log')
      .select('DATE(log.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .groupBy('DATE(log.createdAt)')
      .orderBy('date', 'ASC');

    return queryBuilder.getRawMany();
  }

  /**
   * 检查是否存在特定操作记录
   */
  async hasOperation(
    userId: string,
    operation: OperationType,
    targetId?: string,
    withinMinutes?: number
  ): Promise<boolean> {
    const where: any = { userId, operation };

    if (targetId) {
      where.targetId = targetId;
    }

    if (withinMinutes) {
      const since = new Date();
      since.setMinutes(since.getMinutes() - withinMinutes);
      where.createdAt = (repository: any) => {
        return repository >= since;
      };
    }

    const count = await this.operationLogRepository.count({ where });
    return count > 0;
  }
}