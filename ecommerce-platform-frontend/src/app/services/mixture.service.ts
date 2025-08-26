import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseProductDTO} from '../dto/product/response-product-dto';
import {ResponseMixtureDTO} from "../dto/mixtures/response-mixture-dto";

// A DTO for the request to create a new mixture
export interface CreateMixtureRequest {
  name: string;
  productIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class MixtureService {

  private apiUrl = 'http://localhost:8080/api/catalog/v1/mixtures';

  constructor(private http: HttpClient) {
  }

  // New method to create a mixture on the backend
  public createMixture(request: CreateMixtureRequest): Observable<ResponseMixtureDTO> {
    return this.http.post<ResponseMixtureDTO>(this.apiUrl, request);
  }

  // New method to retrieve mixture details by ID
  public getMixtureById(id: number): Observable<ResponseMixtureDTO> {
    return this.http.get<ResponseMixtureDTO>(`${this.apiUrl}/${id}`);
  }

  // Original method (unmodified)
  public getAllMixturesAdmin(): Observable<ResponseProductDTO[]> {
    return this.http.get<ResponseProductDTO[]>(`${this.apiUrl}/all-mixtures`);
  }
}
