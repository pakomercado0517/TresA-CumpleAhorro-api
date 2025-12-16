import { Op } from "sequelize";

import { BirthdayEvent } from "../models/BirthdayEvent";
import { Group } from "../models/Group";
import { Member } from "../models/Member";
import { Payment } from "../models/Payment";
import { CreateMemberDto, UpdateMemberDto, MemberResponse, MemberListResponse, MemberListItem, MemberSummary, GetMembersQueryParams } from "../types/member.types";
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
  await recalculateGroupEventsExpectedAmount(groupId);

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
    member.phone = memberData.phone || null;
  }
  if (memberData.birthday !== undefined) {
    // Para campos DATEONLY, pasar el string directamente
    member.birthday = memberData.birthday as unknown as Date;
  }
  if (memberData.photoUrl !== undefined) {
    member.photoUrl = memberData.photoUrl || null;
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
  await recalculateGroupEventsExpectedAmount(groupId);
};

/**
 * Obtiene todos los miembros del usuario con información completa
 * Incluye información del grupo, filtros y summary
 * @param userId - ID del usuario autenticado
 * @param options - Opciones de filtrado y paginación
 * @returns Lista de miembros con información completa
 */
export const getUserMembers = async (
  userId: number,
  options: GetMembersQueryParams = {}
): Promise<MemberListResponse> => {
  const {
    search,
    month,
    status = "all",
    cursor,
    limit = 20,
    includePhone = true,
    includePhotoUrl = true,
    includeSummary = true
  } = options;

  // Obtener todos los grupos del usuario
  const userGroups = await Group.findAll({
    where: { userId },
    attributes: ["id", "name"]
  });

  if (userGroups.length === 0) {
    return {
      message: "Miembros obtenidos exitosamente",
      members: [],
      ...(includeSummary ? {
        summary: {
          totalMembers: 0,
          newMembersThisWeek: 0,
          birthdaysThisMonth: 0,
          pendingPayments: 0
        }
      } : {})
    };
  }

  const groupIds = userGroups.map(g => g.id);
  const groupsMap = new Map(userGroups.map(g => [g.id, g]));

  // Construir query base para miembros
  const memberWhere: any = {
    groupId: groupIds
  };

  // Filtro por cursor (paginación)
  if (cursor) {
    const cursorId = parseInt(cursor, 10);
    if (!isNaN(cursorId)) {
      memberWhere.id = { [Op.lt]: cursorId };
    }
  }

  // Obtener todos los miembros que cumplan los filtros
  const allMembers = await Member.findAll({
    where: memberWhere,
    order: [["createdAt", "DESC"]]
  });

  // Obtener todos los eventos de los grupos para calcular status y summary
  const allEvents = await BirthdayEvent.findAll({
    where: { groupId: groupIds }
  });

  // Obtener todos los pagos para calcular pendingPayments
  const eventIds = allEvents.map(e => e.id);
  const allPayments = eventIds.length > 0
    ? await Payment.findAll({
        where: { birthdayEventId: eventIds }
      })
    : [];

  // Agrupar pagos por evento para calcular totalPaid
  const paymentsByEvent = new Map<number, typeof allPayments>();
  allPayments.forEach(payment => {
    const eventId = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
    if (!paymentsByEvent.has(eventId)) {
      paymentsByEvent.set(eventId, []);
    }
    paymentsByEvent.get(eventId)!.push(payment);
  });

  // Crear map de eventos por miembro para determinar status
  const eventsByMember = new Map<number, typeof allEvents>();
  allEvents.forEach(event => {
    const memberId = event.getDataValue("memberId") || event.memberId;
    if (!eventsByMember.has(memberId)) {
      eventsByMember.set(memberId, []);
    }
    eventsByMember.get(memberId)!.push(event);
  });

  // Construir lista de miembros con información del grupo
  let membersList: MemberListItem[] = allMembers.map(member => {
    const group = groupsMap.get(member.getDataValue("groupId") || member.groupId);
    const memberEvents = eventsByMember.get(member.id) || [];
    
    // Determinar status: active si tiene eventos, pending si no
    const memberStatus: "active" | "pending" | "inactive" = 
      memberEvents.length > 0 ? "active" : "pending";

    const birthdayValue = member.getDataValue("birthday") || member.birthday;
    const phoneValue = member.getDataValue("phone") || member.phone;
    const photoUrlValue = member.getDataValue("photoUrl") || member.photoUrl;

    return {
      id: member.id,
      groupId: member.getDataValue("groupId") || member.groupId,
      name: member.getDataValue("name") || member.name || "",
      ...(includePhone && phoneValue !== null && phoneValue !== undefined
        ? { phone: phoneValue }
        : {}),
      birthday: birthdayValue
        ? formatDateOnlyFromUTC(birthdayValue)
        : "",
      ...(includePhotoUrl
        ? { photoUrl: photoUrlValue !== null && photoUrlValue !== undefined ? photoUrlValue : null }
        : {}),
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      groupName: group ? (group.getDataValue("name") || group.name || "") : "",
      status: memberStatus
    };
  });

  // Aplicar filtro por búsqueda
  if (search) {
    const searchLower = search.toLowerCase();
    membersList = membersList.filter(member => {
      const memberName = member.name.toLowerCase();
      const groupName = member.groupName.toLowerCase();
      return memberName.includes(searchLower) || groupName.includes(searchLower);
    });
  }

  // Aplicar filtro por mes de cumpleaños
  if (month !== undefined && month >= 1 && month <= 12) {
    membersList = membersList.filter(member => {
      const birthdayDate = member.birthday;
      if (!birthdayDate) return false;
      const birthdayMonth = parseInt(birthdayDate.split("-")[1], 10);
      return birthdayMonth === month;
    });
  }

  // Aplicar filtro por status
  if (status !== "all") {
    membersList = membersList.filter(member => member.status === status);
  }

  // Aplicar límite y cursor pagination
  const limitedMembers = membersList.slice(0, limit);
  const hasMore = membersList.length > limit;
  const nextCursor = limitedMembers.length > 0 && hasMore
    ? limitedMembers[limitedMembers.length - 1].id.toString()
    : undefined;

  // Calcular summary si se solicita
  let summary: MemberSummary | undefined;
  if (includeSummary) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const currentMonth = now.getMonth() + 1; // 1-12

    // Total de miembros
    const totalMembers = membersList.length;

    // Nuevos miembros esta semana
    const newMembersThisWeek = membersList.filter(m => {
      const createdAt = new Date(m.createdAt);
      return createdAt >= oneWeekAgo;
    }).length;

    // Cumpleaños este mes
    const birthdaysThisMonth = membersList.filter(m => {
      if (!m.birthday) return false;
      const birthdayMonth = parseInt(m.birthday.split("-")[1], 10);
      return birthdayMonth === currentMonth;
    }).length;

    // Próximo cumpleaños
    let nextBirthday: { name: string; date: string } | undefined;
    const today = new Date();
    const currentYear = today.getFullYear();
    const upcomingBirthdays = membersList
      .filter(m => m.birthday)
      .map(m => {
        const [year, month, day] = m.birthday.split("-").map(Number);
        let birthdayDate = new Date(currentYear, month - 1, day);
        
        // Si el cumpleaños ya pasó este año, usar el próximo año
        if (birthdayDate < today) {
          birthdayDate = new Date(currentYear + 1, month - 1, day);
        }
        
        return {
          name: m.name,
          date: m.birthday,
          dateObj: birthdayDate
        };
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    if (upcomingBirthdays.length > 0) {
      nextBirthday = {
        name: upcomingBirthdays[0].name,
        date: upcomingBirthdays[0].date
      };
    }

    // Eventos con pagos incompletos
    const pendingPayments = allEvents.filter(event => {
      const eventPayments = paymentsByEvent.get(event.id) || [];
      const totalPaid = eventPayments.reduce((sum, payment) => {
        const amount = payment.getDataValue("amount") || payment.amount || 0;
        return sum + Number(amount);
      }, 0);
      const expectedAmount = event.getDataValue("expectedAmount") || event.expectedAmount || 0;
      return totalPaid < Number(expectedAmount);
    }).length;

    summary = {
      totalMembers,
      newMembersThisWeek,
      birthdaysThisMonth,
      ...(nextBirthday ? { nextBirthday } : {}),
      pendingPayments
    };
  }

  return {
    message: "Miembros obtenidos exitosamente",
    members: limitedMembers,
    ...(summary ? { summary } : {}),
    ...(nextCursor
      ? {
          pagination: {
            cursor: nextCursor,
            hasMore
          }
        }
      : {})
  };
};
