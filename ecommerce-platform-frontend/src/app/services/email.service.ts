import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmailDTO } from '../dto/email/email-dto';
import { EmailGetOrDeleteEvent } from '../dto/email/email-get-or-delete-event';
import { LocaleMapperService } from './locale-mapper.service';
import { EmailSendDTO } from '../dto/email/email-send-dto';
import { ResponseEmailLogDTO } from '../dto/email/response-email-log-dto';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private adminBaseUrl = '/api/emails/v1/admin';
  private baseUrl = '/api/emails/v1';

  constructor(
    private http: HttpClient,
    private localeMapperService: LocaleMapperService,
  ) {}

  getEmail(request: EmailGetOrDeleteEvent): Observable<any> {
    return this.http.post<any>(`${this.adminBaseUrl}/get`, request);
  }

  createOrUpdateEmail(emailDTO: EmailDTO): Observable<void> {
    return this.http.post<void>(`${this.adminBaseUrl}/save`, emailDTO);
  }

  sendEmail(emailSendDTO: EmailSendDTO): Observable<void> {
    return this.http.post<void>(`${this.adminBaseUrl}/send`, emailSendDTO);
  }

  // Admin endpoint for create/update
  createOrUpdateEmailAdmin(emailDTO: EmailDTO): Observable<void> {
    return this.http.post<void>(`${this.adminBaseUrl}/save`, emailDTO);
  }

  // Get all email logs
  getAllEmailLogs(): Observable<ResponseEmailLogDTO[]> {
    return this.http.get<ResponseEmailLogDTO[]>(`${this.adminBaseUrl}`);
  }

  // Quick resend (same as original)
  quickResend(log: ResponseEmailLogDTO): Observable<void> {
    const emailSendDTO: EmailSendDTO = {
      emailType: log.emailType,
      subject: log.subject,
      body: log.body,
      recipients: [log.recipient],
      language: log.language
    };
    return this.sendEmail(emailSendDTO);
  }

  // Resend email with adjustments
  resendEmail(log: ResponseEmailLogDTO, subject: string, body: string, language: string): Observable<void> {
    const emailSendDTO: EmailSendDTO = {
      emailType: log.emailType,
      subject: subject,
      body: body,
      recipients: [log.recipient],
      language: language
    };
    return this.sendEmail(emailSendDTO);
  }
}
