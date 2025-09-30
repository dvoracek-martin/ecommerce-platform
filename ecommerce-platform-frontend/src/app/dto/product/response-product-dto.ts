import {ResponseTagDTO} from '../tag/response-tag-dto';
import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface ResponseProductDTO extends BaseUpdateOrResponseDTO {
  price?: number;
  weightGrams?: number;
  categoryId?: number;
  responseTagDTOS?: ResponseTagDTO[];
  mixable: boolean;
  displayInProducts: boolean;
}
