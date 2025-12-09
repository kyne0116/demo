import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRecipe } from './entities/product-recipe.entity';
import { Product } from './entities/product.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateProductRecipeDto } from './dto/create-product-recipe.dto';
import { UpdateProductRecipeDto } from './dto/update-product-recipe.dto';

@Injectable()
export class ProductRecipeService {
  constructor(
    @InjectRepository(ProductRecipe)
    private recipeRepository: Repository<ProductRecipe>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
  ) {}

  /**
   * 创建产品配方
   */
  async createRecipe(createDto: CreateProductRecipeDto): Promise<ProductRecipe> {
    // 验证产品是否存在
    const product = await this.productRepository.findOne({
      where: { id: createDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`产品 ID ${createDto.productId} 不存在`);
    }

    const ingredients = [];

    // 验证并创建配方原料
    for (const ingredientDto of createDto.ingredients) {
      // 验证原料是否存在
      const inventoryItem = await this.inventoryRepository.findOne({
        where: { id: ingredientDto.inventoryItemId },
      });

      if (!inventoryItem) {
        throw new NotFoundException(`原料 ID ${ingredientDto.inventoryItemId} 不存在`);
      }

      if (ingredientDto.quantity <= 0) {
        throw new BadRequestException('原料数量必须大于0');
      }

      // 检查是否已存在该原料的配方
      const existingRecipe = await this.recipeRepository.findOne({
        where: {
          product: { id: createDto.productId },
          inventoryItem: { id: ingredientDto.inventoryItemId },
        },
      });

      if (existingRecipe) {
        throw new BadRequestException(`产品已有该原料的配方记录`);
      }

      const recipe = this.recipeRepository.create({
        product,
        inventoryItem,
        quantity: ingredientDto.quantity,
        unit: ingredientDto.unit || inventoryItem.unit,
        notes: ingredientDto.notes,
        order: ingredientDto.order || 1,
        isRequired: ingredientDto.isRequired !== false,
        usagePercentage: ingredientDto.usagePercentage || 100,
      });

      ingredients.push(recipe);
    }

    return await this.recipeRepository.save(ingredients[0]);
  }

  /**
   * 获取产品配方
   */
  async getRecipeByProduct(productId: number): Promise<ProductRecipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { product: { id: productId } },
      relations: ['ingredients', 'ingredients.inventoryItem', 'product'],
    });

    if (!recipe) {
      throw new NotFoundException(`产品 ID ${productId} 没有配方`);
    }

    return recipe;
  }

  /**
   * 获取所有产品配方
   */
  async getAllRecipes(): Promise<ProductRecipe[]> {
    return await this.recipeRepository.find({
      relations: ['ingredients', 'ingredients.inventoryItem', 'product'],
    });
  }

  /**
   * 计算制作指定数量产品所需的原料
   */
  async calculateRequiredIngredients(productId: number, quantity: number): Promise<any[]> {
    if (quantity <= 0) {
      return [];
    }

    const recipe = await this.recipeRepository.findOne({
      where: { product: { id: productId } },
      relations: ['ingredients', 'ingredients.inventoryItem', 'product'],
    });

    if (!recipe) {
      return [];
    }

    return recipe.ingredients.map(ingredient => ({
      inventoryItemId: ingredient.inventoryItem.id,
      name: ingredient.inventoryItem.name,
      unit: ingredient.unit,
      requiredQuantity: Number(ingredient.getAdjustedQuantity()) * quantity,
    }));
  }

  /**
   * 检查原料是否充足
   */
  async checkIngredientAvailability(productId: number, quantity: number): Promise<boolean | any> {
    const requiredIngredients = await this.calculateRequiredIngredients(productId, quantity);
    
    if (requiredIngredients.length === 0) {
      return true; // 没有配方或数量为0，认为可用
    }

    [];

    for (const ingredient of requiredIngredients) {
      const const unavailableIngredients = inventoryItem = await this.inventoryRepository.findOne({
        where: { id: ingredient.inventoryItemId },
      });

      if (!inventoryItem) {
        unavailableIngredients.push({
          inventoryItemId: ingredient.inventoryItemId,
          name: ingredient.name,
          reason: '原料不存在',
        });
        continue;
      }

      if (!inventoryItem.isActive) {
        unavailableIngredients.push({
          inventoryItemId: ingredient.inventoryItemId,
          name: ingredient.name,
          reason: '原料已停用',
        });
        continue;
      }

      if (inventoryItem.currentStock < ingredient.requiredQuantity) {
        unavailableIngredients.push({
          inventoryItemId: ingredient.inventoryItemId,
          name: ingredient.name,
          requiredQuantity: ingredient.requiredQuantity,
          availableQuantity: inventoryItem.currentStock,
          unit: ingredient.unit,
          reason: '库存不足',
        });
      }
    }

    if (unavailableIngredients.length > 0) {
      return {
        available: false,
        unavailableIngredients,
      };
    }

    return true;
  }

  /**
   * 更新产品配方
   */
  async updateRecipe(productId: number, updateDto: UpdateProductRecipeDto): Promise<ProductRecipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { product: { id: productId } },
      relations: ['ingredients', 'ingredients.inventoryItem', 'product'],
    });

    if (!recipe) {
      throw new NotFoundException(`产品 ID ${productId} 没有配方`);
    }

    // 更新原料信息
    if (updateDto.ingredients) {
      // 删除现有原料
      await this.recipeRepository.delete({ product: { id: productId } });

      // 添加新原料
      for (const ingredientDto of updateDto.ingredients) {
        const inventoryItem = await this.inventoryRepository.findOne({
          where: { id: ingredientDto.inventoryItemId },
        });

        if (!inventoryItem) {
          throw new NotFoundException(`原料 ID ${ingredientDto.inventoryItemId} 不存在`);
        }

        const newIngredient = this.recipeRepository.create({
          product: recipe.product,
          inventoryItem,
          quantity: ingredientDto.quantity,
          unit: ingredientDto.unit || inventoryItem.unit,
          notes: ingredientDto.notes,
          order: ingredientDto.order || 1,
          isRequired: ingredientDto.isRequired !== false,
          usagePercentage: ingredientDto.usagePercentage || 100,
        });

        await this.recipeRepository.save(newIngredient);
      }
    }

    // 重新获取更新后的配方
    return await this.getRecipeByProduct(productId);
  }

  /**
   * 删除产品配方
   */
  async deleteRecipe(productId: number): Promise<void> {
    const recipe = await this.recipeRepository.findOne({
      where: { product: { id: productId } },
    });

    if (!recipe) {
      throw new NotFoundException(`产品 ID ${productId} 没有配方`);
    }

    await this.recipeRepository.remove(recipe);
  }

  /**
   * 复制配方到新产品
   */
  async duplicateRecipe(sourceProductId: number, targetProductId: number): Promise<ProductRecipe> {
    // 检查源产品配方
    const sourceRecipe = await this.recipeRepository.findOne({
      where: { product: { id: sourceProductId } },
      relations: ['ingredients', 'ingredients.inventoryItem'],
    });

    if (!sourceRecipe) {
      throw new NotFoundException(`源产品 ID ${sourceProductId} 没有配方`);
    }

    // 检查目标产品
    const targetProduct = await this.productRepository.findOne({
      where: { id: targetProductId },
    });

    if (!targetProduct) {
      throw new NotFoundException(`目标产品 ID ${targetProductId} 不存在`);
    }

    // 检查目标产品是否已有配方
    const existingRecipe = await this.recipeRepository.findOne({
      where: { product: { id: targetProductId } },
    });

    if (existingRecipe) {
      throw new BadRequestException('目标产品已有配方');
    }

    // 复制配方
    const newIngredients = [];

    for (const sourceIngredient of sourceRecipe.ingredients) {
      const newIngredient = this.recipeRepository.create({
        product: targetProduct,
        inventoryItem: sourceIngredient.inventoryItem,
        quantity: sourceIngredient.quantity,
        unit: sourceIngredient.unit,
        notes: sourceIngredient.notes,
        order: sourceIngredient.order,
        isRequired: sourceIngredient.isRequired,
        usagePercentage: sourceIngredient.usagePercentage,
      });

      newIngredients.push(newIngredient);
    }

    const savedRecipe = await this.recipeRepository.save(newIngredients[0]);
    
    // 返回完整的配方信息
    return await this.getRecipeByProduct(targetProductId);
  }

  /**
   * 验证配方完整性
   */
  async validateRecipeIntegrity(productId: number): Promise<any> {
    const recipe = await this.recipeRepository.findOne({
      where: { product: { id: productId } },
      relations: ['ingredients', 'ingredients.inventoryItem'],
    });

    if (!recipe) {
      return {
        isValid: false,
        invalidIngredients: [],
        message: '产品没有配方',
      };
    }

    const invalidIngredients = [];

    for (const ingredient of recipe.ingredients) {
      if (!ingredient.inventoryItem.isActive) {
        invalidIngredients.push({
          inventoryItemId: ingredient.inventoryItem.id,
          name: ingredient.inventoryItem.name,
          reason: '原料已停用',
        });
      }

      if (ingredient.quantity <= 0) {
        invalidIngredients.push({
          inventoryItemId: ingredient.inventoryItem.id,
          name: ingredient.inventoryItem.name,
          reason: '原料数量无效',
        });
      }
    }

    return {
      isValid: invalidIngredients.length === 0,
      invalidIngredients,
      totalIngredients: recipe.ingredients.length,
    };
  }

  /**
   * 获取产品配方成本
   */
  async getRecipeCost(productId: number): Promise<number> {
    const recipe = await this.recipeRepository.findOne({
      where: { product: { id: productId } },
      relations: ['ingredients', 'ingredients.inventoryItem'],
    });

    if (!recipe) {
      return 0;
    }

    return recipe.ingredients.reduce(
      (total, ingredient) => total + ingredient.getIngredientCost(),
      0,
    );
  }

  /**
   * 获取产品毛利信息
   */
  async getProductProfitability(productId: number): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['recipes', 'recipes.inventoryItem'],
    });

    if (!product) {
      throw new NotFoundException(`产品 ID ${productId} 不存在`);
    }

    const recipeCost = await this.getRecipeCost(productId);
    const sellingPrice = product.price;
    const profit = sellingPrice - recipeCost;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      productId,
      productName: product.name,
      sellingPrice,
      recipeCost,
      profit,
      profitMargin,
      isProfitable: profit > 0,
    };
  }
}