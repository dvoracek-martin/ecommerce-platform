import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SearchResultDTO} from '../dto/search/search-result-dto';

@Injectable({providedIn: 'root'})
export class SearchService {
  constructor(private http: HttpClient) {
  }

  private apiUrl = 'http://localhost:8080/api/catalog/v1/';

  search(q: string): Observable<SearchResultDTO> {
    return this.http.get<SearchResultDTO>(`${this.apiUrl}search`, {params: {q}});
  }
}
