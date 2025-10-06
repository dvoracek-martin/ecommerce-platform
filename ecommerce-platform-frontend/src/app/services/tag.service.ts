import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CreateTagDTO} from '../dto/tag/create-tag-dto';
import {ResponseTagDTO} from '../dto/tag/response-tag-dto';
import {UpdateTagDTO} from '../dto/tag/update-tag-dto';
import {ResponseCategoryDTO} from '../dto/category/response-category-dto';
import {ResponseProductDTO} from '../dto/product/response-product-dto';
import {ResponseMixtureDTO} from '../dto/mixtures/response-mixture-dto';
import {LocaleMapperService} from './locale-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiAdminUrl = '/api/catalog/v1/admin/';
  private apiUrl = '/api/catalog/v1/';

  constructor(private http: HttpClient,
              private localeMapperService: LocaleMapperService) {
  }

  // --- Tag CRUD ---
  createTag(tags: CreateTagDTO): Observable<ResponseTagDTO> {
    return this.http.post<ResponseTagDTO>(
      `${this.apiAdminUrl}tags`,
      tags
    );
  }

  getAllTags(): Observable<ResponseTagDTO[]> {
    return this.http.get<ResponseTagDTO[]>(`${this.apiUrl}all-tags`);
  }

  getTagById(id: number): Observable<ResponseTagDTO> {
    return this.http.get<ResponseTagDTO>(`${this.apiUrl}tags/${id}`);
  }

  updateTag(tag: UpdateTagDTO): Observable<ResponseTagDTO> {
    return this.http.put<ResponseTagDTO>(
      `${this.apiAdminUrl}tags/${tag.id}`,
      tag
    );
  }

  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiAdminUrl}tags/${id}`);
  }

  // --- Relation lookups for create/update forms ---
  getAllCategories(): Observable<ResponseCategoryDTO[]> {
    return this.http.get<ResponseCategoryDTO[]>(`${this.apiAdminUrl}all-categories`);
  }

  getAllProducts(): Observable<ResponseProductDTO[]> {
    return this.http.get<ResponseProductDTO[]>(`${this.apiAdminUrl}all-products`);
  }

  getAllMixtures(): Observable<ResponseMixtureDTO[]> {
    return this.http.get<ResponseMixtureDTO[]>(`${this.apiAdminUrl}all-mixtures`);
  }

  getLocalizedName(tag: ResponseTagDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = tag.localizedFields?.[locale];
    return field?.name || '';
  }

  getLocalizedDescription(tag: ResponseTagDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = tag.localizedFields?.[locale];
    return field?.description || '';
  }

  getLocalizedUrl(tag: ResponseTagDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = tag.localizedFields?.[locale];
    return field?.url || '';
  }
}
