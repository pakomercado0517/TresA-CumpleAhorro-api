import { Router } from "express";

import {
  register,
  login,
  verifyEmailController,
  forgotPassword,
  resetPasswordController
} from "../controllers/auth.controller";
import { authRateLimiter } from "../middlewares/rate-limit.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from "../validators/auth.validator";

const router: Router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post("/register", authRateLimiter, validateRegister, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar un usuario
 * @access  Public
 */
router.post("/login", authRateLimiter, validateLogin, validate, login);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verificar email de un usuario
 * @access  Public
 */
router.get("/verify-email", verifyEmailController);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de contraseña
 * @access  Public
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  validateForgotPassword,
  validate,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetear contraseña con token
 * @access  Public
 */
router.post(
  "/reset-password",
  authRateLimiter,
  validateResetPassword,
  validate,
  resetPasswordController
);

export default router;
