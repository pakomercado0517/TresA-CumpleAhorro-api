import { Payment } from "../models/Payment";
import { BirthdayEvent } from "../models/BirthdayEvent";
import { Member } from "../models/Member";
import { Group } from "../models/Group";
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponse,
  PaymentsListResponse,
  PaymentSummary
} from "../types/payment.types";
import { parseDateOnlyToUTC, formatDateOnlyFromUTC } from "../utils/date.util";
import { Op } from "sequelize";

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
  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
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
  const event = await verifyEventOwnership(eventId, userId);

  const payments = await Payment.findAll({
    where: { birthdayEventId: eventId },
    include: [
      {
        model: Member,
        as: "member"
      }
    ],
    order: [["datePaid", "DESC"]]
  });

  const paymentResponses: PaymentResponse[] = payments.map((payment) => {
    // Obtener valores crudos de Sequelize
    const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
    const memberBirthdayValue = payment.member
      ? payment.member.getDataValue("birthday") || payment.member.birthday
      : null;

    return {
      id: payment.id,
      birthdayEventId: payment.birthdayEventId,
      memberId: payment.memberId,
      amount: Number(payment.amount),
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
  });

  const summary = calculatePaymentSummary(payments, Number(event.expectedAmount));

  // Obtener el birthdayDate del evento
  const eventBirthdayDateValue =
    event.getDataValue("birthdayDate") || event.birthdayDate;

  return {
    event: {
      id: event.id,
      expectedAmount: Number(event.expectedAmount),
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

  // Convertir datePaid de string (yyyy-MM-dd) a UTC
  const datePaidUTC = parseDateOnlyToUTC(paymentData.datePaid);

  const payment = await Payment.create({
    birthdayEventId: eventId,
    memberId: paymentData.memberId,
    amount: paymentData.amount,
    datePaid: datePaidUTC,
    proofUrl: paymentData.proofUrl
  } as unknown as Payment);

  // Obtener el datePaid del pago creado
  const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;

  return {
    id: payment.id,
    birthdayEventId: payment.birthdayEventId,
    memberId: payment.memberId,
    amount: Number(payment.amount),
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

  if (!payment || !payment.birthdayEvent) {
    const error = new Error("Pago no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Obtener valores crudos de Sequelize
  const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
  const memberBirthdayValue = payment.member
    ? payment.member.getDataValue("birthday") || payment.member.birthday
    : null;

  return {
    id: payment.id,
    birthdayEventId: payment.birthdayEventId,
    memberId: payment.memberId,
    amount: Number(payment.amount),
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

  if (!payment || !payment.birthdayEvent) {
    const error = new Error("Pago no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Actualizar solo los campos proporcionados
  if (paymentData.amount !== undefined) {
    payment.amount = paymentData.amount;
  }
  if (paymentData.datePaid !== undefined) {
    // Convertir datePaid de string (yyyy-MM-dd) a UTC
    payment.datePaid = parseDateOnlyToUTC(paymentData.datePaid);
  }
  if (paymentData.proofUrl !== undefined) {
    payment.proofUrl = paymentData.proofUrl || undefined;
  }

  await payment.save();

  // Obtener el miembro para la respuesta
  const member = await Member.findByPk(payment.memberId);

  // Obtener valores crudos de Sequelize
  const datePaidValue = payment.getDataValue("datePaid") || payment.datePaid;
  const memberBirthdayValue = member
    ? member.getDataValue("birthday") || member.birthday
    : null;

  return {
    id: payment.id,
    birthdayEventId: payment.birthdayEventId,
    memberId: payment.memberId,
    amount: Number(payment.amount),
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

  if (!payment || !payment.birthdayEvent) {
    const error = new Error("Pago no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  await payment.destroy();
};

