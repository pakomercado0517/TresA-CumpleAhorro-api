import { env } from "../config/env.config";
import {
  getAccountConfirmationTemplate,
  getPasswordResetTemplate,
  getNotificationTemplate,
  getPlainTextVersion
} from "../utils/email-templates.util";

import { sendEmail } from "./email.service";

/**
 * Envía un email de confirmación de cuenta
 * @param userEmail - Email del usuario
 * @param userName - Nombre del usuario
 * @param confirmationToken - Token de confirmación
 * @returns Resultado del envío
 */
export const sendAccountConfirmationEmail = async (
  userEmail: string,
  userName: string,
  confirmationToken: string
): Promise<{ success: boolean; error?: string }> => {
  // Construir URL de confirmación
  const confirmationUrl = `${env.FRONTEND_URL}/verify-email?token=${confirmationToken}`;

  const html = getAccountConfirmationTemplate({
    userName,
    url: confirmationUrl
  });

  const result = await sendEmail({
    to: userEmail,
    subject: "Confirma tu cuenta - Tanda Cumpleañera",
    html,
    text: getPlainTextVersion(html)
  });

  return result;
};

/**
 * Envía un email de reset de contraseña
 * @param userEmail - Email del usuario
 * @param userName - Nombre del usuario
 * @param resetToken - Token de reset
 * @param expirationHours - Horas hasta que expire el token (default: 1)
 * @returns Resultado del envío
 */
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string,
  expirationHours: number = 1
): Promise<{ success: boolean; error?: string }> => {
  // Construir URL de reset
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const expirationTime = expirationHours === 1 ? "1 hora" : `${expirationHours} horas`;

  const html = getPasswordResetTemplate({
    userName,
    url: resetUrl,
    expirationTime
  });

  const result = await sendEmail({
    to: userEmail,
    subject: "Restablecer contraseña - Tanda Cumpleañera",
    html,
    text: getPlainTextVersion(html)
  });

  return result;
};

/**
 * Envía un email de notificación general
 * @param userEmail - Email del usuario
 * @param title - Título de la notificación
 * @param message - Mensaje (puede incluir HTML)
 * @param userName - Nombre del usuario (opcional)
 * @returns Resultado del envío
 */
export const sendNotificationEmail = async (
  userEmail: string,
  title: string,
  message: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> => {
  const html = getNotificationTemplate(title, message, userName);

  const result = await sendEmail({
    to: userEmail,
    subject: `${title} - Tanda Cumpleañera`,
    html,
    text: getPlainTextVersion(html)
  });

  return result;
};
