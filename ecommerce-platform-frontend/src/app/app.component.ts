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
    { code: 'cs', name: 'Česky', icon: 'flag_cz' }
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
      'flag_cz',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/cz.svg')
    );

    translate.addLangs(this.languages.map(lang => lang.code));
    translate.setDefaultLang('en');
    const browserLang = translate.getBrowserLang() || 'en';
    this.setLanguage(browserLang.match(/en|cs/) ? browserLang : 'en');
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

  private setLanguage(langCode: string): void {
    this.translate.use(langCode);
    const foundLang = this.languages.find(lang => lang.code === langCode);
    this.selectedLanguage = foundLang || this.languages[0];
  }
}
