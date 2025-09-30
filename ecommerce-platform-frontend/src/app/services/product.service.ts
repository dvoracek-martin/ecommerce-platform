import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseProductDTO} from '../dto/product/response-product-dto';
import {CreateProductDTO} from '../dto/product/create-product-dto';
import {UpdateProductDTO} from '../dto/product/update-product-dto';
import {LocaleMapperService} from './locale-mapper.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/catalog/v1'; // Adjust your API endpoint
  private apiAdminUrl = 'http://localhost:8080/api/catalog/v1/admin';

  constructor(private http: HttpClient,
              private localeMapperService: LocaleMapperService,
  ) {
  }

  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }

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

  createProduct(createProductDTO: CreateProductDTO): Observable<ResponseProductDTO> {
    return this.http.post<ResponseProductDTO>(`${this.apiAdminUrl}/products`, createProductDTO);
  }

  updateProduct( updateProductDTO: UpdateProductDTO): Observable<ResponseProductDTO> {
    return this.http.put<ResponseProductDTO>(`${this.apiAdminUrl}/products/${updateProductDTO.id}`, updateProductDTO);
  }

  deleteProductMedia(productId: number, objectKey: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${productId}/media`,
      {params: {objectKey}}
    );
  }

  getActiveProductsForMixingByCategoryId(id: number) {
    return this.http.get<ResponseProductDTO[]>(`${this.apiUrl}/active-products-for-mixing-by-category-id/${id}`);
  }

  getActiveProductsForDisplayInProducts() {
    return this.http.get<ResponseProductDTO[]>(`${this.apiUrl}/active-products-for-display-in-products`);
  }

  getLocalizedName(product: ResponseProductDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = product.localizedFields?.[locale];
    return field?.name || '';
  }

  getLocalizedDescription(product: ResponseProductDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = product.localizedFields?.[locale];
    return field?.description || '';
  }

  getLocalizedUrl(product: ResponseProductDTO): string {
    const locale = this.localeMapperService.getCurrentLocale();
    const field = product.localizedFields?.[locale];
    return field?.url || '';
  }
}
