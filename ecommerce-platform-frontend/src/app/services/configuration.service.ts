import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseLocaleDto} from '../dto/configuration/response-locale-dto';
import {RequestAppSettingsDto} from '../dto/configuration/request-app-settings-dto';
import {AuthService} from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  private apiUrl = 'http://localhost:8080/api/configuration/v1';
  private apiAdminUrl = 'http://localhost:8080/api/configuration/v1/admin';
  private token: string;

  constructor(private http: HttpClient,
              private authService: AuthService) {
  }

  // --- READ ---
  getAvailableLocales(): Observable<ResponseLocaleDto[]> {
    return this.http.get<ResponseLocaleDto[]>(`${this.apiAdminUrl}/available-locales`,
      {headers: {'Authorization': `Bearer ${this.authService.token}`}});
  }
  getInUseLocales(): Observable<ResponseLocaleDto[]> {
    return this.http.get<ResponseLocaleDto[]>(`${this.apiUrl}/in-use-locales`);
  }

  getLastAppSettings(): Observable<RequestAppSettingsDto> {
    return this.http.get<RequestAppSettingsDto>(`${this.apiUrl}`);
  }

  // --- CREATE ---
  saveConfiguration(payload: RequestAppSettingsDto): Observable<void> {
    return this.http.post<void>(`${this.apiAdminUrl}`, payload,
      {headers: {'Authorization': `Bearer ${this.authService.token}`}});
  }

  createAppSettings(payload: RequestAppSettingsDto): Observable<void> {
    return this.saveConfiguration(payload);
  }

  // --- UPDATE ---
  updateConfiguration(id: number, payload: RequestAppSettingsDto): Observable<void> {
    return this.http.put<void>(`${this.apiAdminUrl}/${id}`, payload,
      {headers: {'Authorization': `Bearer ${this.authService.token}`}});
  }

  updateAppSettings(id: number, payload: RequestAppSettingsDto): Observable<void> {
    return this.updateConfiguration(id, payload);
  }

  // --- DELETE ---
  deleteConfiguration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiAdminUrl}/${id}`,
      {headers: {'Authorization': `Bearer ${this.authService.token}`}});
  }
}
