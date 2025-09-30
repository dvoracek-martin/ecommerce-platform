import {MediaDTO} from '../media/media-dto';
import {LocalizedFieldDTO} from './localized-field-dto';

export interface BaseCreateDTO {
  localizedFields: Record<string, LocalizedFieldDTO>;
  priority?: number;
  active?: boolean;
  media?: MediaDTO[];
}
