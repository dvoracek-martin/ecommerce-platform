import {ResponseMediaDTO} from './response-media-dto';

export interface ResponseCategoryDTO {
  id: number; // Changed to number to match the backend
  name: string;
  description?: string;
  categoryType: string;
  responseMediaDTOs: ResponseMediaDTO[]; // Changed to match backend property name
  // createdAt: string;  // Removed as it's not in the backend response
  // updatedAt: string;  // Removed as it's not in the backend response
}
