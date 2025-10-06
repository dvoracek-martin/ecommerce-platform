import {LocalizedFieldDTO} from '../base/localized-field-dto';

export interface ResponseEmailDTO {
  id: number;
  emailType?: string;
  localizedFields?: Record<string, LocalizedFieldDTO>;
}
