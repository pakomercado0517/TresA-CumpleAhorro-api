import { Router } from "express";

import { getPublicEvent } from "../controllers/public.controller";
import { validateEventId } from "../validators/event.validator";
import { validate } from "../middlewares/validation.middleware";

const router: Router = Router();

/**
 * @route   GET /api/public/events/:eventId
 * @desc    Obtener información pública de un evento (sin autenticación)
 * @access  Public
 */
router.get("/events/:eventId", validateEventId, validate, getPublicEvent);

export default router;

