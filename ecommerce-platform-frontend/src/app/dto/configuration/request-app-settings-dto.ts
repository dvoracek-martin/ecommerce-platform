import {ResponseLocaleDto} from './response-locale-dto';

export interface RequestAppSettingsDto {
    id?: number;
    usedLocales: ResponseLocaleDto[];
  theme?: string;
  updatedAt?: string; // ISO 8601 date string
  defaultLocale: ResponseLocaleDto;
  currency: string;
}
