import {MediaDTO} from '../media/media-dto';
import {LocalizedFieldDTO} from './localized-field-dto';

export interface BaseUpdateOrResponseDTO {
  id: number;
  localizedFields: Record<string, LocalizedFieldDTO>;
  priority: number;
  active: boolean;
  media?: MediaDTO[];
  translatedName: string;
  translatedDescription: string;
  translatedUrl: string;
}
