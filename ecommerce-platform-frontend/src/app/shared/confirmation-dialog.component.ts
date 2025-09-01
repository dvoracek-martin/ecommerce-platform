import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  type?: 'warn' | 'info' | 'success';
  html?: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  standalone: false,
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
    private sanitizer: DomSanitizer
  ) {}

  getTitleIcon(): string {
    switch(this.data.type) {
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'success': return 'check_circle';
      default: return 'help_outline';
    }
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.data.html
      ? this.sanitizer.bypassSecurityTrustHtml(content)
      : content;
  }
}
