import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCategoryDTO } from '../dto/category/create-category-dto';
import { ResponseCategoryDTO } from '../dto/category/response-category-dto';
import { UpdateCategoryDTO } from '../dto/category/update-category-dto';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/api/catalog/v1/';
  private apiAdminUrl = 'http://localhost:8080/api/catalog/v1/admin/';

  constructor(private http: HttpClient) { }

  // Public endpoints
  getAllCategories(): Observable<ResponseCategoryDTO[]> {
    return this.http.get<ResponseCategoryDTO[]>(`${this.apiUrl}all-categories`);
  }

  // Admin endpoints
  getCategoryById(id: number): Observable<ResponseCategoryDTO> {
    return this.http.get<ResponseCategoryDTO>(`${this.apiAdminUrl}categories/${id}`);
  }

  createCategories(categories: CreateCategoryDTO[]): Observable<ResponseCategoryDTO[]> {
    return this.http.post<ResponseCategoryDTO[]>(
      `${this.apiAdminUrl}categories`,
      categories
    );
  }

  updateCategory(category: UpdateCategoryDTO): Observable<ResponseCategoryDTO> {
    return this.http.put<ResponseCategoryDTO>(
      `${this.apiAdminUrl}categories/${category.id}`,
      category
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiAdminUrl}categories/${id}`);
  }

  // Add if you need partial updates
  patchCategory(id: number, updates: Partial<UpdateCategoryDTO>): Observable<ResponseCategoryDTO> {
    return this.http.patch<ResponseCategoryDTO>(
      `${this.apiAdminUrl}categories/${id}`,
      updates
    );
  }
}
