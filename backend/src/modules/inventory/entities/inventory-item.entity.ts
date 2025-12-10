import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OperationLog } from '../../users/entities/operation-log.entity';

export enum InventoryCategory {
  TEA = 'TEA',           // 茶叶类
  MILK = 'MILK',         // 乳制品类
  TOPPING = 'TOPPING',   // 配料类
  SYRUP = 'SYRUP',       // 糖浆类
  FRUIT = 'FRUIT',       // 水果类
  SPICE = 'SPICE',       // 香料类
  PACKAGING = 'PACKAGING', // 包装类
  CLEANING = 'CLEANING', // 清洁用品类
  OTHER = 'OTHER',       // 其他类
}

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ 
    type: 'enum', 
    enum: InventoryCategory,
    default: InventoryCategory.OTHER 
  })
  category: InventoryCategory;

  @Column({ type: 'varchar', length: 20 })
  unit: string; // 单位: kg, L, 个, 包, 瓶等

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStock: number; // 当前库存

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minStock: number; // 最小库存（预警线）

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000 })
  maxStock: number; // 最大库存

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number; // 成本价格

  @Column({ type: 'varchar', length: 100, nullable: true })
  supplier: string; // 供应商

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string; // 描述

  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null; // 过期日期

  @Column({ type: 'varchar', length: 100, nullable: true })
  batchNumber: string | null; // 批号

  @Column({ type: 'varchar', length: 50, nullable: true })
  storageLocation: string | null; // 存储位置

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 是否活跃（软删除）

  @Column({ type: 'boolean', default: false })
  requiresTracking: boolean; // 是否需要跟踪（过期日期、批号等）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 操作日志关系
  @OneToMany(() => OperationLog, (log) => log.inventoryItem)
  operationLogs: OperationLog[];

  // 获取库存状态
  getStockStatus(): 'NORMAL' | 'LOW' | 'OVERSTOCK' | 'EXPIRED' {
    if (this.expiryDate && new Date() > this.expiryDate) {
      return 'EXPIRED';
    }
    if (this.currentStock > this.maxStock) {
      return 'OVERSTOCK';
    }
    if (this.currentStock <= this.minStock) {
      return 'LOW';
    }
    return 'NORMAL';
  }

  // 检查是否需要补货
  needsReorder(): boolean {
    return this.currentStock <= this.minStock;
  }

  // 检查是否即将过期（7天内）
  isExpiringSoon(days: number = 7): boolean {
    if (!this.expiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(this.expiryDate);
    const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff <= days && daysDiff >= 0;
  }

  // 获取建议补货数量（补货到最大库存的80%）
  getRecommendedReorderQuantity(): number {
    const targetStock = this.maxStock * 0.8;
    return Math.max(0, targetStock - this.currentStock);
  }

  // 验证库存调整
  validateAdjustment(adjustment: number): { isValid: boolean; message?: string } {
    const newStock = this.currentStock + adjustment;
    
    if (newStock < 0) {
      return { isValid: false, message: '库存不能为负数' };
    }
    
    if (newStock > this.maxStock * 2) {
      return { isValid: false, message: '库存调整幅度过大' };
    }
    
    return { isValid: true };
  }

  // 获取库存等级
  getStockLevel(): 'OUT_OF_STOCK' | 'VERY_LOW' | 'LOW' | 'NORMAL' | 'HIGH' | 'OVERSTOCK' {
    if (this.currentStock <= 0) {
      return 'OUT_OF_STOCK';
    } else if (this.currentStock <= this.minStock * 0.5) {
      return 'VERY_LOW';
    } else if (this.currentStock <= this.minStock) {
      return 'LOW';
    } else if (this.currentStock >= this.maxStock * 1.2) {
      return 'OVERSTOCK';
    } else if (this.currentStock >= this.maxStock * 0.8) {
      return 'HIGH';
    } else {
      return 'NORMAL';
    }
  }

  // 获取库存周转率（基于最小库存计算）
  getTurnoverRate(consumptionPerDay: number): number {
    if (consumptionPerDay <= 0) return 0;
    return this.currentStock / consumptionPerDay;
  }
}