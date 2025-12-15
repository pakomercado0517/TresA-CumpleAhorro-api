import { Member } from "../models/Member";
import { Group } from "../models/Group";
import { CreateMemberDto, UpdateMemberDto, MemberResponse } from "../types/member.types";
import { formatDateOnlyFromUTC } from "../utils/date.util";
import { recalculateGroupEventsExpectedAmount } from "./event.service";

/**
 * Verifica que un grupo pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
const verifyGroupOwnership = async (groupId: number, userId: number): Promise<void> => {
  const group = await Group.findOne({
    where: { id: groupId, userId }
  });

  if (!group) {
    const error = new Error("Grupo no encontrado");
    error.name = "NotFoundError";
    throw error;
  }
};

/**
 * Obtiene todos los miembros de un grupo, verificando que el grupo pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @returns Lista de miembros del grupo
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const getGroupMembers = async (
  groupId: number,
  userId: number
): Promise<MemberResponse[]> => {
  await verifyGroupOwnership(groupId, userId);

  const members = await Member.findAll({
    where: { groupId },
    order: [["name", "ASC"]]
  });

  return members.map((member) => {
    // Obtener valores raw de Sequelize para asegurar que se obtengan correctamente
    const birthdayValue = member.getDataValue("birthday") || member.birthday;
    const nameValue = member.getDataValue("name") || member.name;
    const phoneValue = member.getDataValue("phone") || member.phone;
    const photoUrlValue = member.getDataValue("photoUrl") || member.photoUrl;

    // Construir objeto de respuesta con todos los campos explícitamente
    const response: MemberResponse = {
      id: member.id,
      groupId: member.groupId,
      name: nameValue || "",
      phone: phoneValue !== null && phoneValue !== undefined ? phoneValue : undefined,
      birthday:
        birthdayValue !== null && birthdayValue !== undefined
          ? formatDateOnlyFromUTC(birthdayValue)
          : "",
      photoUrl: photoUrlValue !== null && photoUrlValue !== undefined ? photoUrlValue : undefined,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    };

    return response;
  });
};

/**
 * Crea un nuevo miembro en un grupo, verificando que el grupo pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @param memberData - Datos del miembro a crear
 * @returns Miembro creado
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const createMember = async (
  groupId: number,
  userId: number,
  memberData: CreateMemberDto
): Promise<MemberResponse> => {
  await verifyGroupOwnership(groupId, userId);

  // Para campos DATEONLY, pasar el string directamente sin convertir a Date
  // Sequelize manejará la fecha correctamente como DATEONLY
  const member = await Member.create({
    groupId,
    name: memberData.name,
    phone: memberData.phone,
    birthday: memberData.birthday, // String "YYYY-MM-DD" directamente
    photoUrl: memberData.photoUrl
  } as unknown as Member);

  // Recalcular expectedAmount de todos los eventos del grupo
  // porque ahora hay un miembro más
  // IMPORTANTE: Esperar a que termine para garantizar consistencia
  console.log(`[createMember] Recalculando expectedAmount para grupo ${groupId} después de agregar miembro ${member.id}`);
  const updatedEventsCount = await recalculateGroupEventsExpectedAmount(groupId);
  console.log(`[createMember] ${updatedEventsCount} eventos actualizados en grupo ${groupId}`);

  // Obtener el birthday como string directamente de Sequelize
  // Sequelize devuelve DATEONLY como string "YYYY-MM-DD"
  const birthdayValue = member.birthday;
  let birthdayFormatted: string;
  
  if (typeof birthdayValue === "string") {
    birthdayFormatted = formatDateOnlyFromUTC(birthdayValue);
  } else if (birthdayValue instanceof Date) {
    // Si es Date, convertir a string primero
    const dateStr = birthdayValue.toISOString().split("T")[0];
    birthdayFormatted = formatDateOnlyFromUTC(dateStr);
  } else {
    // Fallback: usar el valor original del request
    birthdayFormatted = memberData.birthday;
  }

  return {
    id: member.id,
    groupId: member.groupId,
    name: member.name,
    phone: member.phone ?? undefined,
    birthday: birthdayFormatted,
    photoUrl: member.photoUrl ?? undefined,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  };
};

/**
 * Obtiene un miembro por ID, verificando que pertenezca a un grupo del usuario
 * @param memberId - ID del miembro
 * @param userId - ID del usuario autenticado
 * @returns Miembro encontrado
 * @throws Error si el miembro no existe o no pertenece a un grupo del usuario
 */
export const getMemberById = async (
  memberId: number,
  userId: number
): Promise<MemberResponse> => {
  const member = await Member.findOne({
    where: { id: memberId },
    include: [
      {
        model: Group,
        as: "group",
        where: { userId }
      }
    ]
  });

  if (!member) {
    const error = new Error("Miembro no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener valores raw de Sequelize
  const birthdayValue = member.getDataValue("birthday") || member.birthday;
  const nameValue = member.getDataValue("name") || member.name;
  const phoneValue = member.getDataValue("phone") || member.phone;
  const photoUrlValue = member.getDataValue("photoUrl") || member.photoUrl;

  return {
    id: member.id,
    groupId: member.groupId,
    name: nameValue || "",
    phone: phoneValue !== null && phoneValue !== undefined ? phoneValue : undefined,
    birthday:
      birthdayValue !== null && birthdayValue !== undefined
        ? formatDateOnlyFromUTC(birthdayValue)
        : "",
    photoUrl: photoUrlValue !== null && photoUrlValue !== undefined ? photoUrlValue : undefined,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  };
};

/**
 * Actualiza un miembro, verificando que pertenezca a un grupo del usuario
 * @param memberId - ID del miembro
 * @param userId - ID del usuario autenticado
 * @param memberData - Datos a actualizar
 * @returns Miembro actualizado
 * @throws Error si el miembro no existe o no pertenece a un grupo del usuario
 */
export const updateMember = async (
  memberId: number,
  userId: number,
  memberData: UpdateMemberDto
): Promise<MemberResponse> => {
  const member = await Member.findOne({
    where: { id: memberId },
    include: [
      {
        model: Group,
        as: "group",
        where: { userId }
      }
    ]
  });

  if (!member) {
    const error = new Error("Miembro no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Actualizar solo los campos proporcionados
  if (memberData.name !== undefined) {
    member.name = memberData.name;
  }
  if (memberData.phone !== undefined) {
    member.phone = memberData.phone || undefined;
  }
  if (memberData.birthday !== undefined) {
    // Para campos DATEONLY, pasar el string directamente
    member.birthday = memberData.birthday as unknown as Date;
  }
  if (memberData.photoUrl !== undefined) {
    member.photoUrl = memberData.photoUrl || undefined;
  }

  await member.save();

  return {
    id: member.id,
    groupId: member.groupId,
    name: member.name,
    phone: member.phone ?? undefined,
    birthday: formatDateOnlyFromUTC(member.birthday),
    photoUrl: member.photoUrl ?? undefined,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  };
};

/**
 * Elimina un miembro, verificando que pertenezca a un grupo del usuario
 * @param memberId - ID del miembro
 * @param userId - ID del usuario autenticado
 * @throws Error si el miembro no existe o no pertenece a un grupo del usuario
 */
export const deleteMember = async (memberId: number, userId: number): Promise<void> => {
  const member = await Member.findOne({
    where: { id: memberId },
    include: [
      {
        model: Group,
        as: "group",
        where: { userId }
      }
    ]
  });

  if (!member) {
    const error = new Error("Miembro no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener groupId antes de eliminar (usar getDataValue para asegurar valor correcto)
  const groupId = member.getDataValue("groupId") || member.groupId;
  const memberIdToDelete = member.id;
  await member.destroy();

  // Recalcular expectedAmount de todos los eventos del grupo
  // porque ahora hay un miembro menos
  // IMPORTANTE: Esperar a que termine para garantizar consistencia
  console.log(`[deleteMember] Recalculando expectedAmount para grupo ${groupId} después de eliminar miembro ${memberIdToDelete}`);
  const updatedEventsCount = await recalculateGroupEventsExpectedAmount(groupId);
  console.log(`[deleteMember] ${updatedEventsCount} eventos actualizados en grupo ${groupId}`);
};

