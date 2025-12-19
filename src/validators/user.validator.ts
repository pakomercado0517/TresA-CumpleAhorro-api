import { body } from "express-validator";

/**
 * Validaciones para actualizar perfil de usuario (nombre y email)
 */
export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El email no puede estar vacío")
    .isEmail()
    .withMessage("El email debe tener un formato válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El email no puede exceder 255 caracteres"),

  body()
    .custom((value) => {
      // Al menos uno de los campos debe estar presente
      if (!value.name && !value.email) {
        throw new Error("Debe proporcionar al menos un campo para actualizar (name o email)");
      }
      return true;
    })
];

/**
 * Validaciones para cambiar contraseña
 */
export const validateChangePassword = [
  body("oldPassword")
    .notEmpty()
    .withMessage("La contraseña actual es requerida")
    .isString()
    .withMessage("La contraseña actual debe ser una cadena de texto"),

  body("newPassword")
    .notEmpty()
    .withMessage("La nueva contraseña es requerida")
    .isLength({ min: 8, max: 100 })
    .withMessage("La nueva contraseña debe tener entre 8 y 100 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La nueva contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
    )
];

/**
 * Validaciones para cambiar avatar URL
 */
export const validateChangeAvatar = [
  body("avatarUrl")
    .notEmpty()
    .withMessage("La URL del avatar es requerida")
    .isString()
    .withMessage("La URL del avatar debe ser una cadena de texto")
    .isURL()
    .withMessage("La URL del avatar debe ser una URL válida")
    .isLength({ max: 500 })
    .withMessage("La URL del avatar no puede exceder 500 caracteres")
];





