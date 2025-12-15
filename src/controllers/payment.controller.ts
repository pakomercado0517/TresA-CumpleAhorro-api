import { Request, Response } from "express";

import {
  getEventPayments,
  createPayment,
  getPaymentById,
  updatePayment,
  deletePayment,
  getAllGroupPayments
} from "../services/payment.service";
import { CreatePaymentDto, UpdatePaymentDto } from "../types/payment.types";

/**
 * Controller para listar todos los pagos de un evento
 */
export const listPayments = async (
  req: Request<{ eventId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId)) {
      res.status(400).json({
        error: "ID de evento inválido"
      });
      return;
    }

    const result = await getEventPayments(eventId, userId);

    res.status(200).json({
      message: "Pagos obtenidos exitosamente",
      ...result
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al listar pagos:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para crear un nuevo pago
 */
export const create = async (
  req: Request<{ eventId: string }, unknown, CreatePaymentDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId)) {
      res.status(400).json({
        error: "ID de evento inválido"
      });
      return;
    }

    const paymentData: CreatePaymentDto = {
      memberId: req.body.memberId,
      amount: req.body.amount,
      datePaid: req.body.datePaid,
      proofUrl: req.body.proofUrl
    };

    const payment = await createPayment(eventId, userId, paymentData);

    res.status(201).json({
      message: "Pago registrado exitosamente",
      payment
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotFoundError") {
        res.status(404).json({
          error: error.message
        });
        return;
      }
      if (error.name === "ConflictError") {
        res.status(409).json({
          error: error.message
        });
        return;
      }
      if (error.name === "ValidationError") {
        res.status(400).json({
          error: error.message
        });
        return;
      }
    }

    console.error("Error al crear pago:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para obtener un pago por ID
 */
export const getById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const paymentId = parseInt(req.params.id, 10);

    if (isNaN(paymentId)) {
      res.status(400).json({
        error: "ID de pago inválido"
      });
      return;
    }

    const payment = await getPaymentById(paymentId, userId);

    res.status(200).json({
      message: "Pago obtenido exitosamente",
      payment
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al obtener pago:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para actualizar un pago
 */
export const update = async (
  req: Request<{ id: string }, unknown, UpdatePaymentDto>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const paymentId = parseInt(req.params.id, 10);

    if (isNaN(paymentId)) {
      res.status(400).json({
        error: "ID de pago inválido"
      });
      return;
    }

    const paymentData: UpdatePaymentDto = {
      amount: req.body.amount,
      datePaid: req.body.datePaid,
      proofUrl: req.body.proofUrl
    };

    const payment = await updatePayment(paymentId, userId, paymentData);

    res.status(200).json({
      message: "Pago actualizado exitosamente",
      payment
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al actualizar pago:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para eliminar un pago
 */
export const remove = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const paymentId = parseInt(req.params.id, 10);

    if (isNaN(paymentId)) {
      res.status(400).json({
        error: "ID de pago inválido"
      });
      return;
    }

    await deletePayment(paymentId, userId);

    res.status(200).json({
      message: "Pago eliminado exitosamente"
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al eliminar pago:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para listar TODOS los pagos de un grupo
 * Endpoint optimizado que devuelve información completa de pagos, eventos y miembros
 */
export const listAllGroupPayments = async (
  req: Request<{ groupId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        error: "Usuario no autenticado"
      });
      return;
    }

    const groupId = parseInt(req.params.groupId, 10);

    if (isNaN(groupId)) {
      res.status(400).json({
        error: "ID de grupo inválido"
      });
      return;
    }

    const result = await getAllGroupPayments(groupId, userId);

    res.status(200).json({
      message: "Pagos del grupo obtenidos exitosamente",
      ...result
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al listar pagos del grupo:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};
