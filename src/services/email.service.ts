import nodemailer from "nodemailer";
import { Resend } from "resend";

import { env } from "../config/env.config";
import { EmailOptions, SendEmailResult } from "../types/email.types";

/**
 * Tipo de proveedor de email
 */
type EmailProvider = "gmail" | "brevo" | "resend";

/**
 * Obtiene el proveedor de email configurado
 */
const getEmailProvider = (): EmailProvider => {
  const provider = env.EMAIL_PROVIDER.toLowerCase() as EmailProvider;
  if (["gmail", "brevo", "resend"].includes(provider)) {
    return provider;
  }
  return "gmail"; // Default
};

/**
 * Envía email usando Gmail SMTP
 */
const sendEmailViaGmail = async (options: EmailOptions): Promise<SendEmailResult> => {
  try {
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      return {
        success: false,
        error: "GMAIL_USER y GMAIL_APP_PASSWORD deben estar configurados"
      };
    }

    // Crear transporter de Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD
      }
    });

    // Preparar destinatarios
    const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    // Enviar email
    const info = await transporter.sendMail({
      from: options.from || env.FROM_EMAIL,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error("Error al enviar email con Gmail:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
};

/**
 * Envía email usando Brevo (Sendinblue) API
 * Nota: Brevo requiere verificar un email individual (no dominio completo)
 */
const sendEmailViaBrevo = async (options: EmailOptions): Promise<SendEmailResult> => {
  try {
    if (!env.BREVO_API_KEY) {
      return {
        success: false,
        error: "BREVO_API_KEY no está configurado"
      };
    }

    // Brevo usa su API REST directamente
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          email: options.from || env.FROM_EMAIL,
          name: "Tanda Cumpleañera"
        },
        to: Array.isArray(options.to)
          ? options.to.map((email) => ({ email }))
          : [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text
      })
    });

    const data = (await response.json()) as { messageId?: string; message?: string };

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Error ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: true,
      messageId: data.messageId
    };
  } catch (error) {
    console.error("Error al enviar email con Brevo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
};

/**
 * Envía email usando Resend
 */
const sendEmailViaResend = async (options: EmailOptions): Promise<SendEmailResult> => {
  try {
    if (!env.RESEND_API_KEY) {
      return {
        success: false,
        error: "RESEND_API_KEY no está configurado"
      };
    }

    const resend = new Resend(env.RESEND_API_KEY);

    const to = Array.isArray(options.to) ? options.to : [options.to];

    const data = await resend.emails.send({
      from: options.from || env.FROM_EMAIL,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    if (data.error) {
      return {
        success: false,
        error: data.error.message || "Error desconocido al enviar email"
      };
    }

    return {
      success: true,
      messageId: data.data.id
    };
  } catch (error) {
    console.error("Error al enviar email con Resend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    };
  }
};

/**
 * Envía un email usando el proveedor configurado
 * @param options - Opciones del email (destinatario, asunto, contenido)
 * @returns Resultado del envío con success y messageId o error
 */
export const sendEmail = async (options: EmailOptions): Promise<SendEmailResult> => {
  const provider = getEmailProvider();

  switch (provider) {
    case "gmail":
      return sendEmailViaGmail(options);
    case "brevo":
      return sendEmailViaBrevo(options);
    case "resend":
      return sendEmailViaResend(options);
    default:
      return {
        success: false,
        error: `Proveedor de email no soportado: ${provider}`
      };
  }
};

/**
 * Verifica si el servicio de email está configurado correctamente
 * @returns true si el proveedor configurado tiene las credenciales necesarias
 */
export const isEmailConfigured = (): boolean => {
  const provider = getEmailProvider();

  switch (provider) {
    case "gmail":
      return Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
    case "brevo":
      return Boolean(env.BREVO_API_KEY);
    case "resend":
      return Boolean(env.RESEND_API_KEY);
    default:
      return false;
  }
};

/**
 * Obtiene el proveedor de email actualmente configurado
 */
export const getCurrentEmailProvider = (): EmailProvider => {
  return getEmailProvider();
};
