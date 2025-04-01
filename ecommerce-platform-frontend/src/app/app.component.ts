// src/app/app.component.ts
import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Define available languages with a code, display name, and the name of the custom icon.
  languages = [
    {code: 'en', name: 'English', icon: 'flag_us'},
    {code: 'cs', name: 'Česky', icon: 'flag_cz'}
  ];

  selectedLanguage = this.languages[0];

  constructor(
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIcon(
      'flag_us',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/us.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'flag_cz',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/flags/cz.svg')
    );

    // Configure ngx-translate
    translate.addLangs(this.languages.map(lang => lang.code));
    translate.setDefaultLang('en');

    const browserLang = translate.getBrowserLang() || 'en';
    this.setLanguage(browserLang.match(/en|cs/) ? browserLang : 'en');
  }

  changeLanguage(langCode: string): void {
    this.setLanguage(langCode);
  }

  private setLanguage(langCode: string): void {
    this.translate.use(langCode);
    this.selectedLanguage = this.languages.find(lang => lang.code === langCode) || this.languages[0];
  }
}
