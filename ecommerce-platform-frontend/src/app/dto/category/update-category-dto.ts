import {BaseUpdateOrResponseDTO} from '../base/base-update-or-response.dto';

export interface UpdateCategoryDTO extends BaseUpdateOrResponseDTO {
  tagIds?: number[];
  mixable: boolean;
}
