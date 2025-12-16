import { Request, Response } from "express";

import {
  getGroupMembers,
  createMember,
  getMemberById,
  updateMember,
  deleteMember,
  getUserMembers
} from "../services/member.service";
import { CreateMemberDto, UpdateMemberDto, GetMembersQueryParams } from "../types/member.types";

/**
 * Controller para listar todos los miembros del usuario
 * Soporta filtros: search, month, status, cursor
 */
export const listAllMembers = async (
  req: Request<unknown, unknown, unknown, GetMembersQueryParams>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    // Parsear query parameters
    const search = req.query.search ? String(req.query.search) : undefined;
    const month = req.query.month ? parseInt(String(req.query.month), 10) : undefined;
    const status = (req.query.status as string) || "all";
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    
    // Parsear booleanos
    const includePhoneValue = req.query.includePhone;
    const includePhone = typeof includePhoneValue === "string"
      ? includePhoneValue !== "false" && includePhoneValue !== "0"
      : includePhoneValue !== false;

    const includePhotoUrlValue = req.query.includePhotoUrl;
    const includePhotoUrl = typeof includePhotoUrlValue === "string"
      ? includePhotoUrlValue !== "false" && includePhotoUrlValue !== "0"
      : includePhotoUrlValue !== false;

    const includeSummaryValue = req.query.includeSummary;
    const includeSummary = typeof includeSummaryValue === "string"
      ? includeSummaryValue !== "false" && includeSummaryValue !== "0"
      : includeSummaryValue !== false;

    // Validar parámetros
    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      res.status(400).json({
        error: "El parámetro 'month' debe ser un número entre 1 y 12"
      });
      return;
    }

    if (limit !== undefined && (isNaN(limit) || limit <= 0 || limit > 100)) {
      res.status(400).json({
        error: "El parámetro 'limit' debe ser un número positivo entre 1 y 100"
      });
      return;
    }

    if (!["all", "active", "pending", "inactive"].includes(status)) {
      res.status(400).json({
        error: "El parámetro 'status' debe ser: all, active, pending o inactive"
      });
      return;
    }

    const members = await getUserMembers(userId, {
      search,
      month,
      status: status as "all" | "active" | "pending" | "inactive",
      cursor,
      limit,
      includePhone,
      includePhotoUrl,
      includeSummary
    });

    res.status(200).json(members);
  } catch (error) {
    console.error("Error al listar miembros:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para listar todos los miembros de un grupo
 */
export const listMembers = async (
  req: Request<{ groupId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const groupId = parseInt(req.params.groupId, 10);

    if (isNaN(groupId)) {
      res.status(400).json({
        error: "ID de grupo inválido"
      });
      return;
    }

    const members = await getGroupMembers(groupId, userId);

    res.status(200).json({
      message: "Miembros obtenidos exitosamente",
      members
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al listar miembros:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para crear un nuevo miembro en un grupo
 */
export const create = async (
  req: Request<{ groupId: string }, unknown, CreateMemberDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const groupId = parseInt(req.params.groupId, 10);

    if (isNaN(groupId)) {
      res.status(400).json({
        error: "ID de grupo inválido"
      });
      return;
    }

    const memberData: CreateMemberDto = {
      name: req.body.name,
      phone: req.body.phone,
      birthday: req.body.birthday,
      photoUrl: req.body.photoUrl
    };

    const member = await createMember(groupId, userId, memberData);

    res.status(201).json({
      message: "Miembro creado exitosamente",
      member
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al crear miembro:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para obtener un miembro por ID
 */
export const getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const memberId = parseInt(req.params.id, 10);

    if (isNaN(memberId)) {
      res.status(400).json({
        error: "ID de miembro inválido"
      });
      return;
    }

    const member = await getMemberById(memberId, userId);

    res.status(200).json({
      message: "Miembro obtenido exitosamente",
      member
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al obtener miembro:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para actualizar un miembro
 */
export const update = async (
  req: Request<{ id: string }, unknown, UpdateMemberDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const memberId = parseInt(req.params.id, 10);

    if (isNaN(memberId)) {
      res.status(400).json({
        error: "ID de miembro inválido"
      });
      return;
    }

    const memberData: UpdateMemberDto = {
      name: req.body.name,
      phone: req.body.phone,
      birthday: req.body.birthday,
      photoUrl: req.body.photoUrl
    };

    const member = await updateMember(memberId, userId, memberData);

    res.status(200).json({
      message: "Miembro actualizado exitosamente",
      member
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al actualizar miembro:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para eliminar un miembro
 */
export const remove = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const memberId = parseInt(req.params.id, 10);

    if (isNaN(memberId)) {
      res.status(400).json({
        error: "ID de miembro inválido"
      });
      return;
    }

    await deleteMember(memberId, userId);

    res.status(200).json({
      message: "Miembro eliminado exitosamente"
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al eliminar miembro:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};
