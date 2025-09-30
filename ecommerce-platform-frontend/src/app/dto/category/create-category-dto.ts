import {ResponseTagDTO} from '../tag/response-tag-dto';
import {BaseCreateDTO} from '../base/base-create.dto';

export interface CreateCategoryDTO extends BaseCreateDTO {
  tagIds?: number[];
  mixable: boolean;
}
