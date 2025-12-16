import { Router } from "express";

import { listAllEvents, listEvents, generateEvents, getById } from "../controllers/event.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { validateGroupId, validateEventId } from "../validators/event.validator";

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/events
 * @desc    Listar todos los eventos del usuario
 * @access  Private
 * @query   year, cursor, limit, status, search, sortBy, sortOrder, includeGroupName, includeTimestamps
 */
router.get("/events", listAllEvents);

/**
 * @route   GET /api/groups/:groupId/events
 * @desc    Listar todos los eventos de un grupo
 * @access  Private
 */
router.get("/groups/:groupId/events", validateGroupId, validate, listEvents);

/**
 * @route   POST /api/groups/:groupId/events/generate
 * @desc    Generar eventos de cumpleaños para el año actual
 * @access  Private
 */
router.post(
  "/groups/:groupId/events/generate",
  validateGroupId,
  validate,
  generateEvents
);

/**
 * @route   GET /api/events/:eventId
 * @desc    Obtener un evento por ID
 * @access  Private
 */
router.get("/events/:eventId", validateEventId, validate, getById);

export default router;
