import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.guard';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '创建产品' })
  @ApiResponse({ status: 201, description: '产品创建成功' })
  @ApiResponse({ status: 400, description: '输入数据无效' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF')
  @ApiOperation({ summary: '获取产品列表' })
  @ApiQuery({ name: 'categoryId', required: false, description: '分类ID' })
  @ApiQuery({ name: 'withInventory', required: false, description: '是否包含库存状态', type: Boolean })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('withInventory', ParseBoolPipe) withInventory?: boolean,
    @Query('search') search?: string,
  ) {
    if (search) {
      return this.productsService.searchProducts(search, categoryId);
    }

    if (withInventory) {
      return this.productsService.findAllWithInventoryStatus();
    }

    if (categoryId) {
      return this.productsService.findByCategory(categoryId);
    }

    return this.productsService.findAll();
  }

  @Get('categories')
  @Roles('ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF')
  @ApiOperation({ summary: '获取产品分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('statistics')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '获取产品统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getStatistics() {
    return this.productsService.getProductStatistics();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF')
  @ApiOperation({ summary: '获取产品详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/availability')
  @Roles('ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN_STAFF')
  @ApiOperation({ summary: '检查产品是否可制作' })
  @ApiResponse({ status: 200, description: '检查成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  checkAvailability(@Param('id') id: string) {
    return this.productsService.checkProductAvailability(id);
  }

  @Get(':id/recipe-cost')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '获取产品配方成本' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getRecipeCost(@Param('id') id: string) {
    return this.productsService.getProductRecipeCost(id);
  }

  @Get(':id/profitability')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '获取产品盈利能力分析' })
  @ApiResponse({ status: 200, description: '分析成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getProfitability(@Param('id') id: string) {
    return this.productsService.getProductProfitability(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '更新产品信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 400, description: '输入数据无效' })
  @ApiResponse({ status: 403, description: '权限不足' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/availability')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: '更新产品可售状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 400, description: '库存不足，无法设为可售' })
  @ApiResponse({ status: 403, description: '权限不足' })
  updateAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.productsService.updateAvailability(id, isAvailable);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '删除产品（软删除）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}