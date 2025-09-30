  import { Injectable } from '@angular/core';
  import { TranslateService } from '@ngx-translate/core';
  import {ResponseLocaleDto} from '../dto/configuration/response-locale-dto';
  import {Observable} from 'rxjs';

  @Injectable({
    providedIn: 'root',
  })
  export class LocaleMapperService {

    private currentLocale: string = ''; // Default locale
    constructor(private translate: TranslateService) {}

    public mapLocale(languageCode: string, regionCode: string): string {
      const key = `${languageCode.toUpperCase()}_${regionCode.toUpperCase()}`;
      const translation = this.translate.instant(`LOCALES.${key}`);
      return translation || 'Unknown Locale';
    }

    public mapLocaleByLocaleAsync(locale: ResponseLocaleDto): Observable<string> {
      const key = `${locale.languageCode.toUpperCase()}_${locale.regionCode.toUpperCase()}`;
      return this.translate.get(`LOCALES.${key}`);
    }

    public mapLocaleByLocaleSync(locale: ResponseLocaleDto): string {
      const key = `${locale.languageCode.toUpperCase()}_${locale.regionCode.toUpperCase()}`;
      return this.translate.instant(`LOCALES.${key}`);
    }

    public getCurrentLocale(): string {
      return this.currentLocale;
    }

    public setCurrentLocale(locale: string):  void{
      this.currentLocale = locale;
    }
  }
