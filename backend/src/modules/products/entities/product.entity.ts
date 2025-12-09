import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductRecipe } from './product-recipe.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'json', nullable: true })
  nutritionInfo: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isAvailable: boolean; // 是否可售

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku: string | null; // 商品编码

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  preparationTime: number; // 制作时间（分钟）

  @Column({ type: 'varchar', length: 500, nullable: true })
  allergens: string; // 过敏原信息（JSON字符串）

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number | null; // 成本价格（用于计算毛利）

  @Column({ type: 'int', default: 0 })
  viewCount: number; // 浏览次数

  @Column({ type: 'int', default: 0 })
  orderCount: number; // 订单次数

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关系
  @ManyToOne(() => Category, category => category.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => OrderItem, item => item.product)
  orderItems: OrderItem[];

  @OneToMany(() => ProductRecipe, recipe => recipe.product)
  recipes: ProductRecipe[];

  // 方法
  getProfit(): number {
    if (!this.costPrice) return 0;
    return this.price - this.costPrice;
  }

  getProfitMargin(): number {
    if (!this.costPrice || this.costPrice <= 0) return 0;
    return ((this.price - this.costPrice) / this.price) * 100;
  }

  isInStock(): boolean {
    // 检查所有必需原料是否有库存
    if (!this.recipes) return true;

    return this.recipes
      .filter(recipe => recipe.isRequired)
      .every(recipe => recipe.isIngredientAvailable());
  }

  getTotalIngredientCost(): number {
    if (!this.recipes) return 0;

    return this.recipes
      .reduce((total, recipe) => total + recipe.getIngredientCost(), 0);
  }

  getAllergensList(): string[] {
    if (!this.allergens) return [];

    try {
      return JSON.parse(this.allergens);
    } catch {
      return [];
    }
  }

  setAllergensList(allergens: string[]): void {
    this.allergens = JSON.stringify(allergens);
  }

  canBeMade(): boolean {
    return this.isActive && this.isAvailable && this.isInStock();
  }
}
}