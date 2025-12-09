import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRecipeService } from '../../../src/modules/products/product-recipe.service';
import { ProductRecipe } from '../../../src/modules/products/entities/product-recipe.entity';
import { Product } from '../../../src/modules/products/entities/product.entity';
import { InventoryItem } from '../../../src/modules/inventory/entities/inventory-item.entity';

describe('ProductRecipeService', () => {
  let service: ProductRecipeService;
  let recipeRepository: Repository<ProductRecipe>;
  let productRepository: Repository<Product>;
  let inventoryRepository: Repository<InventoryItem>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRecipeService,
        {
          provide: getRepositoryToken(ProductRecipe),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(InventoryItem),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ProductRecipeService>(ProductRecipeService);
    recipeRepository = module.get<Repository<ProductRecipe>>(getRepositoryToken(ProductRecipe));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    inventoryRepository = module.get<Repository<InventoryItem>>(getRepositoryToken(InventoryItem));
  });

  describe('createRecipe', () => {
    it('应该为产品创建配方', async () => {
      const createRecipeDto = {
        productId: 1,
        ingredients: [
          { inventoryItemId: 1, quantity: 0.3, unit: 'kg' }, // 珍珠 0.3kg
          { inventoryItemId: 2, quantity: 0.2, unit: 'L' },  // 牛奶 0.2L
          { inventoryItemId: 3, quantity: 1, unit: '个' },   // 吸管 1个
        ],
      };

      const mockRecipe = {
        id: 1,
        product: { id: 1 },
        ingredients: createRecipeDto.ingredients,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(recipeRepository, 'save').mockResolvedValue(mockRecipe as any);

      const result = await service.createRecipe(createRecipeDto);

      expect(result).toEqual(mockRecipe);
      expect(productRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('产品不存在时应该抛出异常', async () => {
      const createRecipeDto = {
        productId: 999,
        ingredients: [
          { inventoryItemId: 1, quantity: 0.3, unit: 'kg' },
        ],
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createRecipe(createRecipeDto)).rejects.toThrow('产品不存在');
    });

    it('原料不存在时应该抛出异常', async () => {
      const createRecipeDto = {
        productId: 1,
        ingredients: [
          { inventoryItemId: 999, quantity: 0.3, unit: 'kg' }, // 不存在的原料
        ],
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(inventoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createRecipe(createRecipeDto)).rejects.toThrow('原料不存在');
    });

    it('数量不能为负数或零', async () => {
      const createRecipeDto = {
        productId: 1,
        ingredients: [
          { inventoryItemId: 1, quantity: -0.3, unit: 'kg' }, // 负数数量
        ],
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue({ id: 1 } as any);

      await expect(service.createRecipe(createRecipeDto)).rejects.toThrow('原料数量必须大于0');
    });
  });

  describe('getRecipeByProduct', () => {
    it('应该返回产品的配方信息', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1, name: '珍珠奶茶' },
        ingredients: [
          { inventoryItem: { id: 1, name: '珍珠', unit: 'kg' }, quantity: 0.3, unit: 'kg' },
          { inventoryItem: { id: 2, name: '牛奶', unit: 'L' }, quantity: 0.2, unit: 'L' },
        ],
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);

      const result = await service.getRecipeByProduct(1);

      expect(result).toEqual(mockRecipe);
      expect(recipeRepository.findOne).toHaveBeenCalledWith({
        where: { product: { id: 1 } },
        relations: ['ingredients', 'ingredients.inventoryItem', 'product'],
      });
    });

    it('产品没有配方时应该返回null', async () => {
      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getRecipeByProduct(999);

      expect(result).toBeNull();
    });
  });

  describe('calculateRequiredIngredients', () => {
    it('应该计算制作指定数量产品所需的原料', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1, name: '珍珠奶茶' },
        ingredients: [
          { inventoryItem: { id: 1, name: '珍珠', unit: 'kg' }, quantity: 0.3, unit: 'kg' },
          { inventoryItem: { id: 2, name: '牛奶', unit: 'L' }, quantity: 0.2, unit: 'L' },
        ],
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);

      const result = await service.calculateRequiredIngredients(1, 5); // 制作5杯

      expect(result).toEqual([
        { inventoryItemId: 1, name: '珍珠', requiredQuantity: 1.5, unit: 'kg' }, // 0.3 * 5
        { inventoryItemId: 2, name: '牛奶', requiredQuantity: 1.0, unit: 'L' },  // 0.2 * 5
      ]);
    });

    it('产品没有配方时应该返回空数组', async () => {
      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(null);

      const result = await service.calculateRequiredIngredients(999, 1);

      expect(result).toEqual([]);
    });

    it('数量为0时应该返回空数组', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1 },
        ingredients: [
          { inventoryItem: { id: 1 }, quantity: 0.3, unit: 'kg' },
        ],
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);

      const result = await service.calculateRequiredIngredients(1, 0);

      expect(result).toEqual([]);
    });
  });

  describe('checkIngredientAvailability', () => {
    it('原料充足时应该返回true', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1, name: '珍珠奶茶' },
        ingredients: [
          { inventoryItem: { id: 1, name: '珍珠', unit: 'kg' }, quantity: 0.3, unit: 'kg' },
          { inventoryItem: { id: 2, name: '牛奶', unit: 'L' }, quantity: 0.2, unit: 'L' },
        ],
      };

      const mockInventoryItems = [
        { id: 1, currentStock: 50, minStock: 10, maxStock: 200, isActive: true }, // 充足
        { id: 2, currentStock: 100, minStock: 20, maxStock: 200, isActive: true }, // 充足
      ];

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);
      jest.spyOn(inventoryRepository, 'findByIds').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkIngredientAvailability(1, 10); // 制作10杯

      expect(result).toBe(true);
      expect(inventoryRepository.findByIds).toHaveBeenCalledWith([1, 2]);
    });

    it('原料不足时应该返回false和具体信息', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1, name: '珍珠奶茶' },
        ingredients: [
          { inventoryItem: { id: 1, name: '珍珠', unit: 'kg' }, quantity: 0.3, unit: 'kg' },
          { inventoryItem: { id: 2, name: '牛奶', unit: 'L' }, quantity: 0.2, unit: 'L' },
        ],
      };

      const mockInventoryItems = [
        { id: 1, currentStock: 1, minStock: 10, maxStock: 200, isActive: true }, // 不足
        { id: 2, currentStock: 5, minStock: 20, maxStock: 200, isActive: true }, // 不足
      ];

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);
      jest.spyOn(inventoryRepository, 'findByIds').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkIngredientAvailability(1, 10); // 制作10杯需要3kg珍珠和2L牛奶

      expect(result).toBe(false);
    });

    it('非活跃原料应该被视为不可用', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1, name: '珍珠奶茶' },
        ingredients: [
          { inventoryItem: { id: 1, name: '珍珠', unit: 'kg' }, quantity: 0.3, unit: 'kg' },
        ],
      };

      const mockInventoryItems = [
        { id: 1, currentStock: 50, minStock: 10, maxStock: 200, isActive: false }, // 非活跃
      ];

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);
      jest.spyOn(inventoryRepository, 'findByIds').mockResolvedValue(mockInventoryItems as any);

      const result = await service.checkIngredientAvailability(1, 1);

      expect(result).toBe(false);
    });
  });

  describe('updateRecipe', () => {
    it('应该更新产品配方', async () => {
      const updateRecipeDto = {
        ingredients: [
          { inventoryItemId: 1, quantity: 0.4, unit: 'kg' }, // 增加珍珠用量
          { inventoryItemId: 2, quantity: 0.25, unit: 'L' }, // 增加牛奶用量
        ],
      };

      const mockExistingRecipe = {
        id: 1,
        product: { id: 1 },
        ingredients: [
          { id: 1, inventoryItem: { id: 1 }, quantity: 0.3, unit: 'kg' },
          { id: 2, inventoryItem: { id: 2 }, quantity: 0.2, unit: 'L' },
        ],
      };

      const mockUpdatedRecipe = {
        id: 1,
        product: { id: 1 },
        ingredients: updateRecipeDto.ingredients,
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockExistingRecipe as any);
      jest.spyOn(inventoryRepository, 'findByIds').mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ] as any);
      jest.spyOn(recipeRepository, 'save').mockResolvedValue(mockUpdatedRecipe as any);

      const result = await service.updateRecipe(1, updateRecipeDto);

      expect(result).toEqual(mockUpdatedRecipe);
    });

    it('配方不存在时应该抛出异常', async () => {
      const updateRecipeDto = {
        ingredients: [
          { inventoryItemId: 1, quantity: 0.3, unit: 'kg' },
        ],
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateRecipe(999, updateRecipeDto)).rejects.toThrow('配方不存在');
    });
  });

  describe('deleteRecipe', () => {
    it('应该删除产品配方', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1 },
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);
      jest.spyOn(recipeRepository, 'remove').mockResolvedValue(mockRecipe as any);

      await service.deleteRecipe(1);

      expect(recipeRepository.remove).toHaveBeenCalledWith(mockRecipe);
    });

    it('配方不存在时应该抛出异常', async () => {
      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteRecipe(999)).rejects.toThrow('配方不存在');
    });
  });

  describe('getAllRecipes', () => {
    it('应该返回所有产品的配方', async () => {
      const mockRecipes = [
        {
          id: 1,
          product: { id: 1, name: '珍珠奶茶' },
          ingredients: [
            { inventoryItem: { id: 1, name: '珍珠' }, quantity: 0.3, unit: 'kg' },
          ],
        },
        {
          id: 2,
          product: { id: 2, name: '柠檬茶' },
          ingredients: [
            { inventoryItem: { id: 3, name: '柠檬' }, quantity: 0.1, unit: '个' },
            { inventoryItem: { id: 4, name: '茶叶' }, quantity: 0.02, unit: 'kg' },
          ],
        },
      ];

      jest.spyOn(recipeRepository, 'find').mockResolvedValue(mockRecipes as any);

      const result = await service.getAllRecipes();

      expect(result).toEqual(mockRecipes);
      expect(recipeRepository.find).toHaveBeenCalledWith({
        relations: ['ingredients', 'ingredients.inventoryItem', 'product'],
      });
    });
  });

  describe('duplicateRecipe', () => {
    it('应该复制配方到新产品', async () => {
      const sourceProductId = 1;
      const targetProductId = 2;

      const mockSourceRecipe = {
        id: 1,
        product: { id: sourceProductId },
        ingredients: [
          { inventoryItem: { id: 1 }, quantity: 0.3, unit: 'kg' },
          { inventoryItem: { id: 2 }, quantity: 0.2, unit: 'L' },
        ],
      };

      const mockTargetProduct = { id: targetProductId };
      const mockNewRecipe = {
        id: 2,
        product: { id: targetProductId },
        ingredients: mockSourceRecipe.ingredients,
      };

      jest.spyOn(recipeRepository, 'findOne')
        .mockResolvedValueOnce(mockSourceRecipe as any) // 查找源配方
        .mockResolvedValueOnce(null); // 目标产品没有现有配方

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockTargetProduct as any);
      jest.spyOn(recipeRepository, 'save').mockResolvedValue(mockNewRecipe as any);

      const result = await service.duplicateRecipe(sourceProductId, targetProductId);

      expect(result).toEqual(mockNewRecipe);
    });

    it('目标产品已有配方时应该抛出异常', async () => {
      const sourceProductId = 1;
      const targetProductId = 2;

      const mockSourceRecipe = {
        id: 1,
        product: { id: sourceProductId },
        ingredients: [
          { inventoryItem: { id: 1 }, quantity: 0.3, unit: 'kg' },
        ],
      };

      const mockTargetProduct = { id: targetProductId };
      const mockExistingRecipe = { id: 2, product: { id: targetProductId } };

      jest.spyOn(recipeRepository, 'findOne')
        .mockResolvedValueOnce(mockSourceRecipe as any) // 查找源配方
        .mockResolvedValueOnce(mockExistingRecipe as any); // 目标产品已有配方

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockTargetProduct as any);

      await expect(service.duplicateRecipe(sourceProductId, targetProductId))
        .rejects.toThrow('目标产品已有配方');
    });
  });

  describe('validateRecipeIntegrity', () => {
    it('应该验证配方的完整性', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1, name: '珍珠奶茶' },
        ingredients: [
          { inventoryItem: { id: 1, name: '珍珠', isActive: true }, quantity: 0.3, unit: 'kg' },
          { inventoryItem: { id: 2, name: '牛奶', isActive: false }, quantity: 0.2, unit: 'L' }, // 非活跃原料
        ],
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);

      const result = await service.validateRecipeIntegrity(1);

      expect(result.isValid).toBe(false);
      expect(result.invalidIngredients).toHaveLength(1);
      expect(result.invalidIngredients[0].inventoryItemId).toBe(2);
    });

    it('有效配方应该返回true', async () => {
      const mockRecipe = {
        id: 1,
        product: { id: 1, name: '珍珠奶茶' },
        ingredients: [
          { inventoryItem: { id: 1, name: '珍珠', isActive: true }, quantity: 0.3, unit: 'kg' },
          { inventoryItem: { id: 2, name: '牛奶', isActive: true }, quantity: 0.2, unit: 'L' },
        ],
      };

      jest.spyOn(recipeRepository, 'findOne').mockResolvedValue(mockRecipe as any);

      const result = await service.validateRecipeIntegrity(1);

      expect(result.isValid).toBe(true);
      expect(result.invalidIngredients).toHaveLength(0);
    });
  });
});