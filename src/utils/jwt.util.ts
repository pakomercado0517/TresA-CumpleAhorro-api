import jwt, { SignOptions, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

import { env } from "../config/env.config";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

export interface JwtPayload {
  userId: number;
  email: string;
}

/**
 * Genera un token JWT para un usuario
 * @param payload - Datos del usuario a incluir en el token
 * @returns Token JWT
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as SignOptions);
};

/**
 * Verifica y decodifica un token JWT
 * @param token - Token JWT a verificar
 * @returns Payload decodificado del token
 * @throws Error si el token es inválido o ha expirado
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      const expiredError = new Error("Token expirado");
      expiredError.name = "TokenExpiredError";
      throw expiredError;
    }
    if (error instanceof JsonWebTokenError) {
      const invalidError = new Error("Token inválido");
      invalidError.name = "InvalidTokenError";
      throw invalidError;
    }
    throw error;
  }
};

/**
 * Extrae el token del header Authorization
 * @param authHeader - Header Authorization (formato: "Bearer <token>")
 * @returns Token extraído o null si no es válido
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Genera un token de verificación de email (expira en 24 horas)
 * @param userId - ID del usuario
 * @param email - Email del usuario
 * @returns Token JWT para verificación de email
 */
export const generateEmailVerificationToken = (userId: number, email: string): string => {
  return jwt.sign({ userId, email, type: "email-verification" }, JWT_SECRET, {
    expiresIn: "24h"
  } as SignOptions);
};

/**
 * Genera un token de reset de contraseña (expira en 1 hora)
 * @param userId - ID del usuario
 * @param email - Email del usuario
 * @returns Token JWT para reset de contraseña
 */
export const generatePasswordResetToken = (userId: number, email: string): string => {
  return jwt.sign({ userId, email, type: "password-reset" }, JWT_SECRET, {
    expiresIn: "1h"
  } as SignOptions);
};

/**
 * Verifica un token de verificación de email o reset de contraseña
 * @param token - Token a verificar
 * @param expectedType - Tipo esperado del token ('email-verification' | 'password-reset')
 * @returns Payload decodificado del token
 * @throws Error si el token es inválido, expirado o no es del tipo esperado
 */
export const verifySpecialToken = (
  token: string,
  expectedType: "email-verification" | "password-reset"
): JwtPayload & { type: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { type?: string };

    if (decoded.type !== expectedType) {
      const error = new Error(`Token no es del tipo esperado: ${expectedType}`);
      error.name = "InvalidTokenTypeError";
      throw error;
    }

    return decoded as JwtPayload & { type: string };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      const expiredError = new Error("Token expirado");
      expiredError.name = "TokenExpiredError";
      throw expiredError;
    }
    if (error instanceof JsonWebTokenError) {
      const invalidError = new Error("Token inválido");
      invalidError.name = "InvalidTokenError";
      throw invalidError;
    }
    throw error;
  }
};
