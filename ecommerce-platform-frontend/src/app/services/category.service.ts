import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CreateCategoryDTO} from '../dto/category/create-category-dto';
import {ResponseCategoryDTO} from '../dto/category/response-category-dto';
import {UpdateCategoryDTO} from '../dto/category/update-category-dto';
import {TranslateService} from '@ngx-translate/core';
import {LocaleMapperService} from './locale-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/api/catalog/v1';
  private apiAdminUrl = 'http://localhost:8080/api/catalog/v1/admin';

  constructor(private http: HttpClient,
              private localeMapperService: LocaleMapperService,
              ) {
  }

  // Public endpoints
  getAllCategoriesAdmin(): Observable<ResponseCategoryDTO[]> {
    return this.http.get<ResponseCategoryDTO[]>(`${this.apiAdminUrl}/all-categories`);
  }

  getActiveCategories(): Observable<ResponseCategoryDTO[]> {
    return this.http.get<ResponseCategoryDTO[]>(`${this.apiUrl}/active-categories`);
  }

  getActiveCategoriesForMixing(): Observable<ResponseCategoryDTO[]> {
    return this.http.get<ResponseCategoryDTO[]>(`${this.apiUrl}/active-categories-for-mixing`);
  }

  // Admin endpoints
  getCategoryById(id: number): Observable<ResponseCategoryDTO> {
    return this.http.get<ResponseCategoryDTO>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(createCategoryDTO: CreateCategoryDTO): Observable<ResponseCategoryDTO> {
    return this.http.post<ResponseCategoryDTO>(
      `${this.apiAdminUrl}/categories`,
      createCategoryDTO
    );
  }

  updateCategory(updateCategoryDTO: UpdateCategoryDTO): Observable<ResponseCategoryDTO> {
    return this.http.put<ResponseCategoryDTO>(
      `${this.apiAdminUrl}/categories/${updateCategoryDTO.id}`,
      updateCategoryDTO
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiAdminUrl}/categories/${id}`);
  }

  getLocalizedName(responseCategoryDTO: ResponseCategoryDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = responseCategoryDTO.localizedFields?.[locale];
    return field?.name || '';
  }


  getLocalizedDescription(responseCategoryDTO: ResponseCategoryDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = responseCategoryDTO.localizedFields?.[locale];
    return field?.description || '';
  }

  getLocalizedUrl(responseCategoryDTO: ResponseCategoryDTO) {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = responseCategoryDTO.localizedFields?.[locale];
    return field?.url || '';
  }
}
