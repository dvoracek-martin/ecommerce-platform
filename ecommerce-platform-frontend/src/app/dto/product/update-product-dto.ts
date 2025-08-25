import {MediaDTO} from '../media/media-dto';

export interface UpdateProductDTO {
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
  tagIds?: number[];
  media?: MediaDTO[];
}
