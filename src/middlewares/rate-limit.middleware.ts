import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

import { env } from "../config/env.config";

/**
 * Rate limiting solo para producción
 * En desarrollo no se aplica para facilitar el testing
 */
const shouldApplyRateLimit = (): boolean => {
  return env.NODE_ENV === "production";
};

/**
 * Rate limiter para endpoints de autenticación
 * 5 intentos por 15 minutos por IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: {
    error: "Demasiados intentos. Por favor intenta de nuevo en 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !shouldApplyRateLimit() // Solo aplicar en producción
});

/**
 * Rate limiter general para la API
 * 100 requests por 15 minutos por IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    error: "Demasiadas peticiones. Por favor intenta de nuevo más tarde."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !shouldApplyRateLimit() // Solo aplicar en producción
});

/**
 * Middleware condicional de rate limiting
 * Solo aplica rate limiting si estamos en producción
 */
export const conditionalRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (shouldApplyRateLimit()) {
    // En producción, usar el rate limiter
    authRateLimiter(req, res, next);
    return;
  }
  // En desarrollo, continuar sin limitar
  next();
};

