import {DefaultUrlSerializer, UrlTree} from '@angular/router';
import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

/**
 * Custom UrlSerializer that translates public URL segments between
 * the internal (English) route keys and the current locale's slugs.
 *
 * Uses a static fallback map so it works even before ngx-translate
 * has loaded the JSON file (race condition on page reload).
 */
@Injectable()
export class LocalizedUrlSerializer extends DefaultUrlSerializer {

  // English key → i18n key
  private static readonly ROUTE_MAP: Record<string, string> = {
    'products': 'ROUTES.PRODUCTS',
    'categories': 'ROUTES.CATEGORIES',
    'mixtures': 'ROUTES.MIXTURES',
    'mixing': 'ROUTES.MIXING',
    'cart': 'ROUTES.CART',
    'checkout': 'ROUTES.CHECKOUT',
    'register': 'ROUTES.REGISTER',
    'contact': 'ROUTES.CONTACT',
    'about-us': 'ROUTES.ABOUT_US',
    'sales': 'ROUTES.SALES',
  };

  // Static fallback: lang → { englishKey → localizedSlug }
  private static readonly STATIC_SLUGS: Record<string, Record<string, string>> = {
    'en': {
      'products': 'products', 'categories': 'categories', 'mixtures': 'mixtures',
      'mixing': 'mixing', 'cart': 'cart', 'checkout': 'checkout',
      'register': 'register', 'contact': 'contact', 'about-us': 'about-us', 'sales': 'sales',
    },
    'de': {
      'products': 'produkte', 'categories': 'kategorien', 'mixtures': 'mischungen',
      'mixing': 'mischen', 'cart': 'warenkorb', 'checkout': 'kasse',
      'register': 'registrieren', 'contact': 'kontakt', 'about-us': 'ueber-uns', 'sales': 'angebote',
    },
    'cs': {
      'products': 'produkty', 'categories': 'kategorie', 'mixtures': 'smesi',
      'mixing': 'michani', 'cart': 'kosik', 'checkout': 'pokladna',
      'register': 'registrace', 'contact': 'kontakt', 'about-us': 'o-nas', 'sales': 'akce',
    },
    'fr': {
      'products': 'produits', 'categories': 'categories', 'mixtures': 'melanges',
      'mixing': 'melange', 'cart': 'panier', 'checkout': 'caisse',
      'register': 'inscription', 'contact': 'contact', 'about-us': 'a-propos', 'sales': 'promotions',
    },
    'es': {
      'products': 'productos', 'categories': 'categorias', 'mixtures': 'mezclas',
      'mixing': 'mezcla', 'cart': 'carrito', 'checkout': 'caja',
      'register': 'registro', 'contact': 'contacto', 'about-us': 'sobre-nosotros', 'sales': 'ofertas',
    },
  };

  // Reverse map: localizedSlug → englishKey (lazily built)
  private static _reverseMap: Record<string, string> | null = null;

  private static getReverseMap(): Record<string, string> {
    if (!LocalizedUrlSerializer._reverseMap) {
      const rev: Record<string, string> = {};
      for (const langSlugs of Object.values(LocalizedUrlSerializer.STATIC_SLUGS)) {
        for (const [eng, loc] of Object.entries(langSlugs)) {
          rev[loc] = eng;
        }
      }
      LocalizedUrlSerializer._reverseMap = rev;
    }
    return LocalizedUrlSerializer._reverseMap;
  }

  constructor(private translate: TranslateService) {
    super();
  }

  override parse(url: string): UrlTree {
    return super.parse(this.localizedToInternal(url));
  }

  override serialize(tree: UrlTree): string {
    return this.internalToLocalized(super.serialize(tree));
  }

  private getCurrentLang(): string {
    const lang = this.translate.currentLang || this.translate.defaultLang;
    if (lang) return lang;
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('preferredLanguage') || 'en';
    }
    return 'en';
  }

  /**
   * Get the localized slug for an English route key.
   * Prefers translate.instant(); falls back to static map.
   */
  private getLocalizedSlug(englishKey: string): string | null {
    const i18nKey = LocalizedUrlSerializer.ROUTE_MAP[englishKey];
    if (i18nKey) {
      const t = this.translate.instant(i18nKey);
      if (t && t !== i18nKey) return t;
    }
    const lang = this.getCurrentLang();
    return LocalizedUrlSerializer.STATIC_SLUGS[lang]?.[englishKey] ?? null;
  }

  /**
   * Resolve a localized slug back to its English key.
   */
  private resolveToEnglish(slug: string): string | null {
    if (LocalizedUrlSerializer.ROUTE_MAP[slug]) return slug;
    return LocalizedUrlSerializer.getReverseMap()[slug] ?? null;
  }

  private localizedToInternal(url: string): string {
    const [pathPart, ...rest] = url.split(/(?=[?#])/);
    const segments = pathPart.split('/').filter(s => s !== '');
    if (segments.length === 0 || segments[0] === 'admin') return url;

    const englishKey = this.resolveToEnglish(segments[0]);
    if (englishKey && englishKey !== segments[0]) {
      segments[0] = englishKey;
      return '/' + segments.join('/') + (rest.length ? rest.join('') : '');
    }
    return url;
  }

  private internalToLocalized(url: string): string {
    const [pathPart, ...rest] = url.split(/(?=[?#])/);
    const segments = pathPart.split('/').filter(s => s !== '');
    if (segments.length === 0 || segments[0] === 'admin') return url;

    const localized = this.getLocalizedSlug(segments[0]);
    if (localized && localized !== segments[0]) {
      segments[0] = localized;
      return '/' + segments.join('/') + (rest.length ? rest.join('') : '');
    }
    return url;
  }
}

