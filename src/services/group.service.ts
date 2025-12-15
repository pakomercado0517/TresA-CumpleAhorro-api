import { BirthdayEvent } from "../models/BirthdayEvent";
import { Group } from "../models/Group";
import { Member } from "../models/Member";
import { Payment } from "../models/Payment";
import { CreateGroupDto, UpdateGroupDto, GroupResponse, GroupDetailedResponse, GetGroupsQueryParams } from "../types/group.types";
import { formatDateOnlyFromUTC } from "../utils/date.util";

import { recalculateGroupEventsExpectedAmount } from "./event.service";

/**
 * Obtiene todos los grupos de un usuario con información completa
 * Incluye miembros, eventos, pagos y estadísticas
 * @param userId - ID del usuario autenticado
 * @param options - Opciones de filtrado y límites
 * @returns Lista de grupos con información detallada
 */
export const getUserGroups = async (
  userId: number,
  options: GetGroupsQueryParams = {}
): Promise<GroupDetailedResponse[]> => {
  // Valores por defecto
  const {
    limit,
    includeMembers = true,
    includeEvents = true,
    includePayments = true,
    paymentsLimit = 10,
    year
  } = options;

  // Construir query de grupos
  const groupQuery: any = {
    where: { userId },
    order: [["createdAt", "DESC"]]
  };

  // Aplicar límite si se especifica
  if (limit && limit > 0) {
    groupQuery.limit = limit;
  }

  const groups = await Group.findAll(groupQuery);

  // Si no hay grupos, retornar array vacío
  if (groups.length === 0) {
    return [];
  }

  // Obtener IDs de todos los grupos
  const groupIds = groups.map(g => g.id);

  // Cargar datos relacionados (siempre necesarios para estadísticas)
  // Aunque no se incluyan en la respuesta, se necesitan para calcular totales
  const allMembers = await Member.findAll({ where: { groupId: groupIds } });
  const allEvents = await BirthdayEvent.findAll({ where: { groupId: groupIds } });
  
  const eventIds = allEvents.map(e => e.id);
  const allPayments = eventIds.length > 0
    ? await Payment.findAll({
        where: { birthdayEventId: eventIds },
        order: [["datePaid", "DESC"]]
      })
    : [];

  // Crear maps para acceso rápido
  const membersByGroup = new Map<number, typeof allMembers>();
  const eventsByGroup = new Map<number, typeof allEvents>();
  const paymentsByEvent = new Map<number, typeof allPayments>();

  // Agrupar miembros por grupo
  allMembers.forEach(member => {
    const groupId = member.getDataValue("groupId") || member.groupId;
    if (!membersByGroup.has(groupId)) {
      membersByGroup.set(groupId, []);
    }
    membersByGroup.get(groupId)!.push(member);
  });

  // Agrupar eventos por grupo (filtrar por año si se especifica)
  allEvents.forEach(event => {
    // Si se especifica un año, filtrar eventos por ese año
    if (year !== undefined) {
      const birthdayDate = event.getDataValue("birthdayDate") || event.birthdayDate;
      if (birthdayDate) {
        // Convertir a string para extraer el año
        const dateStr = typeof birthdayDate === 'string' 
          ? birthdayDate 
          : birthdayDate.toISOString().split('T')[0];
        const eventYear = parseInt(dateStr.split('-')[0], 10);
        
        // Solo incluir eventos del año especificado
        if (eventYear !== year) {
          return;
        }
      } else {
        return; // Si no hay fecha, excluir
      }
    }
    
    const groupId = event.getDataValue("groupId") || event.groupId;
    if (!eventsByGroup.has(groupId)) {
      eventsByGroup.set(groupId, []);
    }
    eventsByGroup.get(groupId)!.push(event);
  });

  // Agrupar pagos por evento (solo de eventos del año especificado si hay filtro)
  allPayments.forEach(payment => {
    const eventId = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
    
    // Si hay filtro por año, solo incluir pagos de eventos que estén en el map
    if (year !== undefined) {
      // Verificar que el evento esté en el map (ya filtrado por año)
      let eventInYear = false;
      for (const events of eventsByGroup.values()) {
        if (events.some(e => e.id === eventId)) {
          eventInYear = true;
          break;
        }
      }
      if (!eventInYear) {
        return; // Excluir pagos de eventos fuera del año
      }
    }
    
    if (!paymentsByEvent.has(eventId)) {
      paymentsByEvent.set(eventId, []);
    }
    paymentsByEvent.get(eventId)!.push(payment);
  });

  // Construir respuesta detallada para cada grupo
  return groups.map((group) => {
    const groupId = group.id;
    const groupMembers = membersByGroup.get(groupId) || [];
    const groupEvents = eventsByGroup.get(groupId) || [];

    // Calcular total esperado de todos los eventos
    const totalExpected = groupEvents.reduce((sum, event) => {
      const expectedAmount = event.getDataValue("expectedAmount") || event.expectedAmount;
      return sum + (expectedAmount ? Number(expectedAmount) : 0);
    }, 0);

    // Calcular total pagado en el grupo
    let totalPaid = 0;
    groupEvents.forEach(event => {
      const eventPayments = paymentsByEvent.get(event.id) || [];
      eventPayments.forEach(payment => {
        const amount = payment.getDataValue("amount") || payment.amount;
        totalPaid += amount ? Number(amount) : 0;
      });
    });

    // Crear map de miembros para acceso rápido
    const membersMap = new Map(groupMembers.map(m => [m.id, m]));

    // Mapear miembros (solo si se solicita)
    // Ordenar por fecha de creación DESC (más recientes primero)
    const members = includeMembers ? groupMembers
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(member => {
        const phoneValue = member.phone ?? null;
        const photoUrlValue = member.photoUrl ?? null;
        const birthdayValue = member.birthday;
        
        return {
          id: member.id,
          name: member.name,
          phone: phoneValue !== null ? phoneValue : undefined,
          birthday: birthdayValue ? formatDateOnlyFromUTC(birthdayValue) : "",
          photoUrl: photoUrlValue !== null ? photoUrlValue : undefined
        };
      }) : [];

    // Mapear eventos con información del miembro (solo si se solicita)
    // Ordenar por fecha del evento DESC (más próximos/recientes primero)
    const events = includeEvents ? groupEvents
      .sort((a, b) => {
        const dateA = a.getDataValue("birthdayDate") || a.birthdayDate;
        const dateB = b.getDataValue("birthdayDate") || b.birthdayDate;
        // Convertir a string para comparación (YYYY-MM-DD)
        const strA = typeof dateA === 'string' ? dateA : dateA.toISOString().split('T')[0];
        const strB = typeof dateB === 'string' ? dateB : dateB.toISOString().split('T')[0];
        return strB.localeCompare(strA); // DESC
      })
      .map(event => {
        const eventMemberId = event.getDataValue("memberId") || event.memberId;
        const eventMember = membersMap.get(eventMemberId);
        const eventPayments = paymentsByEvent.get(event.id) || [];
        
        const eventTotalPaid = eventPayments.reduce((sum, payment) => {
          const amount = payment.getDataValue("amount") || payment.amount;
          return sum + (amount ? Number(amount) : 0);
        }, 0);

        return {
          id: event.id,
          memberId: eventMemberId,
          memberName: eventMember ? (eventMember.getDataValue("name") || eventMember.name) : "",
          birthdayDate: event.getDataValue("birthdayDate") !== null && event.getDataValue("birthdayDate") !== undefined
            ? formatDateOnlyFromUTC(event.getDataValue("birthdayDate") || event.birthdayDate)
            : "",
          expectedAmount: event.getDataValue("expectedAmount") !== null && event.getDataValue("expectedAmount") !== undefined
            ? Number(event.getDataValue("expectedAmount") || event.expectedAmount)
            : 0,
          totalPaid: Number(eventTotalPaid.toFixed(2))
        };
      }) : [];

    // Obtener pagos recientes del grupo (solo si se solicita)
    let recentPayments: Array<{
      id: number;
      memberId: number;
      memberName: string;
      birthdayEventId: number;
      amount: number;
      datePaid: string;
    }> = [];

    if (includePayments) {
      const groupPayments: typeof allPayments = [];
      groupEvents.forEach(event => {
        const eventPayments = paymentsByEvent.get(event.id) || [];
        groupPayments.push(...eventPayments);
      });
      
      // Ordenar por fecha DESC (más recientes primero) y tomar los N más recientes
      groupPayments.sort((a, b) => {
        const dateA = a.getDataValue("datePaid") || a.datePaid;
        const dateB = b.getDataValue("datePaid") || b.datePaid;
        // Convertir a string para comparación (YYYY-MM-DD)
        const strA = typeof dateA === 'string' ? dateA : dateA.toISOString().split('T')[0];
        const strB = typeof dateB === 'string' ? dateB : dateB.toISOString().split('T')[0];
        return strB.localeCompare(strA); // DESC - más recientes primero
      });

      recentPayments = groupPayments.slice(0, paymentsLimit).map(payment => {
        const paymentMemberId = payment.getDataValue("memberId") || payment.memberId;
        const paymentMember = membersMap.get(paymentMemberId);
        
        return {
          id: payment.id,
          memberId: paymentMemberId,
          memberName: paymentMember ? (paymentMember.getDataValue("name") || paymentMember.name) : "",
          birthdayEventId: payment.getDataValue("birthdayEventId") || payment.birthdayEventId,
          amount: payment.getDataValue("amount") !== null && payment.getDataValue("amount") !== undefined
            ? Number(payment.getDataValue("amount") || payment.amount)
            : 0,
          datePaid: payment.getDataValue("datePaid") !== null && payment.getDataValue("datePaid") !== undefined
            ? formatDateOnlyFromUTC(payment.getDataValue("datePaid") || payment.datePaid)
            : ""
        };
      });
    }

    // Construir respuesta completa
    return {
      id: group.id,
      userId: group.userId,
      name: group.getDataValue("name") || group.name || "",
      amountPerBirthday: group.getDataValue("amountPerBirthday") !== null && group.getDataValue("amountPerBirthday") !== undefined
        ? Number(group.getDataValue("amountPerBirthday") || group.amountPerBirthday)
        : 0,
      description: (() => {
        const desc = group.getDataValue("description") || group.description;
        return desc !== null && desc !== undefined ? desc : undefined;
      })(),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: groupMembers.length,
      eventCount: groupEvents.length,
      totalExpected: Number(totalExpected.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      members,
      events,
      recentPayments
    };
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
    await recalculateGroupEventsExpectedAmount(groupId);
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
