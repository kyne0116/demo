import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderCalculationService } from './services/order-calculation.service';
import { InventoryModule } from '../inventory/inventory.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    InventoryModule,
    MembersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderCalculationService],
  exports: [OrdersService, OrderCalculationService],
})
export class OrdersModule {}