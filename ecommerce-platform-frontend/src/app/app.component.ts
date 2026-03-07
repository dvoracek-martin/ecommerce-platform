// src/app/app.component.ts
import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private translate: TranslateService) {
    // Set a sensible default so ngx-translate has a fallback
    this.translate.setDefaultLang('en');

    // Immediately use the cached language if available, so the correct
    // translation file starts loading before any component renders.
    // Without this, translate.use() only happens inside an async HTTP
    // callback (loadAppSettings), causing a race condition.
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('preferredLanguage');
      if (cached) {
        this.translate.use(cached);
      }
    }
  }

}
