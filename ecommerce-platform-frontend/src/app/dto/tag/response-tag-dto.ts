import {ResponseProductDTO} from '../product/response-product-dto';
import {ResponseCategoryDTO} from '../category/response-category-dto';
import {ResponseMixtureDTO} from '../mixtures/response-mixture-dto';
import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface ResponseTagDTO extends BaseUpdateOrResponseDTO {
  categories?: ResponseCategoryDTO[];
  products?: ResponseProductDTO[];
  mixtures?: ResponseMixtureDTO[];
}
