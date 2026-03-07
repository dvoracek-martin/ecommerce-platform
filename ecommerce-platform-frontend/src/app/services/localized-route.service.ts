import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Router} from '@angular/router';

/**
 * Maps internal route keys to their translated URL slugs.
 * All public-facing pages use localized slugs; admin routes stay in English.
 *
 * Usage:
 *   this.localizedRoute.navigate('products');            → /produkte  (if lang=de)
 *   this.localizedRoute.navigate('products', [id, slug]);→ /produkte/5/my-slug
 *   this.localizedRoute.path('cart');                    → '/warenkorb'
 */
@Injectable({
  providedIn: 'root'
})
export class LocalizedRouteService {

  // Internal key → i18n key mapping
  private static readonly ROUTE_KEYS: Record<string, string> = {
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

  constructor(
    private translate: TranslateService,
    private router: Router,
  ) {}

  /**
   * Get the localized slug for a route key.
   * Falls back to the key itself if no translation found.
   */
  slug(routeKey: string): string {
    const i18nKey = LocalizedRouteService.ROUTE_KEYS[routeKey];
    if (!i18nKey) return routeKey;

    const translated = this.translate.instant(i18nKey);
    // If translation returns the key itself, fall back to English key
    if (!translated || translated === i18nKey) return routeKey;
    return translated;
  }

  /**
   * Get the full absolute path for a route, e.g. '/produkte'
   */
  path(routeKey: string, segments: (string | number)[] = []): string {
    const base = '/' + this.slug(routeKey);
    if (segments.length === 0) return base;
    return base + '/' + segments.join('/');
  }

  /**
   * Navigate to a localized route.
   */
  navigate(routeKey: string, segments: (string | number)[] = [], extras?: any): Promise<boolean> {
    const path = this.path(routeKey, segments);
    return this.router.navigate([path], extras);
  }

  /**
   * Navigate with query params.
   */
  navigateWithQuery(routeKey: string, queryParams: Record<string, any>): Promise<boolean> {
    return this.router.navigate([this.path(routeKey)], {queryParams});
  }

  /**
   * Given a URL slug from the current route, resolve which internal route key it maps to.
   * This is used by the route matcher to accept both English and localized slugs.
   */
  resolveRouteKey(urlSlug: string): string | null {
    // Direct match on English key
    if (LocalizedRouteService.ROUTE_KEYS[urlSlug]) return urlSlug;

    // Check all translations
    for (const [key, i18nKey] of Object.entries(LocalizedRouteService.ROUTE_KEYS)) {
      const translated = this.translate.instant(i18nKey);
      if (translated && translated !== i18nKey && translated === urlSlug) {
        return key;
      }
    }
    return null;
  }

  /**
   * Returns all possible slugs (English + all loaded languages) for a route key.
   */
  getAllSlugs(routeKey: string): string[] {
    const slugs = new Set<string>();
    slugs.add(routeKey); // English is always valid

    const i18nKey = LocalizedRouteService.ROUTE_KEYS[routeKey];
    if (i18nKey) {
      const translated = this.translate.instant(i18nKey);
      if (translated && translated !== i18nKey) {
        slugs.add(translated);
      }
    }
    return Array.from(slugs);
  }
}

