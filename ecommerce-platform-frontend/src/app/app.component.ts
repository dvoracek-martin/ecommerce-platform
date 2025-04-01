import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth.service';

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
    public authService: AuthService
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
    if (this.authService.isTokenValid()) {
      console.log('Show logout dropdown');
    } else {
      this.isPopupOpen = true;
    }
  }

  logout(): void {
    this.authService.logout();
  }

  changeLanguage(langCode: string): void {
    this.setLanguage(langCode);
  }

  private setLanguage(langCode: string): void {
    this.translate.use(langCode);
    this.selectedLanguage = this.languages.find(lang => lang.code === langCode) || this.languages[0];
  }

  closeAuthPopup(): void {
    this.isPopupOpen = false;
  }
}
