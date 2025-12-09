import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * 获取所有库存项
   */
  async findAll(
    page: number = 0,
    limit: number = 20,
    search?: string,
    category?: string,
    stockStatus?: string,
  ): Promise<{ data: InventoryItem[]; total: number }> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.operationLogs', 'logs')
      .where('inventory.isActive = :isActive', { isActive: true });

    // 搜索过滤
    if (search) {
      queryBuilder.andWhere(
        '(inventory.name LIKE :search OR inventory.supplier LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 类别过滤
    if (category) {
      queryBuilder.andWhere('inventory.category = :category', { category });
    }

    // 库存状态过滤
    if (stockStatus) {
      switch (stockStatus) {
        case 'LOW':
          queryBuilder.andWhere('inventory.currentStock <= inventory.minStock');
          break;
        case 'OVERSTOCK':
          queryBuilder.andWhere('inventory.currentStock > inventory.maxStock');
          break;
        case 'NORMAL':
          queryBuilder.andWhere(
            'inventory.currentStock > inventory.minStock AND inventory.currentStock <= inventory.maxStock',
          );
          break;
      }
    }

    const [data, total] = await queryBuilder
      .skip(page * limit)
      .take(limit)
      .orderBy('inventory.name', 'ASC')
      .getManyAndCount();

    return { data, total };
  }

  /**
   * 获取单个库存项
   */
  async findOne(id: number): Promise<InventoryItem> {
    const inventoryItem = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['operationLogs'],
    });

    if (!inventoryItem) {
      throw new NotFoundException(`库存项 ID ${id} 不存在`);
    }

    return inventoryItem;
  }

  /**
   * 创建库存项
   */
  async create(createDto: CreateInventoryItemDto): Promise<InventoryItem> {
    // 验证库存范围
    if (createDto.currentStock < 0) {
      throw new BadRequestException('当前库存不能为负数');
    }

    if (createDto.currentStock > createDto.maxStock) {
      throw new BadRequestException('当前库存不能超过最大库存');
    }

    if (createDto.minStock < 0) {
      throw new BadRequestException('最小库存不能为负数');
    }

    if (createDto.minStock > createDto.maxStock) {
      throw new BadRequestException('最小库存不能超过最大库存');
    }

    const inventoryItem = this.inventoryRepository.create(createDto);
    return await this.inventoryRepository.save(inventoryItem);
  }

  /**
   * 更新库存项
   */
  async update(id: number, updateDto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const inventoryItem = await this.findOne(id);

    // 验证库存范围
    if (updateDto.currentStock !== undefined) {
      if (updateDto.currentStock < 0) {
        throw new BadRequestException('当前库存不能为负数');
      }
      if (updateDto.currentStock > (updateDto.maxStock || inventoryItem.maxStock)) {
        throw new BadRequestException('当前库存不能超过最大库存');
      }
    }

    if (updateDto.minStock !== undefined && updateDto.maxStock !== undefined) {
      if (updateDto.minStock > updateDto.maxStock) {
        throw new BadRequestException('最小库存不能超过最大库存');
      }
    }

    Object.assign(inventoryItem, updateDto);
    return await this.inventoryRepository.save(inventoryItem);
  }

  /**
   * 软删除库存项
   */
  async remove(id: number): Promise<void> {
    const inventoryItem = await this.findOne(id);
    inventoryItem.isActive = false;
    await this.inventoryRepository.save(inventoryItem);
  }

  /**
   * 调整库存
   */
  async adjustStock(
    id: number,
    adjustment: number,
    reason: string,
    adjustedBy: number,
  ): Promise<InventoryItem> {
    const inventoryItem = await this.findOne(id);

    const validation = inventoryItem.validateAdjustment(adjustment);
    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    const oldStock = inventoryItem.currentStock;
    inventoryItem.currentStock = Number(inventoryItem.currentStock) + adjustment;

    const savedItem = await this.inventoryRepository.save(inventoryItem);

    // 记录操作日志
    await this.recordOperationLog(
      savedItem,
      adjustment > 0 ? 'RESTORE' : 'DEDUCT',
      `库存调整: ${oldStock} -> ${savedItem.currentStock}, 调整量: ${adjustment}, 原因: ${reason}`,
      adjustedBy,
    );

    return savedItem;
  }

  /**
   * 为订单扣除库存
   */
  async deductStockForOrder(orderItems: any[]): Promise<void> {
    const deductions = new Map<number, number>(); // inventoryItemId -> totalDeduction

    // 收集所有需要扣除的库存
    for (const orderItem of orderItems) {
      const product = orderItem.product;
      if (!product.recipes) continue;

      for (const recipe of product.recipes) {
        const requiredQuantity = Number(recipe.getAdjustedQuantity()) * orderItem.quantity;
        const currentDeduction = deductions.get(recipe.inventoryItemId) || 0;
        deductions.set(recipe.inventoryItemId, currentDeduction + requiredQuantity);
      }
    }

    // 执行库存扣除
    for (const [inventoryItemId, deduction] of deductions.entries()) {
      const inventoryItem = await this.inventoryRepository.findOne({
        where: { id: inventoryItemId },
      });

      if (!inventoryItem) {
        throw new NotFoundException(`库存项 ID ${inventoryItemId} 不存在`);
      }

      if (inventoryItem.currentStock < deduction) {
        throw new BadRequestException(
          `库存不足: ${inventoryItem.name} 当前库存 ${inventoryItem.currentStock}${inventoryItem.unit}, 需要 ${deduction}${inventoryItem.unit}`,
        );
      }

      inventoryItem.currentStock = Number(inventoryItem.currentStock) - deduction;
      await this.inventoryRepository.save(inventoryItem);
    }
  }

  /**
   * 为取消的订单恢复库存
   */
  async restoreStockForOrder(orderItems: any[]): Promise<void> {
    const restorations = new Map<number, number>(); // inventoryItemId -> totalRestoration

    // 收集所有需要恢复的库存
    for (const orderItem of orderItems) {
      const product = orderItem.product;
      if (!product.recipes) continue;

      for (const recipe of product.recipes) {
        const restoreQuantity = Number(recipe.getAdjustedQuantity()) * orderItem.quantity;
        const currentRestoration = restorations.get(recipe.inventoryItemId) || 0;
        restorations.set(recipe.inventoryItemId, currentRestoration + restoreQuantity);
      }
    }

    // 执行库存恢复
    for (const [inventoryItemId, restoration] of restorations.entries()) {
      const inventoryItem = await this.inventoryRepository.findOne({
        where: { id: inventoryItemId },
      });

      if (!inventoryItem) continue;

      const newStock = Number(inventoryItem.currentStock) + restoration;
      
      // 不超过最大库存的150%
      if (newStock > inventoryItem.maxStock * 1.5) {
        continue; // 跳过超过限制的恢复
      }

      inventoryItem.currentStock = newStock;
      await this.inventoryRepository.save(inventoryItem);
    }
  }

  /**
   * 获取低库存警告
   */
  async getLowStockAlerts(): Promise<any[]> {
    const lowStockItems = await this.inventoryRepository.find({
      where: { isActive: true },
    });

    return lowStockItems
      .filter(item => item.currentStock <= item.minStock)
      .map(item => ({
        itemId: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        minStock: item.minStock,
        maxStock: item.maxStock,
        unit: item.unit,
        supplier: item.supplier,
        daysUntilReorder: this.calculateDaysUntilReorder(item),
        priority: this.getAlertPriority(item),
      }));
  }

  /**
   * 获取超库存警告
   */
  async getOverStockAlerts(): Promise<any[]> {
    const overStockItems = await this.inventoryRepository.find({
      where: { isActive: true },
    });

    return overStockItems
      .filter(item => item.currentStock > item.maxStock)
      .map(item => ({
        itemId: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        maxStock: item.maxStock,
        unit: item.unit,
        excessAmount: item.currentStock - item.maxStock,
        priority: 'MEDIUM',
      }));
  }

  /**
   * 获取即将过期的库存
   */
  async getExpiringItems(days: number = 7): Promise<any[]> {
    const today = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + days);

    const expiringItems = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.expirationDate IS NOT NULL')
      .andWhere('inventory.expirationDate <= :expiryThreshold', { expiryThreshold })
      .andWhere('inventory.expirationDate >= :today', { today })
      .andWhere('inventory.isActive = :isActive', { isActive: true })
      .getMany();

    return expiringItems.map(item => {
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expirationDate).getTime() - today.getTime()) / (1000 * 3600 * 24),
      );
      
      return {
        itemId: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        expirationDate: item.expirationDate,
        daysUntilExpiry,
        priority: daysUntilExpiry <= 1 ? 'HIGH' : 'MEDIUM',
        wasteRisk: this.calculateWasteRisk(item, daysUntilExpiry),
      };
    });
  }

  /**
   * 获取库存统计信息
   */
  async getInventoryStatistics(): Promise<any> {
    const allItems = await this.inventoryRepository.find({
      where: { isActive: true },
    });

    const totalItems = allItems.length;
    const lowStockItems = allItems.filter(item => item.currentStock <= item.minStock).length;
    const overStockItems = allItems.filter(item => item.currentStock > item.maxStock).length;
    const expiringItems = allItems.filter(item => item.isExpiringSoon()).length;

    const totalValue = allItems.reduce(
      (sum, item) => sum + Number(item.currentStock) * Number(item.costPrice),
      0,
    );

    // 按类别统计
    const categoryStats = allItems.reduce((stats, item) => {
      const category = item.category;
      if (!stats[category]) {
        stats[category] = { count: 0, totalValue: 0, lowStockCount: 0 };
      }
      stats[category].count++;
      stats[category].totalValue += Number(item.currentStock) * Number(item.costPrice);
      if (item.currentStock <= item.minStock) {
        stats[category].lowStockCount++;
      }
      return stats;
    }, {});

    return {
      totalItems,
      lowStockItems,
      overStockItems,
      expiringItems,
      totalValue,
      averageTurnover: this.calculateAverageTurnover(allItems),
      categories: categoryStats,
      lastUpdated: new Date(),
    };
  }

  /**
   * 批量更新库存
   */
  async batchUpdateStock(updates: { id: number; currentStock: number; reason: string; updatedBy: number }[]): Promise<InventoryItem[]> {
    const results: InventoryItem[] = [];

    for (const update of updates) {
      const inventoryItem = await this.findOne(update.id);
      const oldStock = inventoryItem.currentStock;
      
      if (update.currentStock < 0) {
        throw new BadRequestException(`库存项 ${inventoryItem.name} 的库存不能为负数`);
      }

      inventoryItem.currentStock = update.currentStock;
      const savedItem = await this.inventoryRepository.save(inventoryItem);
      results.push(savedItem);

      // 记录操作日志
      await this.recordOperationLog(
        savedItem,
        'UPDATE',
        `批量更新: ${oldStock} -> ${savedItem.currentStock}, 原因: ${update.reason}`,
        update.updatedBy,
      );
    }

    return results;
  }

  /**
   * 计算到需要补货的天数
   */
  private calculateDaysUntilReorder(item: InventoryItem): number {
    // 简化计算，假设每天消耗量为最小库存的10%
    const dailyConsumption = Number(item.minStock) * 0.1;
    if (dailyConsumption <= 0) return Infinity;
    
    const remainingStock = Number(item.currentStock) - Number(item.minStock);
    return Math.max(0, Math.ceil(remainingStock / dailyConsumption));
  }

  /**
   * 获取警告优先级
   */
  private getAlertPriority(item: InventoryItem): 'HIGH' | 'MEDIUM' | 'LOW' {
    const stockRatio = Number(item.currentStock) / Number(item.minStock);
    
    if (stockRatio <= 0.2) return 'HIGH';
    if (stockRatio <= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 计算浪费风险
   */
  private calculateWasteRisk(item: InventoryItem, daysUntilExpiry: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (daysUntilExpiry <= 1) return 'HIGH';
    if (daysUntilExpiry <= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 计算平均周转率
   */
  private calculateAverageTurnover(items: InventoryItem[]): number {
    const turnovers = items
      .filter(item => item.minStock > 0)
      .map(item => item.getTurnoverRate(Number(item.minStock) * 0.1));
    
    if (turnovers.length === 0) return 0;
    
    return turnovers.reduce((sum, turnover) => sum + turnover, 0) / turnovers.length;
  }

  /**
   * 记录操作日志
   */
  private async recordOperationLog(
    inventoryItem: InventoryItem,
    operationType: string,
    description: string,
    performedBy: number,
  ): Promise<void> {
    // 这里应该调用OperationLogService来记录日志
    // 为了简化，我们暂时跳过具体的日志记录实现
    console.log(`库存操作记录: ${operationType} - ${description} - 操作人: ${performedBy}`);
  }
}