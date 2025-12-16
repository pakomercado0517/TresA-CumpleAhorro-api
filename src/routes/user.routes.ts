import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  getProfile,
  updateProfile,
  changeUserPassword,
  changeUserAvatar
} from "../controllers/user.controller";
import {
  validateUpdateProfile,
  validateChangePassword,
  validateChangeAvatar
} from "../validators/user.validator";

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get("/me", getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Actualizar perfil del usuario (nombre y/o email)
 * @access  Private
 */
router.put("/me", validateUpdateProfile, validate, updateProfile);

/**
 * @route   PUT /api/users/me/password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.put(
  "/me/password",
  validateChangePassword,
  validate,
  changeUserPassword
);

/**
 * @route   PUT /api/users/me/avatar
 * @desc    Cambiar URL del avatar del usuario
 * @access  Private
 */
router.put("/me/avatar", validateChangeAvatar, validate, changeUserAvatar);

export default router;

