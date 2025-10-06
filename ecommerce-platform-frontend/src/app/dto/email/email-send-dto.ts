export interface EmailSendDTO {
  emailType: string;
  subject: string;
  body: string;
  recipients: string[];
  language: string;
  customerIds?: string[];
}
