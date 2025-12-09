import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { InventoryMetricsService } from './inventory-metrics.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('inventory/metrics')
@UseGuards(RolesGuard)
export class InventoryMetricsController {
  constructor(private readonly metricsService: InventoryMetricsService) {}

  /**
   * 获取库存监控指标
   */
  @Get()
  @Permissions('inventory:read')
  async getMetrics(
    @Query('category') category?: string,
    @Query('range') range: '7d' | '30d' | '90d' = '30d',
  ) {
    const filter = {
      category: category === 'all' ? undefined : category,
      range,
    };

    return this.metricsService.getMetrics(filter);
  }

  /**
   * 导出库存数据
   */
  @Post('export')
  @Permissions('inventory:read')
  async exportData(
    @Body() body: {
      category?: string;
      range: '7d' | '30d' | '90d';
      format: 'csv' | 'json';
    }
  ) {
    const filter = {
      category: body.category === 'all' ? undefined : body.category,
      range: body.range,
    };

    if (body.format === 'csv') {
      const csvData = await this.metricsService.exportData(filter);
      
      // 生成CSV字符串
      const csvString = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      return {
        filename: `inventory-metrics-${new Date().toISOString().split('T')[0]}.csv`,
        content: csvString,
        mimeType: 'text/csv',
      };
    } else {
      const data = await this.metricsService.getMetrics(filter);
      return {
        filename: `inventory-metrics-${new Date().toISOString().split('T')[0]}.json`,
        content: JSON.stringify(data, null, 2),
        mimeType: 'application/json',
      };
    }
  }
}