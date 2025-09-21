import {MediaDTO} from '../media/media-dto';

export interface BaseCreateDTO {
  name: string;
  description?: string;
  priority?: number;
  active?: boolean;
  media?: MediaDTO[];
  url: string;
}
