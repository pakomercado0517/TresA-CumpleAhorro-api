import { isValid, parseISO } from "date-fns";
import { body, param } from "express-validator";

/**
 * Validaciones para crear un miembro
 */
export const validateCreateMember = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del miembro es requerido")
    .isLength({ min: 1, max: 100 })
    .withMessage("El nombre debe tener entre 1 y 100 caracteres"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("El teléfono no puede exceder 20 caracteres")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("El teléfono solo puede contener números, espacios, guiones y paréntesis"),

  body("birthday")
    .notEmpty()
    .withMessage("La fecha de cumpleaños es requerida")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO (yyyy-MM-dd)")
    .custom((value) => {
      const date = parseISO(value);
      if (!isValid(date)) {
        throw new Error("La fecha de cumpleaños no es válida");
      }
      // Verificar que no sea una fecha futura
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        throw new Error("La fecha de cumpleaños no puede ser futura");
      }
      return true;
    }),

  body("photoUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("La URL de la foto debe ser una URL válida")
    .isLength({ max: 500 })
    .withMessage("La URL de la foto no puede exceder 500 caracteres")
];

/**
 * Validaciones para actualizar un miembro
 */
export const validateUpdateMember = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre del miembro no puede estar vacío")
    .isLength({ min: 1, max: 100 })
    .withMessage("El nombre debe tener entre 1 y 100 caracteres"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("El teléfono no puede exceder 20 caracteres")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("El teléfono solo puede contener números, espacios, guiones y paréntesis"),

  body("birthday")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO (yyyy-MM-dd)")
    .custom((value) => {
      if (!value) {return true;}
      const date = parseISO(value);
      if (!isValid(date)) {
        throw new Error("La fecha de cumpleaños no es válida");
      }
      // Verificar que no sea una fecha futura
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        throw new Error("La fecha de cumpleaños no puede ser futura");
      }
      return true;
    }),

  body("photoUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("La URL de la foto debe ser una URL válida")
    .isLength({ max: 500 })
    .withMessage("La URL de la foto no puede exceder 500 caracteres")
];

/**
 * Validaciones para el parámetro groupId
 */
export const validateGroupId = [
  param("groupId")
    .notEmpty()
    .withMessage("El ID del grupo es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del grupo debe ser un número entero positivo")
    .toInt()
];

/**
 * Validaciones para el parámetro memberId
 */
export const validateMemberId = [
  param("id")
    .notEmpty()
    .withMessage("El ID del miembro es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del miembro debe ser un número entero positivo")
    .toInt()
];
