import { Request, Response } from "express";

import { getPublicEventById } from "../services/public.service";

/**
 * Controller para obtener información pública de un evento
 * GET /api/public/events/:event_id
 * No requiere autenticación
 */
export const getPublicEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId) || eventId <= 0) {
      res.status(400).json({
        error: "ID de evento inválido"
      });
      return;
    }

    const event = await getPublicEventById(eventId);

    res.status(200).json(event);
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      res.status(404).json({
        error: error.message
      });
      return;
    }

    console.error("Error al obtener evento público:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

