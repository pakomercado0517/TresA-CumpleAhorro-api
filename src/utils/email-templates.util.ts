import { EmailTemplateData } from "../types/email.types";
import { env } from "../config/env.config";

/**
 * Genera el template HTML para confirmación de cuenta
 */
export const getAccountConfirmationTemplate = (data: EmailTemplateData): string => {
  const { userName = "Usuario", url = "#" } = data;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirma tu cuenta - Tanda Cumpleañera</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #4a90e2; text-align: center; margin-bottom: 30px;">
          ¡Bienvenido a Tanda Cumpleañera!
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hola <strong>${userName}</strong>,
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Gracias por registrarte en Tanda Cumpleañera. Para completar tu registro y activar tu cuenta, 
          por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" 
             style="background-color: #4a90e2; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; 
                    font-size: 16px; font-weight: bold;">
            Confirmar mi cuenta
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
        </p>
        <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
          ${url}
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Este enlace expirará en 24 horas por seguridad.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Si no creaste esta cuenta, puedes ignorar este correo.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Tanda Cumpleañera. Todos los derechos reservados.
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera el template HTML para reset de contraseña
 */
export const getPasswordResetTemplate = (data: EmailTemplateData): string => {
  const { userName = "Usuario", url = "#", expirationTime = "1 hora" } = data;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecer contraseña - Tanda Cumpleañera</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #4a90e2; text-align: center; margin-bottom: 30px;">
          Restablecer contraseña
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hola <strong>${userName}</strong>,
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en Tanda Cumpleañera. 
          Si fuiste tú quien hizo esta solicitud, haz clic en el siguiente botón para crear una nueva contraseña:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" 
             style="background-color: #4a90e2; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; 
                    font-size: 16px; font-weight: bold;">
            Restablecer contraseña
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
        </p>
        <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
          ${url}
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Este enlace expirará en <strong>${expirationTime}</strong> por seguridad.
        </p>
        
        <p style="font-size: 14px; color: #d32f2f; margin-top: 20px; padding: 15px; background-color: #ffebee; border-radius: 5px;">
          <strong>⚠️ Importante:</strong> Si no solicitaste restablecer tu contraseña, ignora este correo. 
          Tu contraseña actual seguirá siendo válida.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Tanda Cumpleañera. Todos los derechos reservados.
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera el template HTML para notificaciones generales
 */
export const getNotificationTemplate = (
  title: string,
  message: string,
  userName?: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Tanda Cumpleañera</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #4a90e2; text-align: center; margin-bottom: 30px;">
          ${title}
        </h1>
        
        ${userName ? `<p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${userName}</strong>,</p>` : ""}
        
        <div style="font-size: 16px; margin-bottom: 20px;">
          ${message}
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Tanda Cumpleañera. Todos los derechos reservados.
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera la versión de texto plano del email (para clientes que no soportan HTML)
 */
export const getPlainTextVersion = (html: string): string => {
  // Remover etiquetas HTML básicas
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
};

