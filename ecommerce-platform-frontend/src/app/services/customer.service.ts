import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AuthService} from '../auth/auth.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {Customer} from '../dto/customer/customer-dto';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:8080/api/customers/v1';
  private apiAdminUrl = 'http://localhost:8080/api/customers/v1/admin';
  private userLanguageSubject = new BehaviorSubject<string>('en');
  userLanguage$ = this.userLanguageSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
  }

  /**
   * Fetch all customers (for admin list view)
   */
  getAll(): Observable<Customer[]> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Customer[]>(`${this.apiAdminUrl}`, { headers });
  }

  /**
   * Fetches customer data from the API for the authenticated user.
   * @returns An Observable of the Customer object.
   */
  getCustomerData(): Observable<Customer> {
    const userId = this.authService.getUserId();
    const token = this.authService.token;

    if (!userId || !token) {
      throw new Error('User not authenticated or token not available.');
    }

    return this.http.get<Customer>(`${this.apiUrl}/${userId}`, {
      headers: {'Authorization': `Bearer ${token}`}
    });
  }

  createGuestCustomer(customerData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/guest`, customerData, { headers });
  }

  setUserLanguage(lang: string) {
    this.userLanguageSubject.next(lang);
  }

  /**
   * Fetch a customer by ID (used for admin order list)
   * @param id Customer ID
   */
  getById(id: string): Observable<Customer> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Customer>(`${this.apiUrl}/${id}`, { headers });
  }
}
