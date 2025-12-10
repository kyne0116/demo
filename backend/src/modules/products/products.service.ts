import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRecipeService } from './product-recipe.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderItem } from '../orders/entities/order-item.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private productRecipeService: ProductRecipeService,
    private inventoryService: InventoryService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // 验证分类是否存在
    if (createProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoryId, isActive: true }
      });
      if (!category) {
        throw new NotFoundException('分类不存在');
      }
    }

    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { categoryId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });
    
    if (!product) {
      throw new NotFoundException('产品不存在');
    }
    
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    
    // 如果更新分类，验证分类是否存在
    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId, isActive: true }
      });
      if (!category) {
        throw new NotFoundException('分类不存在');
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepository.save(product);
  }

  /**
   * 获取所有产品（带库存状态）
   */
  async findAllWithInventoryStatus(): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: ['recipes', 'recipes.inventoryItem'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    // 为每个产品添加库存状态
    return products.map(product => {
      // 确保返回的仍然是Product实例
      const productWithStatus = Object.assign(product, {
        inStock: product.isInStock(),
        canBeMade: product.canBeMade(),
      });
      return productWithStatus;
    });
  }

  /**
   * 检查产品是否可以制作
   */
  async checkProductAvailability(productId: string): Promise<any> {
    const product = await this.findOne(productId);

    if (!product.isActive || !product.isAvailable) {
      return {
        available: false,
        reason: '产品已停用或不可售',
        product,
      };
    }

    // 检查库存
    const inventoryCheck = await this.productRecipeService.checkIngredientAvailability(
      parseInt(productId),
      1,
    );

    if (inventoryCheck !== true) {
      return {
        available: false,
        reason: '原料不足',
        unavailableIngredients: inventoryCheck.unavailableIngredients,
        product,
      };
    }

    return {
      available: true,
      reason: '可以制作',
      product,
    };
  }

  /**
   * 更新产品可售状态
   */
  async updateAvailability(id: string, isAvailable: boolean): Promise<Product> {
    const product = await this.findOne(id);

    // 如果要设为可售，检查库存
    if (isAvailable) {
      const inventoryCheck = await this.productRecipeService.checkIngredientAvailability(
        parseInt(id),
        1,
      );

      if (inventoryCheck !== true) {
        throw new BadRequestException('产品库存不足，无法设为可售');
      }
    }

    product.isAvailable = isAvailable;
    return await this.productRepository.save(product);
  }

  /**
   * 获取产品分类列表
   */
  async getCategories(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * 获取产品统计信息
   */
  async getProductStatistics(): Promise<any> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: ['recipes', 'recipes.inventoryItem'],
    });

    const totalProducts = products.length;
    const availableProducts = products.filter(p => p.isAvailable).length;
    const inStockProducts = products.filter(p => p.isInStock()).length;
    const canBeMadeProducts = products.filter(p => p.canBeMade()).length;

    // 按类别统计
    const categoryStats = {};
    for (const product of products) {
      const categoryName = product.category?.name || '未分类';
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          total: 0,
          available: 0,
          inStock: 0,
          canBeMade: 0,
        };
      }
      categoryStats[categoryName].total++;
      if (product.isAvailable) categoryStats[categoryName].available++;
      if (product.isInStock()) categoryStats[categoryName].inStock++;
      if (product.canBeMade()) categoryStats[categoryName].canBeMade++;
    }

    // 计算平均价格和成本
    const productsWithPrice = products.filter(p => p.price > 0);
    const averagePrice = productsWithPrice.reduce((sum, p) => sum + p.price, 0) / productsWithPrice.length;

    const productsWithCost = products.filter(p => p.costPrice && p.costPrice > 0);
    const averageCost = productsWithCost.reduce((sum, p) => sum + p.costPrice, 0) / productsWithCost.length;

    return {
      totalProducts,
      availableProducts,
      inStockProducts,
      canBeMadeProducts,
      unavailableProducts: totalProducts - availableProducts,
      outOfStockProducts: totalProducts - inStockProducts,
      averagePrice,
      averageCost,
      categoryStats,
      lastUpdated: new Date(),
    };
  }

  /**
   * 搜索产品
   */
  async searchProducts(query: string, categoryId?: string): Promise<Product[]> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.recipes', 'recipes')
      .leftJoinAndSelect('recipes.inventoryItem', 'inventoryItem')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.name LIKE :query OR product.description LIKE :query', {
        query: `%${query}%`,
      });

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    return await queryBuilder
      .orderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .getMany();
  }

  /**
   * 为订单自动扣除库存
   */
  async deductInventoryForOrder(orderItems: OrderItem[]): Promise<void> {
    await this.inventoryService.deductStockForOrder(orderItems);
  }

  /**
   * 为取消的订单恢复库存
   */
  async restoreInventoryForOrder(orderItems: OrderItem[]): Promise<void> {
    await this.inventoryService.restoreStockForOrder(orderItems);
  }

  /**
   * 获取产品配方成本
   */
  async getProductRecipeCost(productId: string): Promise<number> {
    return await this.productRecipeService.getRecipeCost(parseInt(productId));
  }

  /**
   * 获取产品盈利能力分析
   */
  async getProductProfitability(productId: string): Promise<any> {
    return await this.productRecipeService.getProductProfitability(parseInt(productId));
  }
}