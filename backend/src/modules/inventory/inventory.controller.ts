import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '创建库存项' })
  @ApiResponse({ status: 201, description: '库存项创建成功' })
  @ApiResponse({ status: 400, description: '输入数据无效' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body(ValidationPipe) createDto: CreateInventoryItemDto) {
    return this.inventoryService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: '获取库存列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'stockStatus', required: false, type: String })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll(
    @Query('page', ParseIntPipe) page: number = 0,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('stockStatus') stockStatus?: string,
  ) {
    return this.inventoryService.findAll(page, limit, search, category, stockStatus);
  }

  @Get('alerts')
  @Roles('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: '获取低库存警告' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  @Get('overstock')
  @Roles('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: '获取超库存警告' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getOverStockAlerts() {
    return this.inventoryService.getOverStockAlerts();
  }

  @Get('expiring')
  @Roles('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: '获取即将过期的库存' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getExpiringItems(@Query('days', ParseIntPipe) days: number = 7) {
    return this.inventoryService.getExpiringItems(days);
  }

  @Get('statistics')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '获取库存统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getStatistics() {
    return this.inventoryService.getInventoryStatistics();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: '获取单个库存项详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '库存项不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '更新库存项' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '库存项不存在' })
  @ApiResponse({ status: 400, description: '输入数据无效' })
  @ApiResponse({ status: 403, description: '权限不足' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, updateDto);
  }

  @Patch(':id/adjust')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '调整库存' })
  @ApiResponse({ status: 200, description: '调整成功' })
  @ApiResponse({ status: 404, description: '库存项不存在' })
  @ApiResponse({ status: 400, description: '调整失败' })
  @ApiResponse({ status: 403, description: '权限不足' })
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) adjustDto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(
      id,
      adjustDto.adjustment,
      adjustDto.reason,
      adjustDto.adjustedBy,
    );
  }

  @Patch('batch-update')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '批量更新库存' })
  @ApiResponse({ status: 200, description: '批量更新成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  batchUpdateStock(
    @Body() updates: { id: number; currentStock: number; reason: string; updatedBy: number }[],
  ) {
    return this.inventoryService.batchUpdateStock(updates);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '删除库存项（软删除）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '库存项不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.remove(id);
  }
}