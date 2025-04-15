import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/api/catalog/v1/all-categories';

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
