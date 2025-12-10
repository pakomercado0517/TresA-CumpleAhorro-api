import { param } from "express-validator";

/**
 * Validaciones para el parámetro groupId en eventos
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
 * Validaciones para el parámetro eventId
 */
export const validateEventId = [
  param("eventId")
    .notEmpty()
    .withMessage("El ID del evento es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del evento debe ser un número entero positivo")
    .toInt()
];

