import {LocalizedFieldDTO} from '../base/localized-field-dto';

export interface EmailDTO {
  localizedFields: { [key: string]: LocalizedFieldDTO };
  emailType: string;
  locale?: string;
}
