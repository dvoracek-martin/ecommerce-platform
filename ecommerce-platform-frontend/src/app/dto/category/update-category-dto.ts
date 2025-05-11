import {uploadMediaDTO} from './upload-media-dto';

export interface UpdateCategoryDTO {
  id: number;
  name: string;
  description?: string;
  tagIds: number[];
  uploadMediaDTOs: uploadMediaDTO[];
}
