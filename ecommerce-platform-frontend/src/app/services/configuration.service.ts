import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseLocaleDto } from '../dto/configuration/response-locale-dto';
import { RequestAppSettingsDto } from '../dto/configuration/request-app-settings-dto';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  private apiUrl = 'http://localhost:8080/api/configuration/v1';
  private apiAdminUrl = 'http://localhost:8080/api/configuration/v1/admin';

  constructor(private http: HttpClient) {}

  // --- READ ---
  getAvailableLocales(): Observable<ResponseLocaleDto[]> {
    return this.http.get<ResponseLocaleDto[]>(`${this.apiAdminUrl}/available-locales`);
  }

  getInUseLocales(): Observable<ResponseLocaleDto[]> {
    return this.http.get<ResponseLocaleDto[]>(`${this.apiAdminUrl}/in-use-locales`);
  }

  getLastAppSettings(): Observable<RequestAppSettingsDto> {
    return this.http.get<RequestAppSettingsDto>(`${this.apiAdminUrl}`);
  }

  // --- CREATE ---
  saveConfiguration(payload: RequestAppSettingsDto): Observable<void> {
    return this.http.post<void>(`${this.apiAdminUrl}`, payload);
  }

  createAppSettings(payload: RequestAppSettingsDto): Observable<void> {
    return this.saveConfiguration(payload);
  }

  // --- UPDATE ---
  updateConfiguration(id: number, payload: RequestAppSettingsDto): Observable<void> {
    return this.http.put<void>(`${this.apiAdminUrl}/${id}`, payload);
  }

  updateAppSettings(id: number, payload: RequestAppSettingsDto): Observable<void> {
    return this.updateConfiguration(id, payload);
  }

  // --- DELETE ---
  deleteConfiguration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiAdminUrl}/${id}`);
  }
}
