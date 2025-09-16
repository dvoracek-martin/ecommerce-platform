import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {AuthService} from '../auth/auth.service';
import {ResponseOrderDTO} from '../dto/order/response-order-dto';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:8080/api/orders/v1';
  private apiAdminUrl = 'http://localhost:8080/api/orders/v1/admin';

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
      customerId: customerId,
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

  getOrderById(orderId: number): Observable<ResponseOrderDTO> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<ResponseOrderDTO>(`${this.apiUrl}/${orderId}`, { headers });
  }

  /**
   * Fetches all orders for a specific user.
   * Assumes the backend API is structured like: GET /api/orders/v1/user/{customerId}
   * @param customerId The ID of the authenticated user.
   */
  getOrdersByUserId(customerId: string): Observable<ResponseOrderDTO[]> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<ResponseOrderDTO[]>(`${this.apiUrl}/customer/${customerId}`, {headers});
  }

  /**
   * Downloads an invoice for a specific order as a PDF.
   * Assumes the backend API is structured like: GET /api/orders/v1/invoice/{orderId}
   * @param customerId
   * @param orderId The ID of the order to download the invoice for.
   */
  downloadInvoice(customerId: string, orderId: number): Observable<HttpResponse<ArrayBuffer>> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/customer/${customerId}/invoice/${orderId}`, {
      headers: headers,
      responseType: 'arraybuffer',
      observe: 'response'
    });
  }

  /**
   * Fetches all orders (admin view)
   */
  getAll(): Observable<ResponseOrderDTO[]> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<ResponseOrderDTO[]>(`${this.apiAdminUrl}`, {headers});
  }
}
