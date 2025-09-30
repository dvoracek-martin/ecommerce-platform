import {Component, EventEmitter, Output} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms-modal.component.html',
  imports: [
    TranslatePipe,
    MatIcon,
    MatButton,
    MatIconButton,
  ],
  styleUrls: ['./terms-modal.component.scss']
})
export class TermsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<TermsModalComponent>,
    public translate: TranslateService
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
