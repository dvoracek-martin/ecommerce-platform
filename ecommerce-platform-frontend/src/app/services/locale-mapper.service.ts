import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {ResponseLocaleDto} from '../dto/configuration/response-locale-dto';

@Injectable({
  providedIn: 'root',
})
export class LocaleMapperService {
  constructor(private translate: TranslateService) {}

  public mapLocale(languageCode: string, regionCode: string): string {
    const key = `${languageCode.toUpperCase()}_${regionCode.toUpperCase()}`;
    const translation = this.translate.instant(`LOCALES.${key}`);
    return translation || 'Unknown Locale';
  }

  public mapLocaleByLocale(locale:ResponseLocaleDto): string {
    const key = `${locale.languageCode.toUpperCase()}_${locale.regionCode.toUpperCase()}`;
    const translation = this.translate.instant(`LOCALES.${key}`);
    return translation || 'Unknown Locale';
  }
}
