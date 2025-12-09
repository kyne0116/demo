import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Patch 
} from '@nestjs/common';
import { 
  ProductionService, 
  ProductionProgress, 
  OrderQueue 
} from './production.service';
import { OrderStatus, ProductionStage, OrderPriority } from './entities/order.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('orders/production')
@UseGuards(RolesGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  /**
   * 获取订单制作进度
   */
  @Get(':orderId/progress')
  @Permissions('orders:read')
  async getProductionProgress(@Param('orderId') orderId: string): Promise<ProductionProgress> {
    return this.productionService.getProductionProgress(orderId);
  }

  /**
   * 开始订单制作
   */
  @Post(':orderId/start')
  @Permissions('orders:write')
  async startProduction(
    @Param('orderId') orderId: string,
    @Body() body: { staffId: string }
  ) {
    return this.productionService.startProduction(orderId, body.staffId);
  }

  /**
   * 更新制作阶段
   */
  @Put(':orderId/stage')
  @Permissions('orders:write')
  async updateProductionStage(
    @Param('orderId') orderId: string,
    @Body() body: { 
      stage: ProductionStage;
      notes?: string;
    }
  ) {
    return this.productionService.updateProductionStage(orderId, body.stage, body.notes);
  }

  /**
   * 完成订单
   */
  @Post(':orderId/complete')
  @Permissions('orders:write')
  async completeOrder(
    @Param('orderId') orderId: string,
    @Body() body: { 
      qualityNotes?: string;
      rating?: number;
    }
  ) {
    return this.productionService.completeOrder(orderId, body.qualityNotes, body.rating);
  }

  /**
   * 分配订单
   */
  @Post(':orderId/assign')
  @Permissions('orders:write')
  async assignOrder(
    @Param('orderId') orderId: string,
    @Body() body: { staffId: string }
  ) {
    return this.productionService.assignOrder(orderId, body.staffId);
  }

  /**
   * 获取订单队列
   */
  @Get('queue')
  @Permissions('orders:read')
  async getOrderQueue(): Promise<OrderQueue> {
    return this.productionService.getOrderQueue();
  }

  /**
   * 获取制作人员队列
   */
  @Get('staff/:staffId/queue')
  @Permissions('orders:read')
  async getStaffQueue(@Param('staffId') staffId: string) {
    return this.productionService.getStaffQueue(staffId);
  }

  /**
   * 设置订单优先级
   */
  @Patch(':orderId/priority')
  @Permissions('orders:write')
  async setOrderPriority(
    @Param('orderId') orderId: string,
    @Body() body: { priority: OrderPriority }
  ) {
    return this.productionService.setOrderPriority(orderId, body.priority);
  }

  /**
   * 批量开始制作
   */
  @Post('batch/start')
  @Permissions('orders:write')
  async startBatchProduction(
    @Body() body: { 
      orderIds: string[];
      staffId: string;
    }
  ) {
    return this.productionService.startBatchProduction(body.orderIds, body.staffId);
  }

  /**
   * 估算制作时间
   */
  @Post('estimate-time')
  @Permissions('orders:read')
  async estimateProductionTime(
    @Body() body: { 
      items: Array<{ productId: string; quantity: number }>;
    }
  ) {
    const estimatedTime = await this.productionService.estimateProductionTime(body.items);
    return { estimatedTime };
  }

  /**
   * 获取制作统计
   */
  @Get('stats')
  @Permissions('orders:read')
  async getProductionStats(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.productionService.getProductionStats(daysNum);
  }

  /**
   * 获取制作阶段列表
   */
  @Get('stages')
  @Permissions('orders:read')
  async getProductionStages() {
    return [
      { stage: ProductionStage.NOT_STARTED, name: '未开始', order: 0 },
      { stage: ProductionStage.PREPARING, name: '准备中', order: 1 },
      { stage: ProductionStage.MIXING, name: '调制中', order: 2 },
      { stage: ProductionStage.FINISHING, name: '完成制作', order: 3 },
      { stage: ProductionStage.QUALITY_CHECK, name: '质检中', order: 4 },
      { stage: ProductionStage.READY_FOR_PICKUP, name: '待取餐', order: 5 },
    ];
  }

  /**
   * 获取优先级列表
   */
  @Get('priorities')
  @Permissions('orders:read')
  async getOrderPriorities() {
    return [
      { priority: OrderPriority.NORMAL, name: '普通', color: '#6b7280' },
      { priority: OrderPriority.URGENT, name: '紧急', color: '#f59e0b' },
      { priority: OrderPriority.RUSH, name: '加急', color: '#ef4444' },
    ];
  }

  /**
   * 导出制作统计数据
   */
  @Post('export')
  @Permissions('orders:read')
  async exportProductionData(
    @Body() body: {
      range: '7d' | '30d' | '90d';
      format: 'csv' | 'json';
    }
  ) {
    const stats = await this.productionService.getProductionStats(
      body.range === '7d' ? 7 : body.range === '30d' ? 30 : 90
    );

    if (body.format === 'csv') {
      const csvData = [
        ['指标', '数值'],
        ['总订单数', stats.totalOrders.toString()],
        ['完成订单数', stats.completedOrders.toString()],
        ['取消订单数', stats.cancelledOrders.toString()],
        ['平均等待时间', `${stats.averageWaitTime}分钟`],
        ['超时率', `${stats.overdueRate}%`],
        ['完成率', `${stats.completionRate}%`],
      ];

      const csvString = csvData.map(row =>
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      return {
        filename: `production-stats-${new Date().toISOString().split('T')[0]}.csv`,
        content: csvString,
        mimeType: 'text/csv',
      };
    } else {
      return {
        filename: `production-stats-${new Date().toISOString().split('T')[0]}.json`,
        content: JSON.stringify(stats, null, 2),
        mimeType: 'application/json',
      };
    }
  }
}