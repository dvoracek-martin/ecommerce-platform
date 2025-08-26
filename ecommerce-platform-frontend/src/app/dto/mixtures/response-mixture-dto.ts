import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';
import {ResponseProductDTO} from '../product/response-product-dto';

export interface ResponseMixtureDTO extends BaseUpdateOrResponseDTO {
  price: number;
  weightGrams?: number;
  categoryId: number;
  products?: ResponseProductDTO[];
  tagIds?: number[];
  totalPrice?: number;
}
