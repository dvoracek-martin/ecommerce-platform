import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface UpdateProductDTO extends BaseUpdateOrResponseDTO {
  price?: number;
  weightGrams?: number;
  categoryId?: number;
  tagIds?: number[];
}
