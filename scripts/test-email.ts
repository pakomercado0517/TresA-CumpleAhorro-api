import { config } from "dotenv";
import { sendEmail } from "../src/services/email.service";
import { isEmailConfigured, getCurrentEmailProvider } from "../src/services/email.service";

// Cargar variables de entorno
config();

/**
 * Script para probar el servicio de email
 */
async function testEmail(): Promise<void> {
  console.log("🧪 Probando servicio de email...\n");

  // Verificar configuración
  if (!isEmailConfigured()) {
    console.error("❌ El servicio de email no está configurado correctamente.");
    console.error("   Verifica las variables de entorno en tu archivo .env");
    process.exit(1);
  }

  const provider = getCurrentEmailProvider();
  console.log(`✅ Proveedor configurado: ${provider.toUpperCase()}\n`);

  // Solicitar email de destino
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.error("❌ Debes proporcionar un email de destino");
    console.error("   Uso: pnpm test:email tu-email@example.com");
    process.exit(1);
  }

  // Validar formato de email básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testEmail)) {
    console.error("❌ El email proporcionado no tiene un formato válido");
    process.exit(1);
  }

  console.log(`📧 Enviando email de prueba a: ${testEmail}\n`);

  // Enviar email de prueba
  const result = await sendEmail({
    to: testEmail,
    subject: "🧪 Email de Prueba - Tanda Cumpleañera",
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email de Prueba</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #4a90e2; text-align: center; margin-bottom: 30px;">
            ✅ Email de Prueba Exitoso
          </h1>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            ¡Hola!
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Si estás recibiendo este email, significa que el servicio de email está funcionando correctamente con <strong>${provider.toUpperCase()}</strong>.
          </p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #1976d2;">
              <strong>Información del envío:</strong><br>
              Proveedor: ${provider.toUpperCase()}<br>
              Fecha: ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Este es un email de prueba automático del sistema Tanda Cumpleañera.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} Tanda Cumpleañera. Todos los derechos reservados.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `Email de Prueba - Tanda Cumpleañera\n\nSi estás recibiendo este email, significa que el servicio de email está funcionando correctamente con ${provider.toUpperCase()}.\n\nFecha: ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`
  });

  // Mostrar resultado
  if (result.success) {
    console.log("✅ Email enviado exitosamente!");
    console.log(`   Message ID: ${result.messageId || "N/A"}\n`);
    console.log("📬 Revisa la bandeja de entrada (y spam) del email:", testEmail);
  } else {
    console.error("❌ Error al enviar email:");
    console.error(`   ${result.error}\n`);
    process.exit(1);
  }
}

// Ejecutar prueba
testEmail().catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});

