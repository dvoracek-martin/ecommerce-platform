import {MediaDTO} from '../media/media-dto';

export interface BaseUpdateOrResponseDTO {
  id: number;
  name: string;
  description?: string;
  priority: number;
  active: boolean;
  media?: MediaDTO[];
  url: string;
}
