// src/app/dto/category/response-category-dto.ts

import {ResponseMediaDTO} from './response-media-dto';
import {ResponseTagDTO} from '../tag/response-tag-dto';

export interface ResponseCategoryDTO {
  /** Primary key */
  id: number;
  /** Category name */
  name: string;
  /** Optional description */
  description?: string;
  /** Uploaded media items (images/videos) */
  responseMediaDTOs: ResponseMediaDTO[];
  /** List of tags associated with this category */
  tags: ResponseTagDTO[];
}
