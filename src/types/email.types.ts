/**
 * Tipos para el servicio de email
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  token?: string;
  url?: string;
  expirationTime?: string;
}
