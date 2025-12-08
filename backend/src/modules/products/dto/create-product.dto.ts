import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: '珍珠奶茶', description: '产品名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '经典珍珠奶茶，丝滑奶茶配Q弹珍珠', description: '产品描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 18.50, description: '产品价格' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'category-uuid', description: '分类ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: '/images/milk-tea.jpg', description: '产品图片URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: { calories: 350, protein: 5, sugar: 45 }, description: '营养信息', required: false })
  @IsOptional()
  nutritionInfo?: any;

  @ApiProperty({ example: true, description: '是否上架', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 1, description: '排序权重', required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}