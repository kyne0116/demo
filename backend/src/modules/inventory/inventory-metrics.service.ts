import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OperationType } from '../users/entities/operation-log.entity';

export interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  overStockItems: number;
  averageTurnover: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  stockTrends: Array<{
    date: string;
    totalValue: number;
    lowStockCount: number;
    turnoverRate: number;
  }>;
  topMovingItems: Array<{
    id: number;
    name: string;
    category: string;
    currentStock: number;
    minStock: number;
    unit: string;
    turnoverRate: number;
  }>;
  reorderRecommendations: Array<{
    id: number;
    name: string;
    category: string;
    currentStock: number;
    suggestedOrder: number;
    estimatedCost: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface MetricsFilter {
  category?: string;
  range: '7d' | '30d' | '90d';
}

@Injectable()
export class InventoryMetricsService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * 获取库存监控指标
   */
  async getMetrics(filter: MetricsFilter): Promise<InventoryMetrics> {
    const inventoryItems = await this.inventoryRepository.find({
      where: { isActive: true },
      relations: ['operationLogs'],
    });

    // 计算基本指标
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((sum, item) => 
      sum + (Number(item.currentStock) * Number(item.costPrice)), 0
    );

    const lowStockItems = inventoryItems.filter(item => 
      Number(item.currentStock) < Number(item.minStock)
    ).length;

    const overStockItems = inventoryItems.filter(item => 
      Number(item.currentStock) > Number(item.maxStock)
    ).length;

    // 按类别分布
    const categoryDistribution = this.calculateCategoryDistribution(inventoryItems);

    // 库存趋势
    const stockTrends = await this.getStockTrends(filter.range);

    // 高周转率商品
    const topMovingItems = await this.getTopMovingItems(inventoryItems);

    // 补货建议
    const reorderRecommendations = await this.getReorderRecommendations(inventoryItems);

    // 平均周转率（简化计算）
    const averageTurnover = this.calculateAverageTurnover(inventoryItems);

    return {
      totalItems,
      totalValue,
      lowStockItems,
      overStockItems,
      averageTurnover,
      categoryDistribution,
      stockTrends,
      topMovingItems,
      reorderRecommendations,
    };
  }

  /**
   * 计算类别分布
   */
  private calculateCategoryDistribution(items: InventoryItem[]) {
    const categoryMap = new Map<string, { count: number; value: number }>();

    items.forEach(item => {
      const category = item.category;
      const existing = categoryMap.get(category) || { count: 0, value: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        value: existing.value + (Number(item.currentStock) * Number(item.costPrice)),
      });
    });

    const totalValue = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.value, 0);

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category: this.getCategoryLabel(category),
      count: data.count,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }

  /**
   * 获取库存趋势数据
   */
  private async getStockTrends(range: '7d' | '30d' | '90d') {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // 获取当天的订单数据来计算库存消耗
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const orders = await this.orderRepository.find({
        where: {
          createdAt: { $gte: date, $lt: nextDate } as any,
          status: OrderStatus.COMPLETED,
        },
        relations: ['orderItems', 'orderItems.product', 'orderItems.product.recipes'],
      });

      // 计算库存价值和趋势
      const inventoryItems = await this.inventoryRepository.find({
        where: { isActive: true },
      });

      const totalValue = inventoryItems.reduce((sum, item) => 
        sum + (Number(item.currentStock) * Number(item.costPrice)), 0
      );

      const lowStockCount = inventoryItems.filter(item => 
        Number(item.currentStock) < Number(item.minStock)
      ).length;

      const turnoverRate = this.calculateTurnoverForDate(orders, inventoryItems);

      trends.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        totalValue,
        lowStockCount,
        turnoverRate,
      });
    }

    return trends;
  }

  /**
   * 获取高周转率商品
   */
  private async getTopMovingItems(items: InventoryItem[]) {
    // 简化的周转率计算，基于操作日志
    const itemsWithTurnover = items.map(item => {
      const consumptionLogs = item.operationLogs?.filter(log =>
        log.operation === OperationType.INVENTORY_UPDATE && Number(log.metadata?.quantityChange || 0) < 0
      ) || [];

      const totalConsumed = consumptionLogs.reduce((sum, log) =>
        sum + Math.abs(Number(log.metadata?.quantityChange || 0)), 0
      );

      const turnoverRate = Number(item.minStock) > 0 ? 
        Math.min(1, totalConsumed / Number(item.minStock)) : 0;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: Number(item.currentStock),
        minStock: Number(item.minStock),
        unit: item.unit,
        turnoverRate,
      };
    });

    return itemsWithTurnover
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 10);
  }

  /**
   * 获取补货建议
   */
  private async getReorderRecommendations(items: InventoryItem[]) {
    const recommendations = [];

    for (const item of items) {
      const currentStock = Number(item.currentStock);
      const minStock = Number(item.minStock);
      const maxStock = Number(item.maxStock);
      const costPrice = Number(item.costPrice);

      // 需要补货的条件
      if (currentStock < minStock) {
        // 计算建议订购量（补足到最大库存）
        const suggestedOrder = Math.max(minStock * 2 - currentStock, minStock);
        const estimatedCost = suggestedOrder * costPrice;

        // 确定优先级
        let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (currentStock < minStock * 0.5) {
          priority = 'HIGH';
        } else if (currentStock < minStock * 0.8) {
          priority = 'MEDIUM';
        }

        recommendations.push({
          id: item.id,
          name: item.name,
          category: item.category,
          currentStock,
          suggestedOrder,
          estimatedCost,
          priority,
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 计算平均周转率
   */
  private calculateAverageTurnover(items: InventoryItem[]) {
    if (items.length === 0) return 0;

    const totalTurnover = items.reduce((sum, item) => {
      const consumptionLogs = item.operationLogs?.filter(log =>
        log.operation === OperationType.INVENTORY_UPDATE && Number(log.metadata?.quantityChange || 0) < 0
      ) || [];

      const totalConsumed = consumptionLogs.reduce((acc, log) =>
        acc + Math.abs(Number(log.metadata?.quantityChange || 0)), 0
      );

      const turnover = Number(item.minStock) > 0 ? 
        Math.min(1, totalConsumed / Number(item.minStock)) : 0;

      return sum + turnover;
    }, 0);

    return totalTurnover / items.length;
  }

  /**
   * 计算特定日期的周转率
   */
  private calculateTurnoverForDate(orders: Order[], inventoryItems: InventoryItem[]) {
    // 简化的周转率计算
    const totalOrderValue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
    const totalInventoryValue = inventoryItems.reduce((sum, item) => 
      sum + (Number(item.currentStock) * Number(item.costPrice)), 0
    );

    return totalInventoryValue > 0 ? Math.min(1, totalOrderValue / totalInventoryValue) : 0;
  }

  /**
   * 获取类别标签
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      TEA: '茶叶',
      MILK: '牛奶',
      TOPPING: '配料',
      SYRUP: '糖浆',
      FRUIT: '水果',
      SPICE: '香料',
      PACKAGING: '包装',
      CLEANING: '清洁用品',
      OTHER: '其他',
    };

    return labels[category] || category;
  }

  /**
   * 导出库存数据
   */
  async exportData(filter: MetricsFilter) {
    const metrics = await this.getMetrics(filter);
    
    // 生成CSV格式数据
    const csvData = [
      ['类别', '商品名称', '当前库存', '最小库存', '最大库存', '单位', '成本价', '库存价值'],
      ...metrics.categoryDistribution.map(category => [
        category.category,
        '合计',
        category.count.toString(),
        '',
        '',
        '',
        '',
        category.value.toFixed(2),
      ])
    ];

    return csvData;
  }
}