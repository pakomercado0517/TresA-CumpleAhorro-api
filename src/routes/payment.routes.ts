import { Router } from "express";

import {
  listPayments,
  create,
  getById,
  update,
  remove
} from "../controllers/payment.controller";
import {
  validateCreatePayment,
  validateUpdatePayment,
  validateEventId,
  validatePaymentId
} from "../validators/payment.validator";
import { validate } from "../middlewares/validation.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/events/:eventId/payments
 * @desc    Listar todos los pagos de un evento
 * @access  Private
 */
router.get("/events/:eventId/payments", validateEventId, validate, listPayments);

/**
 * @route   POST /api/events/:eventId/payments
 * @desc    Registrar un nuevo pago
 * @access  Private
 */
router.post(
  "/events/:eventId/payments",
  validateEventId,
  validateCreatePayment,
  validate,
  create
);

/**
 * @route   GET /api/payments/:id
 * @desc    Obtener un pago por ID
 * @access  Private
 */
router.get("/payments/:id", validatePaymentId, validate, getById);

/**
 * @route   PUT /api/payments/:id
 * @desc    Actualizar un pago
 * @access  Private
 */
router.put("/payments/:id", validatePaymentId, validateUpdatePayment, validate, update);

/**
 * @route   DELETE /api/payments/:id
 * @desc    Eliminar un pago
 * @access  Private
 */
router.delete("/payments/:id", validatePaymentId, validate, remove);

export default router;

