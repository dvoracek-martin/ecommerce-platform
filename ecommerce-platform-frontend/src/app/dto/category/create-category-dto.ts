import {MediaDTO} from '../media/media-dto';


export interface CreateCategoryDTO {
  name: string;
  description?: string;
  priority: number;
  active: boolean;
  tagIds: number[];
  media: MediaDTO[];
}
