import {BaseCreateDTO} from '../base/base-create.dto';
import {CreateCategoryDTO} from '../category/create-category-dto';

export interface CreateProductDTO extends BaseCreateDTO {
  price?: number;
  weightGrams?: number;
  categoryId: number;
  tagIds?: number[];
  mixable: boolean;
  displayInProducts: boolean;
}
