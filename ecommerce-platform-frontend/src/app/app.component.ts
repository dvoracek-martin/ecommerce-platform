import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ecommerce-platform-frontend';
  languages = [
    { code: 'en', name: 'English', icon: 'flag_us' },
    { code: 'de', name: 'Deutsch', icon: 'flag_ch' }, // Corrected code and icon for German
    { code: 'fr', name: 'Français', icon: 'flag_ch' }, // Corrected code and icon for French
    { code: 'cs', name: 'Česky', icon: 'flag_cz' },
    { code: 'es', name: 'Español', icon: 'flag_es' }  // Removed extra space in name
  ];
  selectedLanguage = this.languages[0];
  isPopupOpen = false;

  constructor(
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public authService: AuthService,
    private router: Router
  ) {
    this.matIconRegistry.addSvgIcon(
      'flag_us',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/us.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'flag_ch',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/ch.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'flag_cz',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/cz.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'flag_es',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/es.svg')
    );

    translate.addLangs(this.languages.map(lang => lang.code));
    translate.setDefaultLang('en');
    const browserLang = translate.getBrowserLang() || 'en';
    this.setLanguage(browserLang.match(/en|de|fr|cs|es/) ? browserLang : 'en'); // Include all language codes
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe();
  }

  onUserIconClick(): void {
    if (!this.authService.isTokenValid()) {
      this.isPopupOpen = true;
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/customer']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  changeLanguage(langCode: string): void {
    this.setLanguage(langCode);
  }

  closeAuthPopup(): void {
    this.isPopupOpen = false;
  }

  navigateToRoot() {
    this.router.navigate(['/']);
  }

  navigateToAdminCategories(): void {
    this.router.navigate(['/admin/categories']);
  }

  navigateToAdminProducts(): void {
    this.router.navigate(['/admin/products']);
  }

  navigateToAdminMixtures(): void {
    this.router.navigate(['/admin/mixtures']);
  }

  navigateToAdminCustomers(): void {
    this.router.navigate(['/admin/customers']);
  }

  navigateToAdminOrders(): void {
    this.router.navigate(['/admin/orders']);
  }

  navigateToClientOrders(): void {
    this.router.navigate(['/orders']);
  }

  navigateToAdminTags() {
    this.router.navigate(['/admin/tags']);
  }
  private setLanguage(langCode: string): void {
    this.translate.use(langCode);
    const foundLang = this.languages.find(lang => lang.code === langCode);
    this.selectedLanguage = foundLang || this.languages[0];
  }
}
