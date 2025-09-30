import {BaseCreateDTO} from '../base/base-create.dto';

export interface CreateMixtureDTO extends BaseCreateDTO {
  price: number;
  weightGrams?: number;
  categoryId: number; // Assuming a single category for creation
  productIds?: number[];
  tagIds?: number[];
  displayInProducts: boolean;
  // for user defined mixtures
  name: string;
}
