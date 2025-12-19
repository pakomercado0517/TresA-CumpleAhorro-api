import { BirthdayEvent } from "../models/BirthdayEvent";
import { Group } from "../models/Group";
import { Member } from "../models/Member";
import { Payment } from "../models/Payment";
import { PublicEventResponse } from "../types/public.types";
import { formatDateOnlyFromUTC } from "../utils/date.util";

/**
 * Calcula el estado del evento basado en pagos y fecha
 * @param totalPaid - Total pagado
 * @param totalExpected - Total esperado
 * @param birthdayDate - Fecha del cumpleaños (string "yyyy-MM-dd")
 * @returns Objeto con label y value del status
 */
const calculateEventStatus = (
  totalPaid: number,
  totalExpected: number,
  birthdayDate: string
): { label: string; value: "active" | "completed" | "pending" | "upcoming" } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Completado: se alcanzó la meta
  if (totalPaid >= totalExpected) {
    return {
      label: "Completado",
      value: "completed"
    };
  }

  // Recolección activa: hay pagos pero no está completo
  if (totalPaid > 0) {
    return {
      label: "Recolección Activa",
      value: "active"
    };
  }

  // Sin pagos aún
  // Próximo: fecha futura
  if (birthdayDate > todayStr) {
    return {
      label: "Próximo",
      value: "upcoming"
    };
  }

  // Pendiente: fecha pasada o presente sin pagos
  return {
    label: "Pendiente",
    value: "pending"
  };
};

/**
 * Obtiene información pública de un evento
 * No requiere autenticación - acceso público
 * @param eventId - ID del evento
 * @returns Información pública del evento
 * @throws Error si el evento no existe
 */
export const getPublicEventById = async (
  eventId: number
): Promise<PublicEventResponse> => {
  // Obtener el evento
  const event = await BirthdayEvent.findByPk(eventId);

  if (!event) {
    const error = new Error("Evento no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  const groupIdValue = event.getDataValue("groupId") || event.groupId;
  const memberIdValue = event.getDataValue("memberId") || event.memberId;
  const birthdayDateValue = event.getDataValue("birthdayDate") || event.birthdayDate;
  const expectedAmountValue = event.getDataValue("expectedAmount") || event.expectedAmount;

  if (!groupIdValue || !memberIdValue) {
    const error = new Error("Datos del evento incompletos");
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

  // Obtener todos los miembros del grupo
  const allMembers = await Member.findAll({
    where: { groupId: groupIdValue },
    order: [["createdAt", "DESC"]]
  });

  // Obtener el miembro del evento (cumpleañero)
  const eventMember = allMembers.find(m => m.id === memberIdValue);
  if (!eventMember) {
    const error = new Error("Miembro del evento no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener todos los pagos del evento
  const payments = await Payment.findAll({
    where: { birthdayEventId: eventId },
    order: [["datePaid", "DESC"]]
  });

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

  const remaining = Math.max(0, totalExpected - totalPaid);

  // Calcular status
  const birthdayDateStr = typeof birthdayDateValue === "string"
    ? birthdayDateValue
    : formatDateOnlyFromUTC(birthdayDateValue);
  
  const status = calculateEventStatus(totalPaid, totalExpected, birthdayDateStr);

  // Obtener valores del grupo
  const groupNameValue = group.getDataValue("name") || group.name;
  const amountPerBirthdayValue = group.getDataValue("amountPerBirthday") || group.amountPerBirthday;

  // Construir respuesta
  const response: PublicEventResponse = {
    message: "Evento obtenido exitosamente",
    event: {
      id: event.id,
      memberId: memberIdValue,
      groupId: groupIdValue,
      birthdayDate: birthdayDateStr,
      expectedAmount: Number(totalExpected.toFixed(2)),
      member: {
        id: eventMember.id,
        name: eventMember.getDataValue("name") || eventMember.name || "",
        photoUrl: eventMember.getDataValue("photoUrl") || eventMember.photoUrl || null
      }
    },
    group: {
      id: group.id,
      ...(groupNameValue ? { name: groupNameValue } : {}),
      amountPerBirthday: Number(amountPerBirthdayValue || 0),
      totalMembers: allMembers.length
    },
    members: allMembers.map(member => ({
      id: member.id,
      name: member.getDataValue("name") || member.name || "",
      photoUrl: member.getDataValue("photoUrl") || member.photoUrl || null
    })),
    payments: payments.map(payment => ({
      id: payment.id,
      memberId: payment.getDataValue("memberId") || payment.memberId || 0,
      amount: Number(payment.getDataValue("amount") || payment.amount || 0),
      datePaid: formatDateOnlyFromUTC(
        payment.getDataValue("datePaid") || payment.datePaid
      ),
      proofUrl: payment.getDataValue("proofUrl") || payment.proofUrl || null
    })),
    summary: {
      totalPaid: Number(totalPaid.toFixed(2)),
      totalExpected: Number(totalExpected.toFixed(2)),
      percentageCompleted,
      remaining: Number(remaining.toFixed(2))
    },
    status
  };

  return response;
};





