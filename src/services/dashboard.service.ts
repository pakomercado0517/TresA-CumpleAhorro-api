import { Op } from "sequelize";

import { BirthdayEvent } from "../models/BirthdayEvent";
import { Group } from "../models/Group";
import { Member } from "../models/Member";
import { Payment } from "../models/Payment";
import { DashboardResponse, DashboardSummary, UpcomingBirthday, GetDashboardQueryParams } from "../types/dashboard.types";
import { formatDateOnlyFromUTC } from "../utils/date.util";

/**
 * Obtiene información del dashboard del usuario
 * Incluye resumen y próximos cumpleaños
 * @param userId - ID del usuario autenticado
 * @param options - Opciones de filtrado
 * @returns Información del dashboard
 */
export const getDashboard = async (
  userId: number,
  options: GetDashboardQueryParams = {}
): Promise<DashboardResponse> => {
  const {
    limit = 10,
    days = 30,
    includePhotoUrl = true
  } = options;

  // Obtener todos los grupos del usuario
  const userGroups = await Group.findAll({
    where: { userId },
    attributes: ["id", "name"]
  });

  const groupIds = userGroups.map(g => g.id);
  const groupsMap = new Map(userGroups.map(g => [g.id, g]));

  // Calcular fecha de inicio y fin para próximos cumpleaños
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  
  const todayStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const endDateStr = endDate.toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Obtener eventos en el rango de fechas
  // Nota: birthdayDate es DATEONLY, así que comparamos strings
  const upcomingEvents = await BirthdayEvent.findAll({
    where: {
      groupId: groupIds,
      birthdayDate: {
        [Op.between]: [todayStr, endDateStr]
      }
    },
    order: [["birthdayDate", "ASC"]],
    limit: limit
  });

  // Obtener todos los miembros de los grupos
  const memberIds = [...new Set(upcomingEvents.map(e => e.getDataValue("memberId") || e.memberId).filter(Boolean))];
  const allMembers = memberIds.length > 0
    ? await Member.findAll({
        where: { id: memberIds }
      })
    : [];
  const membersMap = new Map(allMembers.map(m => [m.id, m]));

  // Obtener todos los pagos de los eventos
  const eventIds = upcomingEvents.map(e => e.id);
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

  // Construir lista de próximos cumpleaños
  const upcomingBirthdays: UpcomingBirthday[] = upcomingEvents.map(event => {
    const eventId = event.id;
    const memberId = event.getDataValue("memberId") || event.memberId;
    const member = membersMap.get(memberId);
    const group = groupsMap.get(event.getDataValue("groupId") || event.groupId);
    
    const birthdayDateValue = event.getDataValue("birthdayDate") || event.birthdayDate;
    const expectedAmountValue = event.getDataValue("expectedAmount") || event.expectedAmount;
    
    // Calcular total pagado
    const eventPayments = paymentsByEvent.get(eventId) || [];
    const totalPaid = eventPayments.reduce((sum, payment) => {
      const amount = payment.getDataValue("amount") || payment.amount || 0;
      return sum + Number(amount);
    }, 0);
    
    const expectedAmount = expectedAmountValue !== null && expectedAmountValue !== undefined
      ? Number(expectedAmountValue)
      : 0;

    // Determinar paymentStatus
    let paymentStatus: "paid" | "pending" | "overdue";
    const eventDateStr = typeof birthdayDateValue === "string" 
      ? birthdayDateValue 
      : birthdayDateValue.toISOString().split("T")[0];
    
    if (totalPaid >= expectedAmount) {
      paymentStatus = "paid";
    } else if (eventDateStr < todayStr) {
      paymentStatus = "overdue";
    } else {
      paymentStatus = "pending";
    }

    const memberName = member ? (member.getDataValue("name") || member.name || "") : "";
    const groupName = group ? (group.getDataValue("name") || group.name || "") : "";
    const photoUrlValue = member ? (member.getDataValue("photoUrl") || member.photoUrl) : null;

    return {
      id: eventId,
      eventId: eventId,
      memberId: memberId || 0,
      name: memberName,
      groupName: groupName,
      birthdayDate: birthdayDateValue
        ? formatDateOnlyFromUTC(birthdayDateValue)
        : "",
      ...(includePhotoUrl
        ? { photoUrl: photoUrlValue !== null && photoUrlValue !== undefined ? photoUrlValue : null }
        : {}),
      paymentStatus,
      expectedAmount: Number(expectedAmount.toFixed(2))
    };
  });

  // Calcular summary
  // 1. upcomingBirthdays: total de eventos en el rango (no solo los limitados)
  const allUpcomingEvents = await BirthdayEvent.findAll({
    where: {
      groupId: groupIds,
      birthdayDate: {
        [Op.between]: [todayStr, endDateStr]
      }
    }
  });
  const upcomingBirthdaysCount = allUpcomingEvents.length;

  // 2. paymentsToday: cantidad de pagos del día de hoy
  // Primero obtener todos los eventos de los grupos
  const allGroupEvents = await BirthdayEvent.findAll({
    where: { groupId: groupIds },
    attributes: ["id"]
  });
  const allGroupEventIds = allGroupEvents.map(e => e.id);

  // Luego obtener pagos del día de hoy de esos eventos
  const paymentsToday = allGroupEventIds.length > 0
    ? await Payment.findAll({
        where: {
          datePaid: todayStr,
          birthdayEventId: {
            [Op.in]: allGroupEventIds
          }
        }
      })
    : [];
  const paymentsTodayCount = paymentsToday.length;

  // 3. totalPaymentsToday: suma de montos de pagos del día de hoy
  const totalPaymentsToday = paymentsToday.reduce((sum, payment) => {
    const amount = payment.getDataValue("amount") || payment.amount || 0;
    return sum + Number(amount);
  }, 0);

  // 4. totalGroups: total de grupos creados
  const totalGroups = userGroups.length;

  const summary: DashboardSummary = {
    upcomingBirthdays: upcomingBirthdaysCount,
    paymentsToday: paymentsTodayCount,
    totalPaymentsToday: Number(totalPaymentsToday.toFixed(2)),
    totalGroups
  };

  return {
    message: "Dashboard obtenido exitosamente",
    summary,
    upcomingBirthdays
  };
};

