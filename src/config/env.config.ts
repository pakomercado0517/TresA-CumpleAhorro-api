import { config } from "dotenv";

// Cargar variables de entorno al inicio
config();

/**
 * Valida que las variables de entorno requeridas estén definidas
 */
export const validateEnv = (): void => {
  const requiredVars = ["DATABASE_URL", "JWT_SECRET"];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Las siguientes variables de entorno son requeridas pero no están definidas: ${missingVars.join(", ")}`
    );
  }
};

/**
 * Variables de entorno tipadas
 */
export const env = {
  // Servidor
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.PORT ?? "3001",

  // Base de datos
  DATABASE_URL: process.env.DATABASE_URL ?? "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL ?? "*",

  // Email Providers
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? "gmail", // 'gmail' | 'brevo' | 'resend'
  FROM_EMAIL: process.env.FROM_EMAIL ?? "noreply@tanda-cumpleanera.com",

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",

  // Gmail SMTP
  GMAIL_USER: process.env.GMAIL_USER ?? "",
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ?? "",

  // Brevo (Sendinblue)
  BREVO_API_KEY: process.env.BREVO_API_KEY ?? ""
};

// Validar variables requeridas al cargar el módulo
validateEnv();

