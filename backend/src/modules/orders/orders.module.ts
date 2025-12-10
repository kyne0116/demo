import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProductionController } from './production.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderCalculationService } from './services/order-calculation.service';
import { ProductionService } from './production.service';
import { InventoryModule } from '../inventory/inventory.module';
import { MembersModule } from '../members/members.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    InventoryModule,
    MembersModule,
    AuthModule,  // 添加AuthModule以使用RolesGuard
  ],
  controllers: [
    OrdersController,
    ProductionController,
  ],
  providers: [
    OrdersService,
    OrderCalculationService,
    ProductionService,
  ],
  exports: [
    OrdersService,
    OrderCalculationService,
    ProductionService,
  ],
})
export class OrdersModule {}