import { Op } from "sequelize";

import { BirthdayEvent } from "../models/BirthdayEvent";
import { Group } from "../models/Group";
import { Member } from "../models/Member";
import { Payment } from "../models/Payment";
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponse,
  PaymentsListResponse,
  PaymentSummary,
  GroupPaymentResponse,
  GroupPaymentsListResponse
} from "../types/payment.types";
import { formatDateOnlyFromUTC } from "../utils/date.util";

import { recalculateGroupEventsExpectedAmount } from "./event.service";

/**
 * Verifica que un evento pertenezca a un grupo del usuario
 * @param eventId - ID del evento
 * @param userId - ID del usuario autenticado
 * @returns Evento encontrado
 * @throws Error si el evento no existe o no pertenece a un grupo del usuario
 */
const verifyEventOwnership = async (
  eventId: number,
  userId: number
): Promise<BirthdayEvent> => {
  const event = await BirthdayEvent.findOne({
    where: { id: eventId },
    include: [
      {
        model: Group,
        as: "group",
        where: { userId }
      }
    ]
  });

  if (!event) {
    const error = new Error("Evento no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  return event;
};

/**
 * Verifica que un miembro pertenezca al grupo de un evento
 * @param memberId - ID del miembro
 * @param groupId - ID del grupo
 * @throws Error si el miembro no existe o no pertenece al grupo
 */
const verifyMemberBelongsToGroup = async (
  memberId: number,
  groupId: number
): Promise<void> => {
  const member = await Member.findOne({
    where: { id: memberId, groupId }
  });

  if (!member) {
    const error = new Error(
      "El miembro no existe o no pertenece al grupo del evento"
    );
    error.name = "ValidationError";
    throw error;
  }
};

/**
 * Calcula el resumen de pagos de un evento
 * @param payments - Lista de pagos
 * @param expectedAmount - Monto esperado del evento
 * @returns Resumen con totales y porcentaje
 */
const calculatePaymentSummary = (
  payments: Payment[],
  expectedAmount: number
): PaymentSummary => {
  // Usar getDataValue() para obtener el amount real de cada pago
  const totalPaid = payments.reduce((sum, payment) => {
    const amountValue = payment.getDataValue("amount") || payment.amount || 0;
    return sum + Number(amountValue);
  }, 0);
  
  const remaining = expectedAmount - totalPaid;
  const percentageCompleted =
    expectedAmount > 0 ? (totalPaid / expectedAmount) * 100 : 0;

  return {
    totalPaid: Number(totalPaid.toFixed(2)),
    totalExpected: Number(expectedAmount),
    remaining: Number(remaining.toFixed(2)),
    percentageCompleted: Number(percentageCompleted.toFixed(2))
  };
};

/**
 * Obtiene todos los pagos de un evento, verificando que el evento pertenezca al usuario
 * @param eventId - ID del evento
 * @param userId - ID del usuario autenticado
 * @returns Lista de pagos con resumen
 * @throws Error si el evento no existe o no pertenece a un grupo del usuario
 */
export const getEventPayments = async (
  eventId: number,
  userId: number
): Promise<PaymentsListResponse> => {
  let event = await verifyEventOwnership(eventId, userId);

  // IMPORTANTE: Recalcular expectedAmount antes de calcular el resumen de pagos
  // para asegurar que refleje el número actual de miembros
  // Obtener groupId usando getDataValue() porque el include no carga event.groupId directamente
  const groupId = event.getDataValue("groupId") || event.groupId || event.group.id;
  
  if (groupId) {
    await recalculateGroupEventsExpectedAmount(groupId);

    // Volver a consultar el evento para obtener el expectedAmount actualizado
    // reload() no siempre refleja los cambios inmediatamente
    const updatedEvent = await BirthdayEvent.findByPk(eventId);
    if (updatedEvent) {
      event = updatedEvent;
    }
  }

  const payments = await Payment.findAll({
    where: { birthdayEventId: eventId },
    order: [["datePaid", "DESC"]]
  });

  // Cargar los miembros manualmente para evitar problemas de shadowing
  const memberIds = payments.map(p => p.getDataValue("memberId") || p.memberId).filter(Boolean);
  const uniqueMemberIds = [...new Set(memberIds)];
  
  const members = await Member.findAll({
    where: { id: uniqueMemberIds }
  });
  
  const membersMap = new Map(members.map(m => [m.id, m]));

  const paymentResponses: PaymentResponse[] = payments.map((payment) => {
    // Obtener valores crudos de Sequelize usando getDataValue() para evitar shadowing
    const birthdayEventIdValue = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
    const memberIdValue = payment.getDataValue("memberId") || payment.memberId;
    const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
    const amountValue = payment.getDataValue("amount") || payment.amount;

    // Obtener el miembro del map
    const member = membersMap.get(memberIdValue);
    const memberBirthdayValue = member
      ? member.getDataValue("birthday") || member.birthday
      : null;

    return {
      id: payment.id,
      birthdayEventId: birthdayEventIdValue || 0,
      memberId: memberIdValue || 0,
      amount: amountValue !== null && amountValue !== undefined ? Number(amountValue) : 0,
      datePaid:
        datePaidValue !== null && datePaidValue !== undefined
          ? formatDateOnlyFromUTC(datePaidValue)
          : "",
      proofUrl: payment.proofUrl ?? undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      member: member
        ? {
            id: member.id,
            groupId: member.groupId,
            name: member.name,
            phone: member.phone ?? undefined,
            birthday:
              memberBirthdayValue !== null && memberBirthdayValue !== undefined
                ? formatDateOnlyFromUTC(memberBirthdayValue)
                : "",
            photoUrl: member.photoUrl ?? undefined,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt
          }
        : undefined
    };
  });

  // Obtener expectedAmount y birthdayDate usando getDataValue()
  const expectedAmountValue = event.getDataValue("expectedAmount") || event.expectedAmount;
  const eventBirthdayDateValue = event.getDataValue("birthdayDate") || event.birthdayDate;

  const summary = calculatePaymentSummary(payments, Number(expectedAmountValue));

  return {
    event: {
      id: event.id,
      expectedAmount: expectedAmountValue !== null && expectedAmountValue !== undefined 
        ? Number(expectedAmountValue) 
        : 0,
      birthdayDate:
        eventBirthdayDateValue !== null && eventBirthdayDateValue !== undefined
          ? formatDateOnlyFromUTC(eventBirthdayDateValue)
          : ""
    },
    payments: paymentResponses,
    summary
  };
};

/**
 * Crea un nuevo pago para un evento, verificando que el evento pertenezca al usuario
 * @param eventId - ID del evento
 * @param userId - ID del usuario autenticado
 * @param paymentData - Datos del pago a crear
 * @returns Pago creado
 * @throws Error si el evento no existe, el miembro no pertenece al grupo, o ya existe un pago
 */
export const createPayment = async (
  eventId: number,
  userId: number,
  paymentData: CreatePaymentDto
): Promise<PaymentResponse> => {
  const event = await verifyEventOwnership(eventId, userId);

  // Obtener groupId del evento usando getDataValue para asegurar que se obtenga correctamente
  const groupIdValue = event.getDataValue("groupId") || event.groupId;

  if (!groupIdValue) {
    const error = new Error("No se pudo obtener el grupo del evento");
    error.name = "ValidationError";
    throw error;
  }

  // Verificar que el miembro pertenezca al grupo del evento
  await verifyMemberBelongsToGroup(paymentData.memberId, groupIdValue);

  // Verificar que no exista ya un pago de este miembro para este evento
  const existingPayment = await Payment.findOne({
    where: {
      birthdayEventId: eventId,
      memberId: paymentData.memberId
    }
  });

  if (existingPayment) {
    const error = new Error(
      "Este miembro ya tiene un pago registrado para este evento"
    );
    error.name = "ConflictError";
    throw error;
  }

  // Para campos DATEONLY, pasar el string directamente sin convertir a Date
  // Sequelize manejará la fecha correctamente como DATEONLY
  const payment = await Payment.create({
    birthdayEventId: eventId,
    memberId: paymentData.memberId,
    amount: paymentData.amount,
    datePaid: paymentData.datePaid, // String "YYYY-MM-DD" directamente
    proofUrl: paymentData.proofUrl
  } as unknown as Payment);

  // Obtener valores raw usando getDataValue() para evitar shadowing de Sequelize
    const birthdayEventIdValue = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
    const memberIdValue = payment.getDataValue("memberId") || payment.memberId;
    const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
    const amountValue = payment.getDataValue("amount") || payment.amount;

    return {
    id: payment.id,
    birthdayEventId: birthdayEventIdValue || 0,
    memberId: memberIdValue || 0,
    amount: amountValue !== null && amountValue !== undefined ? Number(amountValue) : 0,
    datePaid:
      datePaidValue !== null && datePaidValue !== undefined
        ? formatDateOnlyFromUTC(datePaidValue)
        : paymentData.datePaid, // Fallback al valor original
    proofUrl: payment.proofUrl ?? undefined,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  };
};

/**
 * Obtiene un pago por ID, verificando que pertenezca a un evento del usuario
 * @param paymentId - ID del pago
 * @param userId - ID del usuario autenticado
 * @returns Pago encontrado con información del miembro
 * @throws Error si el pago no existe o no pertenece a un evento del usuario
 */
export const getPaymentById = async (
  paymentId: number,
  userId: number
): Promise<PaymentResponse> => {
  const payment = await Payment.findOne({
    where: { id: paymentId },
    include: [
      {
        model: BirthdayEvent,
        as: "birthdayEvent",
        include: [
          {
            model: Group,
            as: "group",
            where: { userId }
          }
        ]
      },
      {
        model: Member,
        as: "member"
      }
    ]
  });

  if (!payment?.birthdayEvent) {
    const error = new Error("Pago no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener valores crudos de Sequelize usando getDataValue() para evitar shadowing
  const birthdayEventIdValue = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
  const memberIdValue = payment.getDataValue("memberId") || payment.memberId;
  const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
  const amountValue = payment.getDataValue("amount") || payment.amount;
  const memberBirthdayValue = payment.member
    ? payment.member.getDataValue("birthday") || payment.member.birthday
    : null;

  return {
    id: payment.id,
    birthdayEventId: birthdayEventIdValue || 0,
    memberId: memberIdValue || 0,
    amount: amountValue !== null && amountValue !== undefined ? Number(amountValue) : 0,
    datePaid:
      datePaidValue !== null && datePaidValue !== undefined
        ? formatDateOnlyFromUTC(datePaidValue)
        : "",
    proofUrl: payment.proofUrl ?? undefined,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    member: payment.member
      ? {
          id: payment.member.id,
          groupId: payment.member.groupId,
          name: payment.member.name,
          phone: payment.member.phone ?? undefined,
          birthday:
            memberBirthdayValue !== null && memberBirthdayValue !== undefined
              ? formatDateOnlyFromUTC(memberBirthdayValue)
              : "",
          photoUrl: payment.member.photoUrl ?? undefined,
          createdAt: payment.member.createdAt,
          updatedAt: payment.member.updatedAt
        }
      : undefined
  };
};

/**
 * Actualiza un pago, verificando que pertenezca a un evento del usuario
 * @param paymentId - ID del pago
 * @param userId - ID del usuario autenticado
 * @param paymentData - Datos a actualizar
 * @returns Pago actualizado
 * @throws Error si el pago no existe o no pertenece a un evento del usuario
 */
export const updatePayment = async (
  paymentId: number,
  userId: number,
  paymentData: UpdatePaymentDto
): Promise<PaymentResponse> => {
  const payment = await Payment.findOne({
    where: { id: paymentId },
    include: [
      {
        model: BirthdayEvent,
        as: "birthdayEvent",
        include: [
          {
            model: Group,
            as: "group",
            where: { userId }
          }
        ]
      }
    ]
  });

  if (!payment?.birthdayEvent) {
    const error = new Error("Pago no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Actualizar solo los campos proporcionados
  if (paymentData.amount !== undefined) {
    payment.amount = paymentData.amount;
  }
  if (paymentData.datePaid !== undefined) {
    // Para campos DATEONLY, pasar el string directamente
    payment.datePaid = paymentData.datePaid as unknown as Date;
  }
  if (paymentData.proofUrl !== undefined) {
    payment.proofUrl = paymentData.proofUrl || null;
  }

  await payment.save();

  // Obtener el miembro para la respuesta
  const member = await Member.findByPk(payment.memberId);

  // Obtener valores crudos de Sequelize
  const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
  const amountValue = payment.getDataValue("amount") || payment.amount;
  const memberBirthdayValue = member
    ? member.getDataValue("birthday") || member.birthday
    : null;

  return {
    id: payment.id,
    birthdayEventId: payment.birthdayEventId,
    memberId: payment.memberId,
    amount: amountValue !== null && amountValue !== undefined ? Number(amountValue) : 0,
    datePaid:
      datePaidValue !== null && datePaidValue !== undefined
        ? formatDateOnlyFromUTC(datePaidValue)
        : "",
    proofUrl: payment.proofUrl ?? undefined,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    member: member
      ? {
          id: member.id,
          groupId: member.groupId,
          name: member.name,
          phone: member.phone ?? undefined,
          birthday:
            memberBirthdayValue !== null && memberBirthdayValue !== undefined
              ? formatDateOnlyFromUTC(memberBirthdayValue)
              : "",
          photoUrl: member.photoUrl ?? undefined,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt
        }
      : undefined
  };
};

/**
 * Elimina un pago, verificando que pertenezca a un evento del usuario
 * @param paymentId - ID del pago
 * @param userId - ID del usuario autenticado
 * @throws Error si el pago no existe o no pertenece a un evento del usuario
 */
export const deletePayment = async (
  paymentId: number,
  userId: number
): Promise<void> => {
  // Primero verificar que el pago existe
  const payment = await Payment.findByPk(paymentId);

  if (!payment) {
    const error = new Error("Pago no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener el evento del pago
  const birthdayEventId = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
  
  if (!birthdayEventId) {
    const error = new Error("No se pudo obtener el evento del pago");
    error.name = "ValidationError";
    throw error;
  }

  // Verificar que el evento pertenezca a un grupo del usuario
  const event = await BirthdayEvent.findOne({
    where: { id: birthdayEventId },
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
    const error = new Error("Pago no encontrado o no pertenece a un evento del usuario");
    error.name = "NotFoundError";
    throw error;
  }

  // Eliminar el pago
  await payment.destroy();
};

/**
 * Obtiene TODOS los pagos de un grupo con información completa
 * Endpoint optimizado para reducir peticiones desde el frontend
 * @param groupId - ID del grupo
 * @param userId - ID del usuario autenticado
 * @returns Lista de todos los pagos del grupo con información del evento y miembro
 * @throws Error si el grupo no existe o no pertenece al usuario
 */
export const getAllGroupPayments = async (
  groupId: number,
  userId: number
): Promise<GroupPaymentsListResponse> => {
  // Verificar que el grupo pertenezca al usuario
  const group = await Group.findOne({
    where: { id: groupId, userId }
  });

  if (!group) {
    const error = new Error("Grupo no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener todos los eventos del grupo
  const events = await BirthdayEvent.findAll({
    where: { groupId },
    attributes: ["id", "memberId", "birthdayDate", "expectedAmount"]
  });

  if (events.length === 0) {
    return {
      groupId,
      groupName: group.getDataValue("name") || group.name,
      totalPayments: 0,
      totalPaid: 0,
      payments: []
    };
  }

  const eventIds = events.map(e => e.id);

  // Obtener todos los pagos de estos eventos
  const payments = await Payment.findAll({
    where: { birthdayEventId: eventIds },
    order: [["datePaid", "DESC"]]
  });

  // Cargar todos los miembros del grupo
  const members = await Member.findAll({
    where: { groupId }
  });

  // Crear maps para acceso rápido
  const eventsMap = new Map(events.map(e => [e.id, e]));
  const membersMap = new Map(members.map(m => [m.id, m]));

  // Construir respuesta con información completa
  const paymentResponses: GroupPaymentResponse[] = payments.map((payment) => {
    // Obtener valores usando getDataValue()
    const birthdayEventIdValue = payment.getDataValue("birthdayEventId") || payment.birthdayEventId;
    const memberIdValue = payment.getDataValue("memberId") || payment.memberId;
    const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
    const amountValue = payment.getDataValue("amount") || payment.amount;

    // Obtener el evento y miembro del pago
    const event = eventsMap.get(birthdayEventIdValue);
    const paymentMember = membersMap.get(memberIdValue);

    // Obtener el miembro del cumpleaños (del evento)
    const eventMemberIdValue = event?.getDataValue("memberId") || event?.memberId;
    const birthdayMember = membersMap.get(eventMemberIdValue || 0);

    return {
      id: payment.id,
      birthdayEventId: birthdayEventIdValue || 0,
      memberId: memberIdValue || 0,
      amount: amountValue !== null && amountValue !== undefined ? Number(amountValue) : 0,
      datePaid:
        datePaidValue !== null && datePaidValue !== undefined
          ? formatDateOnlyFromUTC(datePaidValue)
          : "",
      proofUrl: payment.proofUrl ?? undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      member: paymentMember
          ? {
            id: paymentMember.id,
            groupId: paymentMember.groupId,
            name: paymentMember.name,
            phone: paymentMember.phone ?? undefined,
            birthday: paymentMember.birthday
              ? formatDateOnlyFromUTC(paymentMember.birthday)
              : "",
            photoUrl: paymentMember.photoUrl ?? undefined,
            createdAt: paymentMember.createdAt,
            updatedAt: paymentMember.updatedAt
          }
        : undefined,
      event: {
        id: event?.id || 0,
        birthdayDate:
          event?.getDataValue("birthdayDate") !== null &&
          event?.getDataValue("birthdayDate") !== undefined
            ? formatDateOnlyFromUTC(event.getDataValue("birthdayDate") || event.birthdayDate)
            : "",
        expectedAmount:
          event?.getDataValue("expectedAmount") !== null &&
          event?.getDataValue("expectedAmount") !== undefined
            ? Number(event.getDataValue("expectedAmount") || event.expectedAmount)
            : 0,
        memberId: eventMemberIdValue || 0,
        memberName: birthdayMember?.getDataValue("name") || birthdayMember?.name || ""
      }
    };
  });

  // Calcular total pagado
  const totalPaid = paymentResponses.reduce((sum, p) => sum + p.amount, 0);

  return {
    groupId,
    groupName: group.getDataValue("name") || group.name,
    totalPayments: paymentResponses.length,
    totalPaid: Number(totalPaid.toFixed(2)),
    payments: paymentResponses
  };
};
