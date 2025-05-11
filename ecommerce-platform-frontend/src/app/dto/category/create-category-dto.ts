import {uploadMediaDTO} from './upload-media-dto';

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  tagIds: number[];
  uploadMediaDTOs: uploadMediaDTO[];
}
