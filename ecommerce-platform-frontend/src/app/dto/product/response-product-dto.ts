import {ResponseTagDTO} from '../tag/response-tag-dto';
import {ResponseCategoryDTO} from '../category/response-category-dto';
import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface ResponseProductDTO extends BaseUpdateOrResponseDTO {
  price?: number;
  weightGrams?: number;
  categoryId?: number;
  responseCategoryDTOs?: ResponseCategoryDTO[];
  responseTagDTOS?: ResponseTagDTO[];
  mixable: boolean;
  displayInProducts: boolean;
}
