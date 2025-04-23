import { ResponseMediaDTO } from '../category/response-media-dto';
import { TagDTO } from '../tag/tag-dto';

export interface ResponseProductDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  images?: string[]; // Optional, as you have responseMediaDTOs
  categoryId: number;
  scentProfile?: string;
  botanicalName?: string;
  extractionMethod?: string;
  origin?: string;
  usageInstructions?: string;
  volumeMl?: number;
  warnings?: string;
  medicinalUse?: string;
  weightGrams?: number;
  allergens?: string[];
  tagsDTOs?: TagDTO[];
  responseMediaDTOs?: ResponseMediaDTO[];
}
