import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {AuthService} from './auth.service';
import {ResponseOrderDTO} from '../dto/order/response-order-dto';
import {UpdateOrderDTO} from '../dto/order/update-order-dto';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = '/api/orders/v1';
  private readonly apiAdminUrl = `${this.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
  }

  private getAuthHeaders(includeJson = false): HttpHeaders {
    const token = this.authService.token;
    let headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    if (includeJson) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  createOrder(orderData: any): Observable<ResponseOrderDTO> {
    console.log(orderData.selectedLocale)
    const customerId = this.authService.getUserId();

    const requestPayload = {
        customerId,
        items: orderData.items.map((item: any) => ({
          itemId: item.itemId,
          cartItemType: item.cartItemType,
          quantity: item.quantity
        })),
        shippingCost: orderData.shippingCost,
        cartTotal: orderData.cartTotal,
        finalTotal: orderData.finalTotal,
        shippingMethod: orderData.shippingMethod,
        paymentMethod: orderData.paymentMethod,
        selectedLocale: orderData.selectedLocale
      }
    ;
console.log(JSON.stringify(requestPayload))
    return this.http.post<ResponseOrderDTO>(
      this.apiUrl,
      requestPayload,
      {headers: this.getAuthHeaders(true)}
    );
  }

  getOrderById(orderId: number): Observable<ResponseOrderDTO> {
    return this.http.get<ResponseOrderDTO>(
      `${this.apiUrl}/${orderId}`,
      {headers: this.getAuthHeaders()}
    );
  }

  getByCustomerId(customerId: string): Observable<ResponseOrderDTO[]> {
    return this.http.get<ResponseOrderDTO[]>(
      `${this.apiAdminUrl}/customer/${customerId}`,
      {headers: this.getAuthHeaders()}
    );
  }

  downloadInvoice(customerId: string, orderId: number): Observable<HttpResponse<ArrayBuffer>> {
    return this.http.get(`${this.apiUrl}/customer/${customerId}/invoice/${orderId}`, {
      headers: this.getAuthHeaders(),
      responseType: 'arraybuffer',
      observe: 'response'
    });
  }

  getAll(): Observable<ResponseOrderDTO[]> {
    return this.http.get<ResponseOrderDTO[]>(
      this.apiAdminUrl,
      {headers: this.getAuthHeaders()}
    );
  }

  updateOrder(order: UpdateOrderDTO): Observable<ResponseOrderDTO> {
    return this.http.put<ResponseOrderDTO>(
      this.apiAdminUrl,
      order,
      {headers: this.getAuthHeaders(true)}
    );
  }

  generateInvoiceInLocale(orderId: number, selectedLocale: string): Observable<HttpResponse<ArrayBuffer>> {
    return this.http.get(this.apiAdminUrl+`/${orderId}/${selectedLocale}`, {
      responseType: 'arraybuffer',
      observe: 'response'
    });
  }
}
