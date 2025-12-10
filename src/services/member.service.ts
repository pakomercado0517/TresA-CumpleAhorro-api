import { Member } from "../models/Member";
import { Group } from "../models/Group";
import { CreateMemberDto, UpdateMemberDto, MemberResponse } from "../types/member.types";
import { parseDateOnlyToUTC, formatDateOnlyFromUTC } from "../utils/date.util";

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

  return members.map((member) => ({
    id: member.id,
    groupId: member.groupId,
    name: member.name,
    phone: member.phone ?? undefined,
    birthday: formatDateOnlyFromUTC(member.birthday),
    photoUrl: member.photoUrl ?? undefined,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt
  }));
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

  // Convertir birthday de string (yyyy-MM-dd) a UTC
  const birthdayUTC = parseDateOnlyToUTC(memberData.birthday);

  const member = await Member.create({
    groupId,
    name: memberData.name,
    phone: memberData.phone,
    birthday: birthdayUTC,
    photoUrl: memberData.photoUrl
  } as unknown as Member);

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
    // Convertir birthday de string (yyyy-MM-dd) a UTC
    member.birthday = parseDateOnlyToUTC(memberData.birthday);
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

  await member.destroy();
};

