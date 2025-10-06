export interface EmailResendDTO {
  logId: number;
  subject: string;
  body: string;
  language: string;
  recipient: string;
}
