import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AuthService} from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:8080/api/orders/v1';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
  }

  createOrder(orderData: any): Observable<any> {
    const token = this.authService.token;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const customerId = this.authService.getUserId();

    const requestPayload = {
      customerId: customerId, // Use the authenticated user's ID or null for guests
      items: orderData.items.map((item: any) => ({
        itemId: item.itemId,
        cartItemType: item.cartItemType,
        quantity: item.quantity
      })),
      shippingCost: orderData.shippingCost,
      cartTotal: orderData.cartTotal,
      finalTotal: orderData.finalTotal,
      shippingMethod: orderData.shippingMethod,
      paymentMethod: orderData.paymentMethod
    };

    return this.http.post(`${this.apiUrl}`, requestPayload, {headers});
  }
}
