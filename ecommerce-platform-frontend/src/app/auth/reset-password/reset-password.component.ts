import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  standalone: false,
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  token: string;
  resetForm: FormGroup;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.resetForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^\S+$/) // No whitespace allowed
      ]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      return;
    }

    this.saving = true;

    const payload = {
      token: this.token,
      newPassword: this.resetForm.value.newPassword
    };

    this.http.post('http://localhost:8080/api/users/v1/reset-password', payload,
      {responseType: 'text'} // Explicitly expect text to avoid JSON parsing errors
    ).subscribe({
      next: () => {
        this.resetForm.reset();
        this.snackBar.open(
          this.translate.instant('RESET_PASSWORD.SUCCESS'),
          this.translate.instant('COMMON.CLOSE'),
          {duration: 5000}
        );
        this.router.navigate(['/']); // Navigate as needed
      },
      error: (err) => {
        let errorMessage;

        // Handle specific 400 case
        if (err.status === 400) {
          errorMessage = this.translate.instant('RESET_PASSWORD.TOKEN_INVALID_OR_EXPIRED');
        }
        // Handle other errors with message or fallback
        else {
          errorMessage = err.error?.message ||
            this.translate.instant('RESET_PASSWORD.ERROR');
        }

        this.snackBar.open(
          errorMessage,
          this.translate.instant('COMMON.CLOSE'),
          {duration: 5000}
        );
      }
    })
      .add(() => {
        this.saving = false;
      });
  }
}
