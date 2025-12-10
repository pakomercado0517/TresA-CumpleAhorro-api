import { Request, Response } from "express";

import {
  getGroupEvents,
  generateEventsForCurrentYear,
  getEventById
} from "../services/event.service";

/**
 * Controller para listar todos los eventos de un grupo
 */
export const listEvents = async (
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

    const events = await getGroupEvents(groupId, userId);

    res.status(200).json({
      message: "Eventos obtenidos exitosamente",
      events
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al listar eventos:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para generar eventos de cumpleaños para el año actual
 */
export const generateEvents = async (
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

    const result = await generateEventsForCurrentYear(groupId, userId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al generar eventos:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

/**
 * Controller para obtener un evento por ID
 */
export const getById = async (
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

    const event = await getEventById(eventId, userId);

    res.status(200).json({
      message: "Evento obtenido exitosamente",
      event
    });
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al obtener evento:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

