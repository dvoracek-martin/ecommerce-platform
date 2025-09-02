import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AuthService} from '../auth/auth.service';
import {Observable} from 'rxjs';

interface Address {
  street: string | null;
  phone: string | null;
  houseNumber: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
}

interface BillingAddress {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  taxId: string | null;
  phone: string | null;
  street: string | null;
  houseNumber: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
}

interface Customer {
  id?: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  address?: Address | null;
  billingAddress?: BillingAddress | null;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:8080/api/customers/v1';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
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
}
