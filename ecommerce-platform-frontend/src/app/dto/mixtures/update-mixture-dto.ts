import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface UpdateMixtureDTO extends BaseUpdateOrResponseDTO {
  price: number;
  weightGrams?: number;
  categoryId: number;
  productIds?: number[];
  tagIds?: number[];
  displayInProducts: boolean;
}
