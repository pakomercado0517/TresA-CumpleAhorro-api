import { body } from "express-validator";

/**
 * Validaciones para el registro de usuarios
 */
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("El email debe tener un formato válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El email no puede exceder 255 caracteres"),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 8, max: 100 })
    .withMessage("La contraseña debe tener entre 8 y 100 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
    )
];

/**
 * Validaciones para el login de usuarios
 */
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("El email debe tener un formato válido")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 1 })
    .withMessage("La contraseña es requerida")
];

/**
 * Validaciones para solicitar reset de contraseña
 */
export const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("El email debe tener un formato válido")
    .normalizeEmail()
];

/**
 * Validaciones para resetear contraseña
 */
export const validateResetPassword = [
  body("token")
    .notEmpty()
    .withMessage("El token es requerido")
    .isString()
    .withMessage("El token debe ser una cadena de texto"),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 8, max: 100 })
    .withMessage("La contraseña debe tener entre 8 y 100 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
    )
];

/**
 * Validaciones para verificar email (query param)
 */
export const validateVerifyEmail = [
  body("token")
    .optional()
    .isString()
    .withMessage("El token debe ser una cadena de texto")
];
