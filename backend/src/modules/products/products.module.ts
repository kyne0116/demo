import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { ProductRecipeService } from './product-recipe.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, ProductRecipe, InventoryItem]),
    InventoryModule,
    AuthModule,  // 添加AuthModule以使用RolesGuard
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRecipeService],
  exports: [ProductsService, ProductRecipeService],
})
export class ProductsModule {}