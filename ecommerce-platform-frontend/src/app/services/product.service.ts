import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseProductDTO } from '../dto/product/response-product-dto';
import { CreateProductDTO } from '../dto/product/create-product-dto';
import { UpdateProductDTO } from '../dto/product/update-product-dto';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/catalog/v1'; // Adjust your API endpoint
  private apiAdminUrl = 'http://localhost:8080/api/catalog/v1/admin';

  constructor(private http: HttpClient) {}

  getAllProductsAdmin(): Observable<ResponseProductDTO[]> {
    return this.http.get<ResponseProductDTO[]>(`${this.apiAdminUrl}/all-products`);
  }

  getAllProducts(): Observable<ResponseProductDTO[]> {
    return this.http.get<ResponseProductDTO[]>(`${this.apiUrl}/all-products`);
  }

  getActiveProductsByCategoryId(id: number): Observable<ResponseProductDTO[]> {
    return this.http.get<ResponseProductDTO[]>(`${this.apiUrl}/active-products-by-category-id/${id}`);
  }

  getProductById(id: number): Observable<ResponseProductDTO> {
    return this.http.get<ResponseProductDTO>(`${this.apiUrl}/products/${id}`);
  }
  getProductByIdAdmin(id: number): Observable<ResponseProductDTO> {
    return this.http.get<ResponseProductDTO>(`${this.apiAdminUrl}/products/${id}`);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiAdminUrl}/products/${id}`);
  }

  createProduct(createProductDTO: CreateProductDTO[]): Observable<ResponseProductDTO[]> {
    console.log('product: ' + JSON.stringify(createProductDTO));
    return this.http.post<ResponseProductDTO[]>(`${this.apiAdminUrl}/products`, createProductDTO);
  }

  updateProduct(id: number, updateProductDTO: UpdateProductDTO): Observable<ResponseProductDTO> {
    console.log('update product: ' + JSON.stringify(updateProductDTO));
    return this.http.put<ResponseProductDTO>(`${this.apiAdminUrl}/products/${id}`, updateProductDTO);
  }

  deleteProductMedia(productId: number, objectKey: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${productId}/media`,
      { params: { objectKey } }
    );
  }
}
