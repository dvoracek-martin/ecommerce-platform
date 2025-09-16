import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OrderStateService {
  private _selectedOrderId: number | null = null;

  setSelectedOrder(orderId: number): void {
    this._selectedOrderId = orderId;
  }

  getSelectedOrder(): number | null {
    return this._selectedOrderId;
  }

  clearSelectedOrder(): void {
    this._selectedOrderId = null;
  }
}
