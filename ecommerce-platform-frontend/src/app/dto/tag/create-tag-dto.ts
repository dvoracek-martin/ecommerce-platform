import {BaseCreateDTO} from '../base/base-create.dto';

export interface CreateTagDTO extends BaseCreateDTO {
  color: string;
  icon: string;
}
