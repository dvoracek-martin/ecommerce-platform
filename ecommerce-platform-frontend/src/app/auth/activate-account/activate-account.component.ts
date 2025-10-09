import {isPlatformBrowser} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss'],
  standalone: false
})
export class ActivateAccountComponent implements OnInit {
  isLoading = true;
  isActivating = false;
  activationSuccess = false;
  activationError = false;
  errorMessage = '';
  isPopupOpen = false;

  private readonly ACTIVATION_KEY = 'activation_token_processed';
  private isBrowser = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.authService.setRegistrationComplete(false);
    this.verifyTokenAndActivate();
  }

  private verifyTokenAndActivate(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.activationError = true;
      this.errorMessage = this.translate.instant('ACTIVATION.INVALID_TOKEN');
      this.isLoading = false;
      return;
    }

    if (this.isBrowser) {
      const processedToken = sessionStorage.getItem(this.ACTIVATION_KEY);
      if (processedToken === token) {
        this.activationSuccess = true;
        this.isLoading = false;
        this.showSnackbar('ACTIVATION.ALREADY_PROCESSED');
        return;
      }
    }

    this.isActivating = true;
    this.isLoading = false;

    this.http.get(`/api/users/v1/activate?token=${token}`, {responseType: 'text'}).subscribe({
      next: () => {
        this.isActivating = false;
        this.activationSuccess = true;

        if (this.isBrowser) {
          sessionStorage.setItem(this.ACTIVATION_KEY, token);
        }
        this.authService.setRegistrationComplete(true);
        this.showSnackbar('ACTIVATION.SUCCESS');
      },
      error: (error) => {
        if (error.status === 400) {
          this.isActivating = false;
          this.activationSuccess = true;
          this.activationError = false;
          this.showSnackbar('ACTIVATION.TOKEN_ALREADY_USED_OR_EXPIRED');
        } else {
          this.isActivating = false;
          this.activationError = true;

          if (error.status === 404) {
            this.errorMessage = this.translate.instant('ACTIVATION.USER_NOT_FOUND');
          } else {
            this.errorMessage = this.translate.instant('ACTIVATION.GENERIC_ERROR');
          }
          this.showSnackbar('ACTIVATION.ERROR');
        }
        if (this.isBrowser) {
          sessionStorage.setItem(this.ACTIVATION_KEY, token);
        }
      }
    });
  }

  private showSnackbar(translationKey: string): void {
    this.snackBar.open(
      this.translate.instant(translationKey),
      this.translate.instant('COMMON.CLOSE'),
      {
        duration: 5000,
        panelClass: ['custom-snackbar']
      }
    );
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  openAuthPopup(): void {
    this.isPopupOpen = true;

    setTimeout(() => {
      const popupElement = document.querySelector('app-auth-popup');
    }, 100);
  }

  closeAuthPopup(): void {
    this.isPopupOpen = false;
  }
}
