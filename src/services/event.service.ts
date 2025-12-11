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
 * 
 * IMPORTANTE: Para campos DATEONLY, NO se debe hacer conversión de timezone.
 * Simplemente extraemos mes y día, y creamos la fecha con el año actual.
 * 
 * @param birthday - Fecha de cumpleaños (Date o string "yyyy-MM-dd" de Sequelize)
 * @returns Fecha con el año actual en UTC (medianoche)
 */
const adjustBirthdayToCurrentYear = (birthday: Date | string): Date => {
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
  const currentYear = new Date().getFullYear();
  const birthdayThisYear = `${currentYear}-${month}-${day}`;
  
  // Convertir a Date UTC sin conversión de timezone
  return parseDateOnlyToUTC(birthdayThisYear);
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

  // Obtener valores raw de Sequelize para todos los campos
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
        memberPhoneValue !== null && memberPhoneValue !== undefined ? memberPhoneValue : undefined,
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
};

