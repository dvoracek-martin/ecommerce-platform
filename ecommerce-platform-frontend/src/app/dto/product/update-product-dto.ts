import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';
import {ResponseCategoryDTO} from '../category/response-category-dto';
import {ResponseTagDTO} from '../tag/response-tag-dto';


export interface UpdateProductDTO extends BaseUpdateOrResponseDTO {
  price?: number;
  weightGrams?: number;
  categoryId?: number;
  responseCategoryDTOs?: ResponseCategoryDTO[];
  responseTagDTOS?: ResponseTagDTO[];
}
