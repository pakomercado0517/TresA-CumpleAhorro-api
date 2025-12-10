import { BirthdayEvent } from "../models/BirthdayEvent";
import { Member } from "../models/Member";
import { Group } from "../models/Group";
import { BirthdayEventResponse, GenerateEventsResponse } from "../types/event.types";
import { formatDateOnlyFromUTC, parseDateOnlyToUTC, convertUTCToUserDate } from "../utils/date.util";
import { format, parseISO, isValid } from "date-fns";
import { Op } from "sequelize";

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
 * @param birthday - Fecha de cumpleaños (Date o string "yyyy-MM-dd" de Sequelize)
 * @returns Fecha con el año actual en UTC
 */
const adjustBirthdayToCurrentYear = (birthday: Date | string): Date => {
  let birthdayString: string;
  
  // Convertir a string sin importar el tipo
  if (typeof birthday === "string") {
    // Si ya es string, usarlo directamente
    birthdayString = birthday;
  } else if (birthday instanceof Date) {
    // Si es Date object, convertirlo a string
    try {
      // Intentar obtener el string del Date usando toISOString
      const isoString = birthday.toISOString();
      birthdayString = isoString.split("T")[0]; // Obtener solo la parte de la fecha
    } catch (error) {
      // Si toISOString falla, intentar con getFullYear, getMonth, getDate
      try {
        const year = birthday.getFullYear();
        const month = String(birthday.getMonth() + 1).padStart(2, "0");
        const day = String(birthday.getDate()).padStart(2, "0");
        birthdayString = `${year}-${month}-${day}`;
      } catch (innerError) {
        throw new Error(`Invalid birthday date object: ${birthday}`);
      }
    }
  } else {
    throw new Error(`Invalid birthday type: ${typeof birthday}`);
  }

  // Validar formato yyyy-MM-dd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdayString)) {
    throw new Error(`Invalid birthday date format: ${birthdayString}. Expected yyyy-MM-dd`);
  }

  // Parsear el string como UTC (Sequelize devuelve DATEONLY en UTC)
  // Interpretamos el string como medianoche UTC
  const utcDate = parseISO(`${birthdayString}T00:00:00Z`);
  if (!isValid(utcDate)) {
    throw new Error(`Invalid birthday date string: ${birthdayString}`);
  }

  // Convertir a zona horaria del usuario
  const userDate = convertUTCToUserDate(utcDate);
  const currentYear = new Date().getFullYear();

  // Crear nueva fecha con el año actual
  const adjustedDate = new Date(userDate);
  adjustedDate.setFullYear(currentYear);

  // Convertir de vuelta a UTC
  const adjustedDateString = format(adjustedDate, "yyyy-MM-dd");
  return parseDateOnlyToUTC(adjustedDateString);
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

  return events.map((event) => ({
    id: event.id,
    memberId: event.memberId,
    groupId: event.groupId,
    birthdayDate: formatDateOnlyFromUTC(event.birthdayDate),
    expectedAmount: Number(event.expectedAmount),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  }));
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

  // Calcular el monto esperado: número de miembros × monto por cumpleaños
  const expectedAmount = members.length * Number(group.amountPerBirthday);
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
    const yearStart = parseDateOnlyToUTC(`${currentYear}-01-01`);
    const yearEnd = parseDateOnlyToUTC(`${currentYear}-12-31`);

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
      let birthdayDateFormatted: string;
      if (birthdayDateValue === null || birthdayDateValue === undefined) {
        // Si es null/undefined, convertir el Date que ya tenemos a string en zona horaria del usuario
        const userDate = convertUTCToUserDate(birthdayThisYear);
        birthdayDateFormatted = format(userDate, "yyyy-MM-dd");
      } else {
        birthdayDateFormatted = formatDateOnlyFromUTC(birthdayDateValue);
      }

      eventsCreated.push({
        id: event.id,
        memberId: event.memberId,
        groupId: event.groupId,
        birthdayDate: birthdayDateFormatted,
        expectedAmount: Number(event.expectedAmount),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
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
 * Obtiene un evento por ID, verificando que pertenezca a un grupo del usuario
 * @param eventId - ID del evento
 * @param userId - ID del usuario autenticado
 * @returns Evento encontrado con información del miembro
 * @throws Error si el evento no existe o no pertenece a un grupo del usuario
 */
export const getEventById = async (
  eventId: number,
  userId: number
): Promise<BirthdayEventResponse> => {
  const event = await BirthdayEvent.findOne({
    where: { id: eventId },
    include: [
      {
        model: Group,
        as: "group",
        where: { userId }
      },
      {
        model: Member,
        as: "member"
      }
    ]
  });

  if (!event) {
    const error = new Error("Evento no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  return {
    id: event.id,
    memberId: event.memberId,
    groupId: event.groupId,
    birthdayDate: formatDateOnlyFromUTC(event.birthdayDate),
    expectedAmount: Number(event.expectedAmount),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    member: event.member
      ? {
          id: event.member.id,
          groupId: event.member.groupId,
          name: event.member.name,
          phone: event.member.phone ?? undefined,
          birthday: formatDateOnlyFromUTC(event.member.birthday),
          photoUrl: event.member.photoUrl ?? undefined,
          createdAt: event.member.createdAt,
          updatedAt: event.member.updatedAt
        }
      : undefined
  };
};

