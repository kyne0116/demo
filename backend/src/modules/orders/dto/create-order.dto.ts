import { IsArray, IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'product-uuid', description: '产品ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: '珍珠奶茶', description: '产品名称' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ example: 18.50, description: '产品单价' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 2, description: '数量' })
  @IsNumber()
  quantity: number;
}

export class MemberInfoDto {
  @ApiProperty({ example: 'silver', description: '会员等级', required: false })
  @IsOptional()
  @IsString()
  memberLevel?: string;

  @ApiProperty({ example: 500, description: '可用积分', required: false })
  @IsOptional()
  @IsNumber()
  pointsAvailable?: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'customer-uuid', description: '客户ID（可为空，支持匿名购买）', required: false })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ example: 'staff-uuid', description: '处理店员ID' })
  @IsUUID()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: '订单商品列表',
    example: [
      { productId: 'uuid1', productName: '珍珠奶茶', unitPrice: 18.50, quantity: 2 },
      { productId: 'uuid2', productName: '芒果布丁', unitPrice: 15.00, quantity: 1 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: '少糖，谢谢', description: '订单备注', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: MemberInfoDto, description: '会员信息（可选）', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberInfoDto)
  memberInfo?: MemberInfoDto;
}