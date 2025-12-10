import { body, param } from "express-validator";
import { isValid, parseISO } from "date-fns";

/**
 * Validaciones para crear un pago
 */
export const validateCreatePayment = [
  body("memberId")
    .notEmpty()
    .withMessage("El ID del miembro es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del miembro debe ser un número entero positivo")
    .toInt(),

  body("amount")
    .notEmpty()
    .withMessage("El monto es requerido")
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser un número positivo mayor a 0")
    .toFloat(),

  body("datePaid")
    .notEmpty()
    .withMessage("La fecha de pago es requerida")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO (yyyy-MM-dd)")
    .custom((value) => {
      const date = parseISO(value);
      if (!isValid(date)) {
        throw new Error("La fecha de pago no es válida");
      }
      // Verificar que no sea una fecha futura
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Permitir el día de hoy
      if (date > today) {
        throw new Error("La fecha de pago no puede ser futura");
      }
      return true;
    }),

  body("proofUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("La URL del comprobante debe ser una URL válida")
    .isLength({ max: 500 })
    .withMessage("La URL del comprobante no puede exceder 500 caracteres")
];

/**
 * Validaciones para actualizar un pago
 */
export const validateUpdatePayment = [
  body("amount")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser un número positivo mayor a 0")
    .toFloat(),

  body("datePaid")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO (yyyy-MM-dd)")
    .custom((value) => {
      if (!value) return true;
      const date = parseISO(value);
      if (!isValid(date)) {
        throw new Error("La fecha de pago no es válida");
      }
      // Verificar que no sea una fecha futura
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Permitir el día de hoy
      if (date > today) {
        throw new Error("La fecha de pago no puede ser futura");
      }
      return true;
    }),

  body("proofUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("La URL del comprobante debe ser una URL válida")
    .isLength({ max: 500 })
    .withMessage("La URL del comprobante no puede exceder 500 caracteres")
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

/**
 * Validaciones para el parámetro paymentId
 */
export const validatePaymentId = [
  param("id")
    .notEmpty()
    .withMessage("El ID del pago es requerido")
    .isInt({ min: 1 })
    .withMessage("El ID del pago debe ser un número entero positivo")
    .toInt()
];

