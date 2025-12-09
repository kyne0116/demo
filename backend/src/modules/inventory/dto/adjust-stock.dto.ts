import { IsNumber, IsString, IsInt, Min } from 'class-validator';

export class AdjustStockDto {
  @IsNumber()
  adjustment: number; // 调整数量（正数增加，负数减少）

  @IsString()
  reason: string; // 调整原因

  @IsInt()
  @Min(1)
  adjustedBy: number; // 调整操作人ID
}