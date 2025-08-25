import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface UpdateTagDTO extends BaseUpdateOrResponseDTO {
  categoryIds?: number[];
  productIds?: number[];
  mixtureIds?: number[];
}
