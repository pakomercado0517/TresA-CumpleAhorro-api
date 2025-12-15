import { Request, Response } from "express";

import {
  createUser,
  authenticateUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword
} from "../services/auth.service";
import {
  RegisterUserDto,
  LoginUserDto,
  ForgotPasswordDto,
  ResetPasswordDto
} from "../types/auth.types";

/**
 * Controller para registrar un nuevo usuario
 */
export const register = async (
  req: Request<unknown, unknown, RegisterUserDto>,
  res: Response
): Promise<void> => {
  try {
    const userData: RegisterUserDto = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };

    const { user, token } = await createUser(userData);

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user,
      token
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ConflictError") {
      res.status(409).json({
        error: error.message
      });
      return;
    }

    console.error("Error en registro:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para autenticar un usuario
 */
export const login = async (
  req: Request<unknown, unknown, LoginUserDto>,
  res: Response
): Promise<void> => {
  try {
    const loginData: LoginUserDto = {
      email: req.body.email,
      password: req.body.password
    };

    const { user, token } = await authenticateUser(loginData);

    res.status(200).json({
      message: "Login exitoso",
      user,
      token
    });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      res.status(401).json({
        error: error.message
      });
      return;
    }

    console.error("Error en login:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para verificar email de un usuario
 */
export const verifyEmailController = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).json({
        error: "Token de verificación es requerido"
      });
      return;
    }

    const result = await verifyEmail(token);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        res.status(400).json({
          error: "Token de verificación expirado"
        });
        return;
      }
      if (error.name === "InvalidTokenError" || error.name === "InvalidTokenTypeError") {
        res.status(400).json({
          error: "Token de verificación inválido"
        });
        return;
      }
      if (error.name === "NotFoundError") {
        res.status(404).json({
          error: error.message
        });
        return;
      }
    }

    console.error("Error en verificación de email:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para solicitar reset de contraseña
 */
export const forgotPassword = async (
  req: Request<unknown, unknown, ForgotPasswordDto>,
  res: Response
): Promise<void> => {
  try {
    const emailData: ForgotPasswordDto = {
      email: req.body.email
    };

    const result = await requestPasswordReset(emailData);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error en forgot password:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para resetear contraseña
 */
export const resetPasswordController = async (
  req: Request<unknown, unknown, ResetPasswordDto>,
  res: Response
): Promise<void> => {
  try {
    const resetData: ResetPasswordDto = {
      token: req.body.token,
      password: req.body.password
    };

    const result = await resetPassword(resetData);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        res.status(400).json({
          error: "Token de reset expirado. Por favor solicita uno nuevo"
        });
        return;
      }
      if (error.name === "InvalidTokenError" || error.name === "InvalidTokenTypeError") {
        res.status(400).json({
          error: "Token de reset inválido"
        });
        return;
      }
      if (error.name === "NotFoundError") {
        res.status(404).json({
          error: error.message
        });
        return;
      }
    }

    console.error("Error en reset password:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

