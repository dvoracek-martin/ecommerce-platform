export interface ResponseEmailLogDTO {
  id: number;
  emailType: string;
  recipient: string;
  sentAt: string;
  body: string;
  subject: string;
  language: string;
}
