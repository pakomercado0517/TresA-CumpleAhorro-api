import { Request, Response } from "express";

import {
  getGroupMembers,
  createMember,
  getMemberById,
  updateMember,
  deleteMember
} from "../services/member.service";
import { CreateMemberDto, UpdateMemberDto } from "../types/member.types";

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

