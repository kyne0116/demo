import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    example: 'making', 
    description: '订单状态', 
    enum: OrderStatus 
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}