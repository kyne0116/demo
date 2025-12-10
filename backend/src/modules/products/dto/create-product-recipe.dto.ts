import { IsInt, IsArray, ValidateNested, IsNumber, IsString, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class IngredientDto {
  @IsInt()
  inventoryItemId: number;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  usagePercentage?: number;
}

export class CreateProductRecipeDto {
  @IsInt()
  productId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients: IngredientDto[];
}