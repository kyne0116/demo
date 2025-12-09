import { PartialType } from '@nestjs/mapped-types';
import { CreateProductRecipeDto } from './create-product-recipe.dto';

export class UpdateProductRecipeDto extends PartialType(CreateProductRecipeDto) {}