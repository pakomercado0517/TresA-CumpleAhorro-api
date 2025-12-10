import { Group } from "../models/Group";
import { CreateGroupDto, UpdateGroupDto, GroupResponse } from "../types/group.types";

/**
 * Obtiene todos los grupos de un usuario
 * @param userId - ID del usuario autenticado
 * @returns Lista de grupos del usuario
 */
export const getUserGroups = async (userId: number): Promise<GroupResponse[]> => {
  const groups = await Group.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]]
  });

  return groups.map((group) => ({
    id: group.id,
    userId: group.userId,
    name: group.name,
    amountPerBirthday: Number(group.amountPerBirthday),
    description: group.description ?? undefined,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  }));
};

/**
 * Crea un nuevo grupo para un usuario
 * @param userId - ID del usuario autenticado
 * @param groupData - Datos del grupo a crear
 * @returns Grupo creado
 */
export const createGroup = async (
  userId: number,
  groupData: CreateGroupDto
): Promise<GroupResponse> => {
  const group = await Group.create({
    userId,
    name: groupData.name,
    amountPerBirthday: groupData.amountPerBirthday,
    description: groupData.description
  } as unknown as Group);

  return {
    id: group.id,
    userId: group.userId,
    name: group.name,
    amountPerBirthday: Number(group.amountPerBirthday),
    description: group.description ?? undefined,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  };
};

/**
 * Obtiene un grupo por ID, verificando que pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @returns Grupo encontrado
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const getGroupById = async (
  groupId: number,
  userId: number
): Promise<GroupResponse> => {
  const group = await Group.findOne({
    where: { id: groupId, userId }
  });

  if (!group) {
    const error = new Error("Grupo no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  return {
    id: group.id,
    userId: group.userId,
    name: group.name,
    amountPerBirthday: Number(group.amountPerBirthday),
    description: group.description ?? undefined,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  };
};

/**
 * Actualiza un grupo, verificando que pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @param groupData - Datos a actualizar
 * @returns Grupo actualizado
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const updateGroup = async (
  groupId: number,
  userId: number,
  groupData: UpdateGroupDto
): Promise<GroupResponse> => {
  const group = await Group.findOne({
    where: { id: groupId, userId }
  });

  if (!group) {
    const error = new Error("Grupo no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Actualizar solo los campos proporcionados
  if (groupData.name !== undefined) {
    group.name = groupData.name;
  }
  if (groupData.amountPerBirthday !== undefined) {
    group.amountPerBirthday = groupData.amountPerBirthday;
  }
  if (groupData.description !== undefined) {
    group.description = groupData.description;
  }

  await group.save();

  return {
    id: group.id,
    userId: group.userId,
    name: group.name,
    amountPerBirthday: Number(group.amountPerBirthday),
    description: group.description ?? undefined,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  };
};

/**
 * Elimina un grupo, verificando que pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const deleteGroup = async (groupId: number, userId: number): Promise<void> => {
  const group = await Group.findOne({
    where: { id: groupId, userId }
  });

  if (!group) {
    const error = new Error("Grupo no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  await group.destroy();
};

