import { Request, Response } from "express";

import {
  getUserGroups,
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup
} from "../services/group.service";
import { CreateGroupDto, UpdateGroupDto } from "../types/group.types";

/**
 * Controller para listar todos los grupos del usuario autenticado
 */
export const listGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const groups = await getUserGroups(userId);

    res.status(200).json({
      message: "Grupos obtenidos exitosamente",
      groups
    });
  } catch (error) {
    console.error("Error al listar grupos:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para crear un nuevo grupo
 */
export const create = async (
  req: Request<unknown, unknown, CreateGroupDto>,
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

    const groupData: CreateGroupDto = {
      name: req.body.name,
      amountPerBirthday: req.body.amountPerBirthday,
      description: req.body.description
    };

    const group = await createGroup(userId, groupData);

    res.status(201).json({
      message: "Grupo creado exitosamente",
      group
    });
  } catch (error) {
    console.error("Error al crear grupo:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para obtener un grupo por ID
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

    const groupId = parseInt(req.params.id, 10);

    if (isNaN(groupId)) {
      res.status(400).json({
        error: "ID de grupo inválido"
      });
      return;
    }

    const group = await getGroupById(groupId, userId);

    res.status(200).json({
      message: "Grupo obtenido exitosamente",
      group
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al obtener grupo:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para actualizar un grupo
 */
export const update = async (
  req: Request<{ id: string }, unknown, UpdateGroupDto>,
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

    const groupId = parseInt(req.params.id, 10);

    if (isNaN(groupId)) {
      res.status(400).json({
        error: "ID de grupo inválido"
      });
      return;
    }

    // Construir objeto solo con los campos que están presentes en el body
    const groupData: UpdateGroupDto = {};

    if (req.body.name !== undefined) {
      groupData.name = req.body.name;
    }
    if (req.body.amountPerBirthday !== undefined) {
      groupData.amountPerBirthday = req.body.amountPerBirthday;
    }
    if (req.body.description !== undefined) {
      groupData.description = req.body.description;
    }

    const group = await updateGroup(groupId, userId, groupData);

    res.status(200).json({
      message: "Grupo actualizado exitosamente",
      group
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al actualizar grupo:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para eliminar un grupo
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

    const groupId = parseInt(req.params.id, 10);

    if (isNaN(groupId)) {
      res.status(400).json({
        error: "ID de grupo inválido"
      });
      return;
    }

    await deleteGroup(groupId, userId);

    res.status(200).json({
      message: "Grupo eliminado exitosamente"
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al eliminar grupo:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};
