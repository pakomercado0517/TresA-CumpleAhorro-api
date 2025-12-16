import { Router } from "express";

import {
  listAllMembers,
  listMembers,
  create,
  getById,
  update,
  remove
} from "../controllers/member.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  validateCreateMember,
  validateUpdateMember,
  validateGroupId,
  validateMemberId
} from "../validators/member.validator";

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/members
 * @desc    Listar todos los miembros del usuario
 * @access  Private
 * @query   search, month, status, cursor, limit, includePhone, includePhotoUrl, includeSummary
 */
router.get("/members", listAllMembers);

/**
 * @route   GET /api/groups/:groupId/members
 * @desc    Listar todos los miembros de un grupo
 * @access  Private
 */
router.get("/groups/:groupId/members", validateGroupId, validate, listMembers);

/**
 * @route   POST /api/groups/:groupId/members
 * @desc    Crear un nuevo miembro en un grupo
 * @access  Private
 */
router.post(
  "/groups/:groupId/members",
  validateGroupId,
  validateCreateMember,
  validate,
  create
);

/**
 * @route   GET /api/members/:id
 * @desc    Obtener un miembro por ID
 * @access  Private
 */
router.get("/members/:id", validateMemberId, validate, getById);

/**
 * @route   PUT /api/members/:id
 * @desc    Actualizar un miembro
 * @access  Private
 */
router.put("/members/:id", validateMemberId, validateUpdateMember, validate, update);

/**
 * @route   DELETE /api/members/:id
 * @desc    Eliminar un miembro
 * @access  Private
 */
router.delete("/members/:id", validateMemberId, validate, remove);

export default router;
