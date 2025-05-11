import { UploadMediaDTO } from '../media/upload-media-dto';
import { TagDTO } from '../tag/tag-dto';

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  images?: string[];
  categoryId: number;
  scentProfile: string;
  botanicalName: string;
  extractionMethod: string;
  origin: string;
  usageInstructions: string;
  volumeMl: number;
  warnings: string;
  medicinalUse?: string;
  weightGrams: number;
  allergens?: string[];
  tagIds: number[];
  uploadMediaDTOs?: UploadMediaDTO[];
}
