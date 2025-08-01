import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { SearchService } from './services/search.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SearchResultDTO } from './dto/search/search-result-dto';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ecommerce-platform-frontend';

  // Language selection
  languages = [
    { code: 'en', name: 'English', icon: 'flag_us' },
    { code: 'de', name: 'Deutsch', icon: 'flag_ch' },
    { code: 'fr', name: 'Français', icon: 'flag_ch' },
    { code: 'cs', name: 'Česky', icon: 'flag_cz' },
    { code: 'es', name: 'Español', icon: 'flag_es' }
  ];
  selectedLanguage = this.languages[0];

  // Authentication popup
  isPopupOpen = false;

  // Search state
  searchQuery = '';
  searchResults: SearchResultDTO[] = [];
  showResults = false;
  private searchSubject = new Subject<string>();

  constructor(
    public translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public authService: AuthService,
    private router: Router,
    private searchService: SearchService
  ) {
    // Register SVG icons
    ['us','ch','cz','es'].forEach(code =>
      this.matIconRegistry.addSvgIcon(
        `flag_${code}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/flags/${code}.svg`)
      )
    );

    // Setup translations
    translate.addLangs(this.languages.map(l => l.code));
    translate.setDefaultLang('en');
    const browserLang = translate.getBrowserLang() || 'en';
    this.setLanguage(/en|de|fr|cs|es/.test(browserLang) ? browserLang : 'en');
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe();

    this.searchSubject.pipe(debounceTime(300)).subscribe(q => {
      if (q.trim().length > 1) {
        this.searchService.search(q).subscribe(res => {
          this.searchResults = res;
          this.showResults = res.length > 0;
        });
      } else {
        this.searchResults = [];
        this.showResults = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  goTo(result: SearchResultDTO): void {
    this.showResults = false;
    const route = result.type === 'products' ? '/product' : '/mixture';
    this.router.navigate([route, result.id]);
  }

  changeLanguage(code: string): void {
    this.setLanguage(code);
  }
  private setLanguage(code: string) {
    this.translate.use(code);
    this.selectedLanguage = this.languages.find(l => l.code === code)!
      || this.selectedLanguage;
  }

  navigateToRoot(): void { this.router.navigate(['/']); }
  navigateToProfile(): void { this.router.navigate(['/customer']); }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
  navigateToAdminCategories(): void { this.router.navigate(['/admin/categories']); }
  navigateToAdminProducts(): void { this.router.navigate(['/admin/products']); }
  navigateToAdminMixtures(): void { this.router.navigate(['/admin/mixtures']); }
  navigateToAdminCustomers(): void { this.router.navigate(['/admin/customers']); }
  navigateToAdminOrders(): void { this.router.navigate(['/admin/orders']); }
  navigateToAdminTags(): void { this.router.navigate(['/admin/tags']); }

  onUserIconClick(): void {
    if (!this.authService.isTokenValid()) this.isPopupOpen = true;
  }
  closeAuthPopup(): void { this.isPopupOpen = false; }
}
