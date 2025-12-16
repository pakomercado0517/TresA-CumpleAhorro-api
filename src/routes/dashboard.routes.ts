import { Router } from "express";

import { getDashboardData } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/dashboard
 * @desc    Obtener información del dashboard del usuario
 * @access  Private
 * @query   limit, days, includePhotoUrl
 */
router.get("/dashboard", getDashboardData);

export default router;


