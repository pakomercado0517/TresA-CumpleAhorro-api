import { Request, Response } from "express";

import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  changeAvatarUrl
} from "../services/user.service";
import {
  UpdateUserDto,
  ChangePasswordDto,
  ChangeAvatarDto,
  GetUserProfileResponse,
  UpdateUserProfileResponse,
  ChangePasswordResponse,
  ChangeAvatarResponse
} from "../types/user.types";

/**
 * Controller para obtener el perfil del usuario autenticado
 * GET /api/users/me
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const user = await getUserProfile(userId);

    const response: GetUserProfileResponse = {
      message: "Perfil obtenido exitosamente",
      user
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al obtener perfil:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para actualizar el perfil del usuario (nombre y/o email)
 * PUT /api/users/me
 */
export const updateProfile = async (
  req: Request<unknown, unknown, UpdateUserDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const updateData: UpdateUserDto = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await updateUserProfile(userId, updateData);

    const response: UpdateUserProfileResponse = {
      message: "Perfil actualizado exitosamente",
      user
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotFoundError") {
        res.status(404).json({
          error: error.message
        });
        return;
      }
      if (error.name === "ConflictError") {
        res.status(409).json({
          error: error.message
        });
        return;
      }
    }

    console.error("Error al actualizar perfil:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para cambiar la contraseña del usuario
 * PUT /api/users/me/password
 */
export const changeUserPassword = async (
  req: Request<unknown, unknown, ChangePasswordDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const passwordData: ChangePasswordDto = {
      oldPassword: req.body.oldPassword,
      newPassword: req.body.newPassword
    };

    await changePassword(userId, passwordData);

    const response: ChangePasswordResponse = {
      message: "Contraseña actualizada exitosamente"
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotFoundError") {
        res.status(404).json({
          error: error.message
        });
        return;
      }
      if (error.name === "UnauthorizedError") {
        res.status(401).json({
          error: error.message
        });
        return;
      }
      if (error.name === "ValidationError") {
        res.status(400).json({
          error: error.message
        });
        return;
      }
    }

    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para cambiar la URL del avatar del usuario
 * PUT /api/users/me/avatar
 */
export const changeUserAvatar = async (
  req: Request<unknown, unknown, ChangeAvatarDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const avatarData: ChangeAvatarDto = {
      avatarUrl: req.body.avatarUrl
    };

    const user = await changeAvatarUrl(userId, avatarData);

    const response: ChangeAvatarResponse = {
      message: "Avatar actualizado exitosamente",
      user
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al cambiar avatar:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

