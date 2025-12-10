import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './user.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

// 操作类型枚举
export enum OperationType {
  // 用户相关操作
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  
  // 角色权限操作
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  ROLE_REMOVE = 'ROLE_REMOVE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
  
  // 员工管理操作
  STAFF_CREATE = 'STAFF_CREATE',
  STAFF_UPDATE = 'STAFF_UPDATE',
  STAFF_DELETE = 'STAFF_DELETE',
  STAFF_ACTIVATE = 'STAFF_ACTIVATE',
  STAFF_DEACTIVATE = 'STAFF_DEACTIVATE',
  
  // 订单操作
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_CANCEL = 'ORDER_CANCEL',
  ORDER_COMPLETE = 'ORDER_COMPLETE',
  
  // 产品操作
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  
  // 库存操作
  INVENTORY_UPDATE = 'INVENTORY_UPDATE',
  INVENTORY_LOW_STOCK = 'INVENTORY_LOW_STOCK',
  INVENTORY_RESTOCK = 'INVENTORY_RESTOCK',
  
  // 系统操作
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_CONFIG_UPDATE = 'SYSTEM_CONFIG_UPDATE',
  REPORT_GENERATE = 'REPORT_GENERATE',
}

@Entity('operation_logs')
@Index(['userId', 'createdAt'])
@Index(['operation', 'createdAt'])
@Index(['targetId', 'operation'])
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: OperationType,
  })
  @Index()
  operation: OperationType;

  @Column('uuid', { nullable: true })
  @Index()
  targetId: string | null; // 操作目标ID（如被更新的用户ID、订单ID等）

  @Column('text', { nullable: true })
  details: string | null; // 操作详情（JSON字符串）

  @Column('varchar', { length: 45, nullable: true })
  ipAddress: string | null; // 操作IP地址

  @Column('text', { nullable: true })
  userAgent: string | null; // 用户代理字符串

  @Column('text', { nullable: true })
  sessionId: string | null; // 会话ID

  @Column('text', { nullable: true })
  errorMessage: string | null; // 如果操作失败，记录错误信息

  @Column('json', { nullable: true })
  metadata: Record<string, any> | null; // 额外的元数据

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // 关系
  @ManyToOne(() => User, user => user.operationLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => InventoryItem, item => item.operationLogs, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem | null;

  // 辅助方法
  getDetails(): any {
    if (!this.details) return null;
    try {
      return JSON.parse(this.details);
    } catch {
      return this.details;
    }
  }

  setDetails(details: any): void {
    if (details === null || details === undefined) {
      this.details = null;
    } else if (typeof details === 'string') {
      this.details = details;
    } else {
      this.details = JSON.stringify(details);
    }
  }

  isSuccess(): boolean {
    return !this.errorMessage;
  }

  setSuccess(success: boolean, errorMessage?: string): void {
    if (success) {
      this.errorMessage = null;
    } else {
      this.errorMessage = errorMessage || 'Unknown error';
    }
  }

  static createSuccessLog(
    userId: string,
    operation: OperationType,
    targetId?: string,
    details?: any,
    metadata?: Record<string, any>
  ): Partial<OperationLog> {
    const log = new OperationLog();
    log.userId = userId;
    log.operation = operation;
    log.targetId = targetId || null;
    log.setDetails(details);
    log.metadata = metadata;
    log.setSuccess(true);
    return log;
  }

  static createErrorLog(
    userId: string,
    operation: OperationType,
    errorMessage: string,
    targetId?: string,
    details?: any,
    metadata?: Record<string, any>
  ): Partial<OperationLog> {
    const log = new OperationLog();
    log.userId = userId;
    log.operation = operation;
    log.targetId = targetId || null;
    log.setDetails(details);
    log.metadata = metadata;
    log.setSuccess(false, errorMessage);
    return log;
  }
}