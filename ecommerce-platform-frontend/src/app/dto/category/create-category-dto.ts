import {uploadMediaDTO} from './upload-media-dto';

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  categoryType: string;
  uploadMediaDTOs: uploadMediaDTO[];
}
