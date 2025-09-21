import {ResponseTagDTO} from '../tag/response-tag-dto';
import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface ResponseCategoryDTO extends BaseUpdateOrResponseDTO {
  responseTagDTOS?: ResponseTagDTO[];
  mixable: boolean;
}
