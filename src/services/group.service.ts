import { Group } from "../models/Group";
import { CreateGroupDto, UpdateGroupDto, GroupResponse } from "../types/group.types";
import { recalculateGroupEventsExpectedAmount } from "./event.service";

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

  return groups.map((group) => {
    // Obtener valores raw de Sequelize para asegurar que se obtengan correctamente
    const amountPerBirthdayValue = group.getDataValue("amountPerBirthday");
    const nameValue = group.getDataValue("name");
    const descriptionValue = group.getDataValue("description");

    // Construir objeto de respuesta con todos los campos explícitamente
    const response: GroupResponse = {
      id: group.id,
      userId: group.userId,
      name: nameValue || group.name || "",
      amountPerBirthday:
        amountPerBirthdayValue !== null && amountPerBirthdayValue !== undefined
          ? Number(amountPerBirthdayValue)
          : Number(group.amountPerBirthday) || 0,
      description:
        descriptionValue !== null && descriptionValue !== undefined
          ? descriptionValue
          : group.description ?? undefined,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };

    return response;
  });
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

  // Obtener valores raw de Sequelize para asegurar que se obtengan correctamente
  const amountPerBirthdayValue = group.getDataValue("amountPerBirthday");
  const nameValue = group.getDataValue("name");
  const descriptionValue = group.getDataValue("description");

  return {
    id: group.id,
    userId: group.userId,
    name: nameValue || group.name || "",
    amountPerBirthday:
      amountPerBirthdayValue !== null && amountPerBirthdayValue !== undefined
        ? Number(amountPerBirthdayValue)
        : Number(group.amountPerBirthday) || 0,
    description:
      descriptionValue !== null && descriptionValue !== undefined
        ? descriptionValue
        : group.description ?? undefined,
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

  // Construir objeto de actualización solo con los campos proporcionados
  const updateData: Partial<{
    name: string;
    amountPerBirthday: number;
    description: string | null;
  }> = {};

  if (groupData.name !== undefined) {
    updateData.name = groupData.name;
  }
  if (groupData.amountPerBirthday !== undefined) {
    updateData.amountPerBirthday = groupData.amountPerBirthday;
  }
  // description puede ser undefined (no actualizar), null (eliminar), o string (actualizar)
  if (groupData.description !== undefined) {
    // Si es string vacío, convertir a null; si es null, mantener null; si es string, mantener string
    updateData.description = groupData.description === "" ? null : groupData.description;
  }

  // Si no hay campos para actualizar, retornar el grupo sin cambios
  if (Object.keys(updateData).length === 0) {
    return {
      id: group.id,
      userId: group.userId,
      name: group.name,
      amountPerBirthday: Number(group.amountPerBirthday),
      description: group.description ?? undefined,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  }

  // Actualizar usando update() que es más confiable
  await group.update(updateData);

  // Recargar el grupo para obtener los valores actualizados
  await group.reload();

  // Si se actualizó el amountPerBirthday, recalcular expectedAmount de todos los eventos
  // IMPORTANTE: Esperar a que termine para garantizar consistencia
  if (updateData.amountPerBirthday !== undefined) {
    console.log(`[updateGroup] amountPerBirthday actualizado a $${updateData.amountPerBirthday} para grupo ${groupId}`);
    const updatedEventsCount = await recalculateGroupEventsExpectedAmount(groupId);
    console.log(`[updateGroup] ${updatedEventsCount} eventos actualizados en grupo ${groupId}`);
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

