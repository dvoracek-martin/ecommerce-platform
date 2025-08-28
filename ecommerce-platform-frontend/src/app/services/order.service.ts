import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor() { }

  createOrder(orderData: any): Observable<any> {
    // Dummy implementation that simulates API call with delay
    const mockOrder = {
      id: Math.floor(Math.random() * 10000),
      ...orderData,
      status: 'confirmed',
      orderDate: new Date().toISOString(),
      trackingNumber: 'TRK' + Math.floor(Math.random() * 1000000)
    };

    // Simulate API delay
    return of(mockOrder).pipe(delay(1000));
  }
}
