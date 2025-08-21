import {uploadMediaDTO} from './upload-media-dto';

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  priority: number;
  active: boolean;
  tagIds: number[];
  uploadMediaDTOs: uploadMediaDTO[];
}
