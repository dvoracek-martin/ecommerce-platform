  import { Injectable } from '@angular/core';
  import { TranslateService } from '@ngx-translate/core';
  import {ResponseLocaleDto} from '../dto/configuration/response-locale-dto';
  import {Observable} from 'rxjs';

  @Injectable({
    providedIn: 'root',
  })
  export class LocaleMapperService {

    private static readonly LOCALE_STORAGE_KEY = 'currentLocale';
    private currentLocale: string = '';

    constructor(private translate: TranslateService) {
      // Restore locale synchronously from localStorage so it is available
      // immediately — before any async HTTP call (loadAppSettings) resolves.
      // This prevents a race condition where components translate content
      // using an empty locale and get blank strings / wrong language.
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(LocaleMapperService.LOCALE_STORAGE_KEY);
        if (stored) {
          this.currentLocale = stored;
        }
      }
    }

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

    public setCurrentLocale(locale: string): void {
      this.currentLocale = locale;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LocaleMapperService.LOCALE_STORAGE_KEY, locale);
      }
    }
  }
