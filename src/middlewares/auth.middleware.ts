import { Request, Response, NextFunction } from "express";

import { verifyToken, extractTokenFromHeader, JwtPayload } from "../utils/jwt.util";

// Extender el tipo Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware de autenticación JWT
 * Verifica que el request tenga un token JWT válido
 * Agrega el payload del token a req.user
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: "Token de autenticación requerido"
      });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        res.status(401).json({
          error: "Token expirado"
        });
        return;
      }
      if (error.name === "InvalidTokenError") {
        res.status(401).json({
          error: "Token inválido"
        });
        return;
      }
    }

    res.status(401).json({
      error: "Error de autenticación"
    });
  }
};
