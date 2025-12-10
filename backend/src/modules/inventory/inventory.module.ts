import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryAlertController } from './inventory-alert.controller';
import { InventoryMetricsController } from './inventory-metrics.controller';
import { InventoryAlertService } from './inventory-alert.service';
import { InventoryMetricsService } from './inventory-metrics.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      InventoryItem,
      Product,
      OrderItem,
      Order,
    ]),
  ],
  controllers: [
    InventoryController,
    InventoryAlertController,
    InventoryMetricsController,
  ],
  providers: [
    InventoryService,
    InventoryAlertService,
    InventoryMetricsService,
  ],
  exports: [
    TypeOrmModule,
    InventoryService,
    InventoryAlertService,
    InventoryMetricsService,
  ],
})
export class InventoryModule {}