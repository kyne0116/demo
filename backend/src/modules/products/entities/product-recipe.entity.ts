import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('product_recipes')
@Unique(['product', 'inventoryItem'])
export class ProductRecipe {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.recipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ name: 'inventory_item_id' })
  inventoryItemId: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number; // 所需数量

  @Column({ type: 'varchar', length: 20 })
  unit: string; // 单位（与inventoryItem.unit保持一致）

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string; // 备注，如"适量"、"按需添加"等

  @Column({ type: 'int', default: 1 })
  order: number; // 在配方中的顺序

  @Column({ type: 'boolean', default: true })
  isRequired: boolean; // 是否为必需原料

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  usagePercentage: number; // 使用百分比（用于调整配方）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 获取该原料的成本
  getIngredientCost(): number {
    return Number(this.quantity) * Number(this.inventoryItem?.costPrice || 0);
  }

  // 验证数量是否合理
  validateQuantity(): { isValid: boolean; message?: string } {
    if (this.quantity <= 0) {
      return { isValid: false, message: '原料数量必须大于0' };
    }
    
    if (this.quantity > 1000) {
      return { isValid: false, message: '原料数量过大，请检查单位' };
    }
    
    return { isValid: true };
  }

  // 计算调整后的数量
  getAdjustedQuantity(): number {
    return (Number(this.quantity) * Number(this.usagePercentage)) / 100;
  }

  // 获取原料信息摘要
  getIngredientSummary(): string {
    const ingredientName = this.inventoryItem?.name || '未知原料';
    const adjustedQuantity = this.getAdjustedQuantity();
    return `${ingredientName}: ${adjustedQuantity}${this.unit}`;
  }

  // 检查是否为关键原料
  isCritical(): boolean {
    // 关键原料的判断逻辑，可以根据具体业务需求调整
    const criticalCategories = ['TOPPING', 'SYRUP', 'FRUIT']; // 关键配料类
    return criticalCategories.includes(this.inventoryItem?.category);
  }

  // 获取替代原料建议（如果有的话）
  getAlternativeSuggestions(): string[] {
    // 这里可以返回替代原料的建议
    // 实际实现中可以基于历史数据或配置表来提供建议
    return [];
  }

  // 检查原料是否可用
  isIngredientAvailable(): boolean {
    if (!this.inventoryItem) return false;
    if (!this.inventoryItem.isActive) return false;
    if (this.inventoryItem.currentStock < this.getAdjustedQuantity()) return false;
    
    // 检查是否过期
    if (this.inventoryItem.expiryDate) {
      const today = new Date();
      if (today > new Date(this.inventoryItem.expiryDate)) {
        return false;
      }
    }
    
    return true;
  }

  // 获取原料成本占比
  getCostPercentage(totalRecipeCost: number): number {
    if (totalRecipeCost <= 0) return 0;
    return (this.getIngredientCost() / totalRecipeCost) * 100;
  }
}