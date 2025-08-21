import {uploadMediaDTO} from './upload-media-dto';

export interface UpdateCategoryDTO {
  id: number;
  name: string;
  description?: string;
  priority: number;
  tagIds: number[];
  uploadMediaDTOs: uploadMediaDTO[];
}
