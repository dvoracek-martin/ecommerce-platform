import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AuthService} from './auth.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {Customer} from '../dto/customer/customer-dto';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = '/api/customers/v1';
  private apiAdminUrl = '/api/customers/v1/admin';
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

  getByIdAdmin(id: string): Observable<Customer> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Customer>(`${this.apiAdminUrl}/${id}`, { headers });
  }

  /**
   * Get customer by ID for admin detail view
   * @param id Customer ID
   */
  getCustomerById(id: string): Observable<Customer> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Customer>(`${this.apiAdminUrl}/${id}`, { headers });
  }

  /**
   * Update customer details (admin function)
   * @param id Customer ID
   * @param payload Customer data to update
   */
  updateCustomer(id: string, payload: any): Observable<any> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.apiAdminUrl}/${id}`, payload, { headers });
  }

  /**
   * Change customer password (admin function)
   * @param id Customer ID
   * @param newPassword New password
   */
  changeCustomerPassword(id: string, newPassword: string): Observable<any> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = { newPassword };
    return this.http.put(`${this.apiAdminUrl}/${id}/password`, payload, { headers });
  }

  /**
   * Create a new customer (admin function)
   * @param customerData Customer data
   */
  createCustomer(customerData: any): Observable<Customer> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<Customer>(`${this.apiAdminUrl}`, customerData, { headers });
  }

  /**
   * Delete a customer (admin function)
   * @param id Customer ID
   */
  deleteCustomer(id: string): Observable<any> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${this.apiAdminUrl}/${id}`, { headers });
  }

  /**
   * Search customers by various criteria (admin function)
   * @param criteria Search criteria (email, name, etc.)
   */
  searchCustomers(criteria: { email?: string, name?: string, phone?: string }): Observable<Customer[]> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params: any = {};
    if (criteria.email) params.email = criteria.email;
    if (criteria.name) params.name = criteria.name;
    if (criteria.phone) params.phone = criteria.phone;

    return this.http.get<Customer[]>(`${this.apiAdminUrl}/search`, {
      headers,
      params
    });
  }

  /**
   * Get customer statistics (admin function)
   */
  getCustomerStats(): Observable<any> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiAdminUrl}/stats`, { headers });
  }

  /**
   * Update customer's preferred language
   * @param id Customer ID
   * @param languageCode Language code (e.g., 'en', 'de', 'fr')
   */
  updateCustomerLanguage(id: string, languageCode: string): Observable<any> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = { preferredLanguage: languageCode };
    return this.http.patch(`${this.apiAdminUrl}/${id}/language`, payload, { headers });
  }

  /**
   * Toggle customer active status
   * @param id Customer ID
   * @param active Active status
   */
  setCustomerActiveStatus(id: string, active: boolean): Observable<any> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = { active };
    return this.http.patch(`${this.apiAdminUrl}/${id}/status`, payload, { headers });
  }

  /**
   * Get customers with pagination (admin function)
   * @param page Page number (0-based)
   * @param size Page size
   */
  getCustomersPaginated(page: number = 0, size: number = 20): Observable<any> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = {
      page: page.toString(),
      size: size.toString()
    };

    return this.http.get<any>(`${this.apiAdminUrl}/paginated`, {
      headers,
      params
    });
  }

  /**
   * Export customers to CSV (admin function)
   */
  exportCustomersToCsv(): Observable<Blob> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiAdminUrl}/export/csv`, {
      headers,
      responseType: 'blob'
    });
  }

  /**
   * Validate customer email (check if email already exists)
   * @param email Email to validate
   */
  validateEmail(email: string): Observable<{ exists: boolean }> {
    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{ exists: boolean }>(`${this.apiAdminUrl}/validate-email`, {
      headers,
      params: { email }
    });
  }
}
