import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseProductDTO} from '../dto/product/response-product-dto';

@Injectable({
  providedIn: 'root'
})
export class MixtureService {

  private apiUrl = 'http://localhost:8080/api/catalog/v1'; // Adjust your API endpoint
  private apiAdminUrl = 'http://localhost:8080/api/catalog/v1/admin';

  constructor(private http: HttpClient) {}

  getAllMixturesAdmin(): Observable<ResponseProductDTO[]> {
    return this.http.get<ResponseProductDTO[]>(`${this.apiAdminUrl}/all-mixtures`);
  }
}
