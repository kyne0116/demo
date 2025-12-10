import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryAlertService, InventoryAlert, AlertStatistics } from './inventory-alert.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/guards/roles.guard';

@Controller('inventory/alerts')
@UseGuards(RolesGuard)
export class InventoryAlertController {
  constructor(private readonly inventoryAlertService: InventoryAlertService) {}

  /**
   * 获取所有库存预警
   */
  @Get()
  @Permissions('inventory:read')
  async getAllAlerts(): Promise<InventoryAlert[]> {
    return this.inventoryAlertService.getAllAlerts();
  }

  /**
   * 获取库存预警统计
   */
  @Get('statistics')
  @Permissions('inventory:read')
  async getAlertStatistics(): Promise<AlertStatistics> {
    return this.inventoryAlertService.getAlertStatistics();
  }

  /**
   * 获取库存预警摘要
   */
  @Get('summary')
  @Permissions('inventory:read')
  async getAlertSummary() {
    return this.inventoryAlertService.getAlertSummary();
  }

  /**
   * 标记预警为已读
   */
  @Post(':alertId/acknowledge')
  @Permissions('inventory:write')
  async acknowledgeAlert(@Param('alertId') alertId: string): Promise<{ message: string }> {
    await this.inventoryAlertService.acknowledgeAlert(parseInt(alertId));
    return { message: '预警已标记为已读' };
  }

  /**
   * 批量标记预警为已读
   */
  @Post('acknowledge-batch')
  @Permissions('inventory:write')
  async acknowledgeAlerts(@Body() body: { alertIds: number[] }): Promise<{ message: string }> {
    await this.inventoryAlertService.acknowledgeAlerts(body.alertIds);
    return { message: `${body.alertIds.length} 个预警已标记为已读` };
  }

  /**
   * 获取需要自动预警的库存项
   */
  @Get('urgent')
  @Permissions('inventory:read')
  async getUrgentAlerts() {
    const items = await this.inventoryAlertService.getItemsNeedingAlerts();
    return {
      count: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        minStock: item.minStock,
        unit: item.unit,
        supplier: item.supplier,
      })),
    };
  }

  /**
   * 手动触发库存预警检查
   */
  @Post('check')
  @Permissions('inventory:read')
  async checkInventoryAlerts(): Promise<{ message: string; checked: boolean }> {
    await this.inventoryAlertService.checkInventoryAlerts();
    return { message: '库存预警检查完成', checked: true };
  }
}