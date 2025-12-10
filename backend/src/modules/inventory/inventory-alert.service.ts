import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OperationType } from '../users/entities/operation-log.entity';

export interface InventoryAlert {
  id: number;
  itemId: number;
  itemName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier?: string;
  daysUntilReorder?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  alertType: 'LOW_STOCK' | 'OVERSTOCK' | 'EXPIRY' | 'REORDER';
  message: string;
  createdAt: Date;
  acknowledged: boolean;
}

export interface AlertStatistics {
  total: number;
  high: number;
  medium: number;
  low: number;
  lowStock: number;
  overstock: number;
  expiry: number;
  reorder: number;
}

@Injectable()
export class InventoryAlertService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * 获取所有库存预警
   */
  async getAllAlerts(): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];

    // 获取所有活跃的库存项
    const inventoryItems = await this.inventoryRepository.find({
      where: { isActive: true },
      relations: ['operationLogs'],
    });

    for (const item of inventoryItems) {
      const itemAlerts = this.generateAlertsForItem(item);
      alerts.push(...itemAlerts);
    }

    // 按优先级和创建时间排序
    return alerts.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * 获取库存预警统计
   */
  async getAlertStatistics(): Promise<AlertStatistics> {
    const alerts = await this.getAllAlerts();

    const stats: AlertStatistics = {
      total: alerts.length,
      high: alerts.filter(a => a.priority === 'HIGH').length,
      medium: alerts.filter(a => a.priority === 'MEDIUM').length,
      low: alerts.filter(a => a.priority === 'LOW').length,
      lowStock: alerts.filter(a => a.alertType === 'LOW_STOCK').length,
      overstock: alerts.filter(a => a.alertType === 'OVERSTOCK').length,
      expiry: alerts.filter(a => a.alertType === 'EXPIRY').length,
      reorder: alerts.filter(a => a.alertType === 'REORDER').length,
    };

    return stats;
  }

  /**
   * 标记预警为已读
   */
  async acknowledgeAlert(alertId: number): Promise<void> {
    // 这里可以将预警标记存储到数据库中
    // 目前使用内存存储，实际项目中应该使用数据库表
    console.log(`预警 ${alertId} 已标记为已读`);
  }

  /**
   * 批量标记预警为已读
   */
  async acknowledgeAlerts(alertIds: number[]): Promise<void> {
    for (const alertId of alertIds) {
      await this.acknowledgeAlert(alertId);
    }
  }

  /**
   * 获取需要自动预警的库存项
   */
  async getItemsNeedingAlerts(): Promise<InventoryItem[]> {
    const inventoryItems = await this.inventoryRepository.find({
      where: { isActive: true },
    });

    return inventoryItems.filter(item => {
      const alerts = this.generateAlertsForItem(item);
      return alerts.some(alert => 
        alert.priority === 'HIGH' || 
        (alert.priority === 'MEDIUM' && alert.alertType === 'LOW_STOCK')
      );
    });
  }

  /**
   * 定时检查库存预警
   */
  async checkInventoryAlerts(): Promise<void> {
    const alerts = await this.getAllAlerts();
    const urgentAlerts = alerts.filter(alert => 
      alert.priority === 'HIGH' || 
      (alert.priority === 'MEDIUM' && alert.alertType === 'LOW_STOCK')
    );

    if (urgentAlerts.length > 0) {
      console.log(`发现 ${urgentAlerts.length} 个紧急库存预警`);
      // 这里可以发送通知给管理员
      // await this.notificationService.sendInventoryAlerts(urgentAlerts);
    }
  }

  /**
   * 为单个库存项生成预警
   */
  private generateAlertsForItem(item: InventoryItem): InventoryAlert[] {
    const alerts: InventoryAlert[] = [];
    const currentStock = Number(item.currentStock);
    const minStock = Number(item.minStock);
    const maxStock = Number(item.maxStock);
    const costPrice = Number(item.costPrice);

    // 低库存预警
    if (currentStock < minStock) {
      const stockLevel = currentStock / minStock;
      const priority = stockLevel < 0.3 ? 'HIGH' : 'MEDIUM';
      const daysUntilReorder = this.estimateDaysUntilReorder(item);

      alerts.push({
        id: this.generateAlertId(item.id, 'LOW_STOCK'),
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock,
        minStock,
        maxStock,
        unit: item.unit,
        supplier: item.supplier,
        daysUntilReorder,
        priority,
        alertType: 'LOW_STOCK',
        message: `库存不足: ${item.name} 当前库存 ${currentStock}${item.unit}, 低于最小库存 ${minStock}${item.unit}`,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    // 超库存预警
    if (currentStock > maxStock * 1.2) {
      const excessAmount = currentStock - maxStock;
      const priority = excessAmount > maxStock * 0.5 ? 'HIGH' : 'MEDIUM';

      alerts.push({
        id: this.generateAlertId(item.id, 'OVERSTOCK'),
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock,
        minStock,
        maxStock,
        unit: item.unit,
        supplier: item.supplier,
        priority,
        alertType: 'OVERSTOCK',
        message: `库存过多: ${item.name} 当前库存 ${currentStock}${item.unit}, 超出最大库存 ${maxStock}${item.unit}`,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    // 补货预警（库存低于最小库存的150%）
    if (currentStock < minStock * 1.5 && currentStock >= minStock) {
      const daysUntilReorder = this.estimateDaysUntilReorder(item);
      const priority = daysUntilReorder <= 2 ? 'HIGH' : 'MEDIUM';

      alerts.push({
        id: this.generateAlertId(item.id, 'REORDER'),
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock,
        minStock,
        maxStock,
        unit: item.unit,
        supplier: item.supplier,
        daysUntilReorder,
        priority,
        alertType: 'REORDER',
        message: `需要补货: ${item.name} 预计 ${daysUntilReorder} 天后需要补货`,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    // 过期预警（如果有保质期）
    if (item.expiryDate && item.expiryDate < new Date()) {
      const expiredDays = Math.floor((new Date().getTime() - item.expiryDate.getTime()) / (1000 * 60 * 60 * 24));
      const priority = expiredDays > 7 ? 'HIGH' : 'MEDIUM';

      alerts.push({
        id: this.generateAlertId(item.id, 'EXPIRY'),
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock,
        minStock,
        maxStock,
        unit: item.unit,
        supplier: item.supplier,
        priority,
        alertType: 'EXPIRY',
        message: `已过期: ${item.name} 已过期 ${expiredDays} 天`,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    return alerts;
  }

  /**
   * 生成预警ID
   */
  private generateAlertId(itemId: number, alertType: string): number {
    return parseInt(`${itemId}${alertType.charCodeAt(0)}`);
  }

  /**
   * 估算需要补货的天数
   */
  private estimateDaysUntilReorder(item: InventoryItem): number {
    // 计算最近7天的平均日消耗量
    const averageConsumption = this.calculateAverageDailyConsumption(item);
    
    if (averageConsumption <= 0) {
      return 30; // 如果没有消耗数据，假设30天后需要补货
    }

    const daysUntilMinStock = (Number(item.currentStock) - Number(item.minStock)) / averageConsumption;
    return Math.max(1, Math.floor(daysUntilMinStock));
  }

  /**
   * 计算平均日消耗量
   */
  private calculateAverageDailyConsumption(item: InventoryItem): number {
    // 这里应该根据实际的订单数据计算消耗量
    // 简化实现，基于操作日志计算
    const consumptionLogs = item.operationLogs?.filter(log =>
      log.operation === OperationType.INVENTORY_UPDATE && Number(log.metadata?.quantityChange || 0) < 0
    ) || [];

    if (consumptionLogs.length === 0) {
      return 0.1; // 默认每天消耗0.1个单位
    }

    const totalConsumed = consumptionLogs.reduce((sum, log) =>
      sum + Math.abs(Number(log.metadata?.quantityChange || 0)), 0
    );

    const daysSpan = Math.max(1, Math.floor((Date.now() - consumptionLogs[consumptionLogs.length - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    
    return totalConsumed / daysSpan;
  }

  /**
   * 获取库存预警摘要（用于仪表板显示）
   */
  async getAlertSummary(): Promise<{
    total: number;
    critical: number;
    warning: number;
    info: number;
    categories: Array<{ category: string; count: number; }>;
  }> {
    const alerts = await this.getAllAlerts();
    
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.priority === 'HIGH').length,
      warning: alerts.filter(a => a.priority === 'MEDIUM').length,
      info: alerts.filter(a => a.priority === 'LOW').length,
      categories: [] as Array<{ category: string; count: number; }>,
    };

    // 按类别统计
    const categoryCount = new Map<string, number>();
    for (const alert of alerts) {
      const count = categoryCount.get(alert.category) || 0;
      categoryCount.set(alert.category, count + 1);
    }

    summary.categories = Array.from(categoryCount.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    return summary;
  }
}