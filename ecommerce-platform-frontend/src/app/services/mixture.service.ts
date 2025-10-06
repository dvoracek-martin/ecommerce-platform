import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseProductDTO} from '../dto/product/response-product-dto';
import {ResponseMixtureDTO} from "../dto/mixtures/response-mixture-dto";
import {CreateMixtureDTO} from '../dto/mixtures/create-mixture-dto';

// A DTO for the request to create a new mixture
export interface CreateMixtureRequest {
  name: string;
  productIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class MixtureService {

  private apiUrl = '/api/catalog/v1/mixtures';
  private adminApiUrl: '/api/catalog/v1/admin/mixtures';

  constructor(private http: HttpClient) {
  }

  // New method to create a mixture on the backend
  public createMixture(request: CreateMixtureRequest): Observable<ResponseMixtureDTO> {
    return this.http.post<ResponseMixtureDTO>(this.adminApiUrl, request);
  }

  // New method to retrieve mixture details by ID
  public getMixtureById(id: number): Observable<ResponseMixtureDTO> {
    return this.http.get<ResponseMixtureDTO>(`${this.apiUrl}/${id}`);
  }

  // Original method (unmodified)
  public getAllMixturesAdmin(): Observable<ResponseProductDTO[]> {
    return this.http.get<ResponseProductDTO[]>(`${this.adminApiUrl}/all-mixtures`);
  }

  saveMixture(mixtures: CreateMixtureDTO): Observable<ResponseMixtureDTO> {
    console.log('Saving mixture:', mixtures);
    return this.http.post<ResponseMixtureDTO>(
      `${this.apiUrl}`,
      mixtures // Send the array directly, not wrapped in an object
    );
  }

  getLocalizedName(mixture: ResponseMixtureDTO) {
    return '';
  }

  getLocalizedDescription(mixture: ResponseMixtureDTO) {
    return '';
  }

  getLocalizedUrl(mixture: ResponseMixtureDTO) {
    return '';
  }
}
