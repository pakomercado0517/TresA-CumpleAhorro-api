import { Op } from "sequelize";

import { BirthdayEvent } from "../models/BirthdayEvent";
import { Group } from "../models/Group";
import { Member } from "../models/Member";
import { Payment } from "../models/Payment";
import { BirthdayEventResponse, GenerateEventsResponse, EventListResponse, EventListItem, EventSummary, GetEventsQueryParams, EventDetailResponse } from "../types/event.types";
import { formatDateOnlyFromUTC } from "../utils/date.util";

/**
 * Verifica que un grupo pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @returns Grupo encontrado
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
const verifyGroupOwnership = async (
  groupId: number,
  userId: number
): Promise<Group> => {
  const group = await Group.findOne({
    where: { id: groupId, userId }
  });

  if (!group) {
    const error = new Error("Grupo no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  return group;
};

/**
 * Ajusta el año de una fecha al año actual
 * 
 * IMPORTANTE: Para campos DATEONLY, NO se debe hacer conversión de timezone.
 * Simplemente extraemos mes y día, y creamos la fecha con el año actual.
 * 
 * @param birthday - Fecha de cumpleaños (Date o string "yyyy-MM-dd" de Sequelize)
 * @returns String en formato "YYYY-MM-DD" con el año actual
 */
const adjustBirthdayToCurrentYear = (birthday: Date | string): string => {
  let birthdayString: string;
  
  // Convertir a string sin importar el tipo
  if (typeof birthday === "string") {
    // Si ya es string, usarlo directamente
    birthdayString = birthday;
  } else if (birthday instanceof Date) {
    // Si es Date object, extraer la fecha en UTC
    const year = birthday.getUTCFullYear();
    const month = String(birthday.getUTCMonth() + 1).padStart(2, "0");
    const day = String(birthday.getUTCDate()).padStart(2, "0");
    birthdayString = `${year}-${month}-${day}`;
  } else {
    throw new Error(`Invalid birthday type: ${typeof birthday}`);
  }

  // Validar formato yyyy-MM-dd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdayString)) {
    throw new Error(`Invalid birthday date format: ${birthdayString}. Expected yyyy-MM-dd`);
  }

  // Extraer mes y día del birthday original
  const [, month, day] = birthdayString.split("-");
  
  // Crear fecha con el año actual, preservando mes y día
  // Para DATEONLY, devolver string directamente, NO Date object
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${month}-${day}`;
};

/**
 * Recalcula el expectedAmount de todos los eventos de un grupo
 * basado en el número actual de miembros y el amountPerBirthday
 * 
 * @param groupId - ID del grupo
 * @returns Número de eventos actualizados
 */
export const recalculateGroupEventsExpectedAmount = async (
  groupId: number
): Promise<number> => {
  try {
    // Obtener el grupo
    const group = await Group.findByPk(groupId);
    
    if (!group) {
      return 0;
    }

    // Obtener todos los miembros del grupo
    const members = await Member.findAll({
      where: { groupId }
    });

    // Si no hay miembros, actualizar todos los eventos a 0
    if (members.length === 0) {
      const [updatedCount] = await BirthdayEvent.update(
        { expectedAmount: 0 },
        { where: { groupId } }
      );
      return updatedCount;
    }

    // Obtener amountPerBirthday del grupo
    const amountPerBirthdayValue = group.getDataValue("amountPerBirthday") || group.amountPerBirthday;
    
    if (!amountPerBirthdayValue || amountPerBirthdayValue <= 0) {
      return 0;
    }

    // Calcular el nuevo expectedAmount: número de miembros × amountPerBirthday
    // Todos los miembros pagan, incluyendo el cumpleañero
    const newExpectedAmount = members.length * Number(amountPerBirthdayValue);

    // Actualizar todos los eventos de este grupo
    const [updatedCount] = await BirthdayEvent.update(
      { expectedAmount: newExpectedAmount },
      { where: { groupId } }
    );

    return updatedCount;
  } catch (error) {
    console.error(`[recalculateGroupEventsExpectedAmount] Error en grupo ${groupId}:`, error);
    throw error;
  }
};

/**
 * Obtiene todos los eventos de un grupo, verificando que el grupo pertenezca al usuario
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @returns Lista de eventos del grupo
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const getGroupEvents = async (
  groupId: number,
  userId: number
): Promise<BirthdayEventResponse[]> => {
  await verifyGroupOwnership(groupId, userId);

  // IMPORTANTE: Recalcular expectedAmount antes de devolver los eventos
  // para asegurar que reflejen el número actual de miembros
  await recalculateGroupEventsExpectedAmount(groupId);
  
  const events = await BirthdayEvent.findAll({
    where: { groupId },
    include: [
      {
        model: Member,
        as: "member"
      }
    ],
    order: [["birthdayDate", "ASC"]]
  });

  return events.map((event) => {
    // Obtener valores raw de Sequelize para asegurar que se obtengan correctamente
    const birthdayDateValue = event.getDataValue("birthdayDate") || event.birthdayDate;
    const memberIdValue = event.getDataValue("memberId") || event.memberId;
    const groupIdValue = event.getDataValue("groupId") || event.groupId;
    const expectedAmountValue = event.getDataValue("expectedAmount") || event.expectedAmount;

    // Construir objeto de respuesta con todos los campos explícitamente
    const response: BirthdayEventResponse = {
      id: event.id,
      memberId: memberIdValue || 0,
      groupId: groupIdValue || 0,
      birthdayDate:
        birthdayDateValue !== null && birthdayDateValue !== undefined
          ? formatDateOnlyFromUTC(birthdayDateValue)
          : "",
      expectedAmount:
        expectedAmountValue !== null && expectedAmountValue !== undefined
          ? Number(expectedAmountValue)
          : 0,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };

    // Si hay información del miembro, incluirla
    if (event.member) {
      const memberBirthdayValue = event.member.getDataValue("birthday") || event.member.birthday;
      const memberNameValue = event.member.getDataValue("name") || event.member.name;
      const memberPhoneValue = event.member.getDataValue("phone") || event.member.phone;
      const memberPhotoUrlValue = event.member.getDataValue("photoUrl") || event.member.photoUrl;

      response.member = {
        id: event.member.id,
        groupId: event.member.groupId,
        name: memberNameValue || "",
        phone:
          memberPhoneValue !== null && memberPhoneValue !== undefined
            ? memberPhoneValue
            : undefined,
        birthday:
          memberBirthdayValue !== null && memberBirthdayValue !== undefined
            ? formatDateOnlyFromUTC(memberBirthdayValue)
            : "",
        photoUrl:
          memberPhotoUrlValue !== null && memberPhotoUrlValue !== undefined
            ? memberPhotoUrlValue
            : undefined,
        createdAt: event.member.createdAt,
        updatedAt: event.member.updatedAt
      };
    }

    return response;
  });
};

/**
 * Genera eventos de cumpleaños para el año actual de todos los miembros de un grupo
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @returns Información sobre los eventos creados
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const generateEventsForCurrentYear = async (
  groupId: number,
  userId: number
): Promise<GenerateEventsResponse> => {
  const group = await verifyGroupOwnership(groupId, userId);

  // Obtener todos los miembros del grupo
  const members = await Member.findAll({
    where: { groupId }
  });

  if (members.length === 0) {
    return {
      message: "No hay miembros en el grupo para generar eventos",
      eventsCreated: 0,
      events: []
    };
  }

  // Obtener amountPerBirthday usando getDataValue para asegurar que se obtenga correctamente
  const amountPerBirthdayValue = group.getDataValue("amountPerBirthday") || group.amountPerBirthday;
  
  if (!amountPerBirthdayValue) {
    const error = new Error("No se pudo obtener el monto por cumpleaños del grupo");
    error.name = "ValidationError";
    throw error;
  }

  // Calcular el monto esperado: número de miembros × monto por cumpleaños
  // Todos los miembros pagan, incluyendo el cumpleañero
  const expectedAmount = members.length * Number(amountPerBirthdayValue);
  const currentYear = new Date().getFullYear();
  const eventsCreated: BirthdayEventResponse[] = [];

  // Para cada miembro, crear un evento si no existe ya uno para el año actual
  for (const member of members) {
    // Obtener el birthday del miembro
    // Sequelize puede devolverlo como string o Date, obtener el valor crudo
    const birthdayValue = member.getDataValue("birthday") || member.birthday;
    
    // Ajustar el cumpleaños al año actual
    const birthdayThisYear = adjustBirthdayToCurrentYear(birthdayValue);

    // Verificar si ya existe un evento para este miembro en este año
    // Buscamos eventos del mismo miembro y grupo cuyo año coincida
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    const existingEvent = await BirthdayEvent.findOne({
      where: {
        memberId: member.id,
        groupId: group.id,
        birthdayDate: {
          [Op.between]: [yearStart, yearEnd]
        }
      }
    });

    // Si no existe, crear el evento
    if (!existingEvent) {
      const event = await BirthdayEvent.create({
        memberId: member.id,
        groupId: group.id,
        birthdayDate: birthdayThisYear,
        expectedAmount
      } as unknown as BirthdayEvent);

      // Obtener el birthdayDate del evento creado
      // Sequelize puede devolverlo como string o Date, obtener el valor crudo
      const birthdayDateValue = event.getDataValue("birthdayDate") || event.birthdayDate;
      
      // Formatear la fecha para la respuesta
      // IMPORTANTE: Para DATEONLY, NO aplicar conversión de timezone
      const birthdayDateFormatted =
        birthdayDateValue !== null && birthdayDateValue !== undefined
          ? formatDateOnlyFromUTC(birthdayDateValue)
          : birthdayThisYear; // birthdayThisYear ya es un string "YYYY-MM-DD"

      // Obtener información completa del miembro para la respuesta
      const memberBirthdayValue = member.getDataValue("birthday") || member.birthday;
      const memberNameValue = member.getDataValue("name") || member.name;
      const memberPhoneValue = member.getDataValue("phone") || member.phone;
      const memberPhotoUrlValue = member.getDataValue("photoUrl") || member.photoUrl;

      eventsCreated.push({
        id: event.id,
        memberId: event.memberId,
        groupId: event.groupId,
        birthdayDate: birthdayDateFormatted,
        expectedAmount: Number(event.expectedAmount),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        member: {
          id: member.id,
          groupId: member.groupId,
          name: memberNameValue || "",
          phone: memberPhoneValue !== null && memberPhoneValue !== undefined ? memberPhoneValue : undefined,
          birthday:
            memberBirthdayValue !== null && memberBirthdayValue !== undefined
              ? formatDateOnlyFromUTC(memberBirthdayValue)
              : "",
          photoUrl: memberPhotoUrlValue !== null && memberPhotoUrlValue !== undefined ? memberPhotoUrlValue : undefined,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt
        }
      });
    }
  }

  return {
    message: `Se generaron ${eventsCreated.length} evento(s) para el año ${currentYear}`,
    eventsCreated: eventsCreated.length,
    events: eventsCreated
  };
};

/**
 * Obtiene un evento por ID con información completa
 * Incluye grupo, todos los miembros del grupo, pagos y summary
 * @param eventId - ID del evento
 * @param userId - ID del usuario autenticado
 * @returns Evento con información completa
 * @throws Error si el evento no existe o no pertenece a un grupo del usuario
 */
export const getEventById = async (
  eventId: number,
  userId: number
): Promise<EventDetailResponse> => {
  // Obtener el evento verificando que pertenezca a un grupo del usuario
  const event = await BirthdayEvent.findOne({
    where: { id: eventId },
    include: [
      {
        model: Group,
        as: "group",
        where: { userId },
        required: true
      }
    ]
  });

  if (!event) {
    const error = new Error("Evento no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  const groupIdValue = event.getDataValue("groupId") || event.groupId;
  if (!groupIdValue) {
    const error = new Error("Grupo no encontrado para el evento");
    error.name = "NotFoundError";
    throw error;
  }

  // IMPORTANTE: Recalcular expectedAmount antes de devolver el evento
  await recalculateGroupEventsExpectedAmount(groupIdValue);
  
  // Volver a consultar el evento para obtener el expectedAmount actualizado
  const updatedEvent = await BirthdayEvent.findByPk(eventId);
  if (!updatedEvent) {
    const error = new Error("Evento no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener el grupo
  const group = await Group.findByPk(groupIdValue);
  if (!group) {
    const error = new Error("Grupo no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener todos los miembros del grupo (no solo los que pagaron)
  const allMembers = await Member.findAll({
    where: { groupId: groupIdValue },
    order: [["createdAt", "DESC"]]
  });

  // Obtener el miembro del evento (cumpleañero)
  const memberIdValue = updatedEvent.getDataValue("memberId") || updatedEvent.memberId;
  const eventMember = allMembers.find(m => m.id === memberIdValue);

  // Obtener todos los pagos del evento
  const payments = await Payment.findAll({
    where: { birthdayEventId: eventId },
    order: [["datePaid", "DESC"]]
  });

  // Obtener valores del evento
  const birthdayDateValue = updatedEvent.getDataValue("birthdayDate") || updatedEvent.birthdayDate;
  const expectedAmountValue = updatedEvent.getDataValue("expectedAmount") || updatedEvent.expectedAmount;

  // Calcular summary
  const totalPaid = payments.reduce((sum, payment) => {
    const amountValue = payment.getDataValue("amount") || payment.amount || 0;
    return sum + Number(amountValue);
  }, 0);

  const totalExpected = expectedAmountValue !== null && expectedAmountValue !== undefined
    ? Number(expectedAmountValue)
    : 0;

  const percentageCompleted = totalExpected > 0
    ? Number(((totalPaid / totalExpected) * 100).toFixed(2))
    : 0;

  // Construir respuesta con la nueva estructura
  const response: EventDetailResponse = {
    event: {
      id: updatedEvent.id,
      memberId: memberIdValue || 0,
      groupId: groupIdValue,
      birthdayDate:
        birthdayDateValue !== null && birthdayDateValue !== undefined
          ? formatDateOnlyFromUTC(birthdayDateValue)
          : "",
      expectedAmount: totalExpected,
      member: {
        id: eventMember?.id || 0,
        name: eventMember ? (eventMember.getDataValue("name") || eventMember.name || "") : "",
        photoUrl: eventMember
          ? (eventMember.getDataValue("photoUrl") || eventMember.photoUrl || null)
          : null
      }
    },
    group: {
      id: group.id,
      amountPerBirthday: Number(group.getDataValue("amountPerBirthday") || group.amountPerBirthday || 0)
    },
    members: allMembers.map(member => ({
      id: member.id,
      name: member.getDataValue("name") || member.name || "",
      photoUrl: member.getDataValue("photoUrl") || member.photoUrl || null
    })),
    payments: payments.map(payment => {
      const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
      const amountValue = payment.getDataValue("amount") || payment.amount;
      
      return {
        id: payment.id,
        memberId: payment.getDataValue("memberId") || payment.memberId || 0,
        amount: amountValue !== null && amountValue !== undefined ? Number(amountValue) : 0,
        datePaid:
          datePaidValue !== null && datePaidValue !== undefined
            ? formatDateOnlyFromUTC(datePaidValue)
            : "",
        proofUrl: payment.getDataValue("proofUrl") || payment.proofUrl || null
      };
    }),
    summary: {
      totalPaid: Number(totalPaid.toFixed(2)),
      totalExpected: Number(totalExpected.toFixed(2)),
      percentageCompleted
    }
  };

  return response;
};

/**
 * Obtiene todos los eventos del usuario con información completa
 * Incluye información del grupo y del miembro, con filtros y paginación
 * @param userId - ID del usuario autenticado
 * @param options - Opciones de filtrado y paginación
 * @returns Lista de eventos con información completa
 */
export const getUserEvents = async (
  userId: number,
  options: GetEventsQueryParams = {}
): Promise<EventListResponse> => {
  const {
    year,
    cursor,
    limit = 20,
    status = "all",
    search,
    sortBy = "birthdayDate",
    sortOrder = "DESC",
    includeGroupName = false,
    includeTimestamps = false
  } = options;

  // Obtener todos los grupos del usuario
  const userGroups = await Group.findAll({
    where: { userId },
    attributes: ["id", "name", "amountPerBirthday"]
  });

  if (userGroups.length === 0) {
    return {
      message: "Eventos obtenidos exitosamente",
      events: [],
      summary: {
        totalEvents: 0,
        totalExpected: 0,
        totalPaid: 0,
        percentageCompleted: 0
      }
    };
  }

  const groupIds = userGroups.map(g => g.id);
  const groupsMap = new Map(userGroups.map(g => [g.id, g]));

  // Construir query base para eventos
  const eventWhere: any = {
    groupId: groupIds
  };

  // Filtro por año
  if (year !== undefined) {
    // Filtrar por año del birthdayDate
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    eventWhere.birthdayDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  // Filtro por cursor (paginación)
  if (cursor) {
    const cursorId = parseInt(cursor, 10);
    if (!isNaN(cursorId)) {
      // Para cursor pagination, obtener eventos con ID menor/mayor que el cursor
      // dependiendo del orden
      if (sortOrder === "DESC") {
        eventWhere.id = { [Op.lt]: cursorId };
      } else {
        eventWhere.id = { [Op.gt]: cursorId };
      }
    }
  }

  // Obtener todos los eventos que cumplan los filtros
  const allEvents = await BirthdayEvent.findAll({
    where: eventWhere
  });

  if (allEvents.length === 0) {
    return {
      message: "Eventos obtenidos exitosamente",
      events: [],
      summary: {
        totalEvents: 0,
        totalExpected: 0,
        totalPaid: 0,
        percentageCompleted: 0
      }
    };
  }

  // Obtener todos los memberIds únicos de los eventos
  const memberIds = [...new Set(allEvents.map(e => e.getDataValue("memberId") || e.memberId).filter(Boolean))];
  
  // Cargar todos los miembros de una vez para evitar N+1 queries
  const allMembers = memberIds.length > 0
    ? await Member.findAll({
        where: { id: memberIds }
      })
    : [];

  // Crear map de miembros para acceso rápido
  const membersMap = new Map(allMembers.map(m => [m.id, m]));

  // Obtener conteo de miembros por grupo para memberCount
  const memberCountsByGroup = new Map<number, number>();
  for (const groupId of groupIds) {
    const count = await Member.count({ where: { groupId } });
    memberCountsByGroup.set(groupId, count);
  }

  // Obtener todos los pagos de los eventos
  const eventIds = allEvents.map(e => e.id);
  const allPayments = eventIds.length > 0
    ? await Payment.findAll({
        where: { birthdayEventId: eventIds }
      })
    : [];

  // Agrupar pagos por evento
  const paymentsByEvent = new Map<number, typeof allPayments>();
  allPayments.forEach(payment => {
    const eventId = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
    if (!paymentsByEvent.has(eventId)) {
      paymentsByEvent.set(eventId, []);
    }
    paymentsByEvent.get(eventId)!.push(payment);
  });

  // Calcular totalPaid para cada evento y construir lista de eventos
  let eventsList: EventListItem[] = allEvents.map(event => {
    const eventPayments = paymentsByEvent.get(event.id) || [];
    const totalPaid = eventPayments.reduce((sum, payment) => {
      const amount = payment.getDataValue("amount") || payment.amount;
      return sum + (amount ? Number(amount) : 0);
    }, 0);

    const group = groupsMap.get(event.getDataValue("groupId") || event.groupId);
    const eventMemberId = event.getDataValue("memberId") || event.memberId;
    const member = eventMemberId ? membersMap.get(eventMemberId) : undefined;
    const memberCount = memberCountsByGroup.get(event.getDataValue("groupId") || event.groupId) || 0;

    const birthdayDateValue = event.getDataValue("birthdayDate") || event.birthdayDate;
    const memberBirthdayValue = member ? (member.getDataValue("birthday") || member.birthday) : null;

    return {
      id: event.id,
      memberId: event.getDataValue("memberId") || event.memberId,
      groupId: event.getDataValue("groupId") || event.groupId,
      birthdayDate: birthdayDateValue
        ? formatDateOnlyFromUTC(birthdayDateValue)
        : "",
      expectedAmount: event.getDataValue("expectedAmount") !== null && event.getDataValue("expectedAmount") !== undefined
        ? Number(event.getDataValue("expectedAmount") || event.expectedAmount)
        : 0,
      totalPaid: Number(totalPaid.toFixed(2)),
      group: {
        id: group?.id || 0,
        ...(includeGroupName && group ? { name: group.getDataValue("name") || group.name || "" } : {}),
        amountPerBirthday: group
          ? Number(group.getDataValue("amountPerBirthday") || group.amountPerBirthday || 0)
          : 0,
        memberCount
      },
      member: {
        id: member?.id || 0,
        groupId: member ? (member.getDataValue("groupId") || member.groupId) : 0,
        name: member ? (member.getDataValue("name") || member.name || "") : "",
        ...(member && member.getDataValue("phone") !== null && member.getDataValue("phone") !== undefined
          ? { phone: member.getDataValue("phone") || member.phone || undefined }
          : {}),
        birthday: memberBirthdayValue
          ? formatDateOnlyFromUTC(memberBirthdayValue)
          : "",
        ...(member && member.getDataValue("photoUrl") !== null && member.getDataValue("photoUrl") !== undefined
          ? { photoUrl: member.getDataValue("photoUrl") || member.photoUrl || undefined }
          : {})
      },
      ...(includeTimestamps
        ? {
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
          }
        : {})
    };
  });

  // Aplicar filtro por status
  if (status !== "all") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    eventsList = eventsList.filter(event => {
      const eventDate = event.birthdayDate;
      const isCompleted = event.totalPaid >= event.expectedAmount;
      const isOverdue = eventDate < todayStr && !isCompleted;
      const isPending = !isCompleted && eventDate >= todayStr;

      switch (status) {
        case "completed":
          return isCompleted;
        case "pending":
          return isPending;
        case "overdue":
          return isOverdue;
        default:
          return true;
      }
    });
  }

  // Aplicar filtro de búsqueda
  if (search) {
    const searchLower = search.toLowerCase();
    eventsList = eventsList.filter(event => {
      const memberName = event.member.name.toLowerCase();
      const groupName = event.group.name?.toLowerCase() || "";
      return memberName.includes(searchLower) || groupName.includes(searchLower);
    });
  }

  // Aplicar ordenamiento
  eventsList.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "birthdayDate":
        aValue = a.birthdayDate;
        bValue = b.birthdayDate;
        break;
      case "createdAt":
        aValue = a.createdAt || "";
        bValue = b.createdAt || "";
        break;
      case "expectedAmount":
        aValue = a.expectedAmount;
        bValue = b.expectedAmount;
        break;
      case "totalPaid":
        aValue = a.totalPaid;
        bValue = b.totalPaid;
        break;
      default:
        aValue = a.birthdayDate;
        bValue = b.birthdayDate;
    }

    if (sortBy === "birthdayDate" || sortBy === "createdAt") {
      // Comparación de strings (fechas)
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === "DESC" ? -comparison : comparison;
    } else {
      // Comparación numérica
      const comparison = aValue - bValue;
      return sortOrder === "DESC" ? -comparison : comparison;
    }
  });

  // Aplicar límite y cursor pagination
  const limitedEvents = eventsList.slice(0, limit);
  const hasMore = eventsList.length > limit;
  const nextCursor = limitedEvents.length > 0 && hasMore
    ? limitedEvents[limitedEvents.length - 1].id.toString()
    : undefined;

  // Calcular summary
  const totalEvents = eventsList.length;
  const totalExpected = eventsList.reduce((sum, e) => sum + e.expectedAmount, 0);
  const totalPaid = eventsList.reduce((sum, e) => sum + e.totalPaid, 0);
  const percentageCompleted = totalExpected > 0
    ? Number(((totalPaid / totalExpected) * 100).toFixed(2))
    : 0;

  return {
    message: "Eventos obtenidos exitosamente",
    events: limitedEvents,
    summary: {
      totalEvents,
      totalExpected: Number(totalExpected.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      percentageCompleted
    },
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
