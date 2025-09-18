import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CustomerStateService {
  private _selectedCustomerId: string | null = null;

  setSelectedCustomer(CustomerId: string): void {
    this._selectedCustomerId = CustomerId;
  }

  getSelectedCustomer(): string | null {
    return this._selectedCustomerId;
  }

  clearSelectedCustomer(): void {
    this._selectedCustomerId = null;
  }
}
