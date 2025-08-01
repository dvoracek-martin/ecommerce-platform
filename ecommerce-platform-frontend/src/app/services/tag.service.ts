import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTagDTO } from '../dto/tag/create-tag-dto';
import { ResponseTagDTO } from '../dto/tag/response-tag-dto';
import { UpdateTagDTO } from '../dto/tag/update-tag-dto';
import { ResponseCategoryDTO } from '../dto/category/response-category-dto';
import { ResponseProductDTO } from '../dto/product/response-product-dto';
import {ResponseMixtureDTO} from '../dto/mixtures/response-mixture-dto';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiAdminUrl = 'http://localhost:8080/api/catalog/v1/admin/';

  constructor(private http: HttpClient) { }

  // --- Tag CRUD ---
  createTags(tags: CreateTagDTO[]): Observable<ResponseTagDTO[]> {
    return this.http.post<ResponseTagDTO[]>(
      `${this.apiAdminUrl}tags`,
      tags
    );
  }

  getAllTags(): Observable<ResponseTagDTO[]> {
    return this.http.get<ResponseTagDTO[]>(`${this.apiAdminUrl}all-tags`);
  }

  getTagById(id: number): Observable<ResponseTagDTO> {
    return this.http.get<ResponseTagDTO>(`${this.apiAdminUrl}tags/${id}`);
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
}
