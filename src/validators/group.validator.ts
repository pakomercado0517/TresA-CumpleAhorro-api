import { body, param } from "express-validator";

/**
 * Validaciones para crear un grupo
 */
export const validateCreateGroup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del grupo es requerido")
    .isLength({ min: 1, max: 100 })
    .withMessage("El nombre debe tener entre 1 y 100 caracteres"),

  body("amountPerBirthday")
    .notEmpty()
    .withMessage("El monto por cumpleaños es requerido")
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser un número positivo mayor a 0")
    .toFloat(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres")
];

/**
 * Validaciones para actualizar un grupo
 */
export const validateUpdateGroup = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre del grupo no puede estar vacío")
    .isLength({ min: 1, max: 100 })
    .withMessage("El nombre debe tener entre 1 y 100 caracteres"),

  body("amountPerBirthday")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser un número positivo mayor a 0")
    .toFloat(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres")
];

/**
 * Validaciones para el parámetro ID de grupo
 */
export const validateGroupId = [
  param("id")
    .notEmpty()
    .withMessage("El ID del grupo es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del grupo debe ser un número entero positivo")
    .toInt()
];

