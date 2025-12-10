import { Router } from "express";

import {
  listGroups,
  create,
  getById,
  update,
  remove
} from "../controllers/group.controller";
import {
  validateCreateGroup,
  validateUpdateGroup,
  validateGroupId
} from "../validators/group.validator";
import { validate } from "../middlewares/validation.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/groups
 * @desc    Listar todos los grupos del usuario autenticado
 * @access  Private
 */
router.get("/", listGroups);

/**
 * @route   POST /api/groups
 * @desc    Crear un nuevo grupo
 * @access  Private
 */
router.post("/", validateCreateGroup, validate, create);

/**
 * @route   GET /api/groups/:id
 * @desc    Obtener un grupo por ID
 * @access  Private
 */
router.get("/:id", validateGroupId, validate, getById);

/**
 * @route   PUT /api/groups/:id
 * @desc    Actualizar un grupo
 * @access  Private
 */
router.put("/:id", validateGroupId, validateUpdateGroup, validate, update);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Eliminar un grupo
 * @access  Private
 */
router.delete("/:id", validateGroupId, validate, remove);

export default router;

