import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms-modal.component.html',
  imports: [
    TranslatePipe,
    MatIcon
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
