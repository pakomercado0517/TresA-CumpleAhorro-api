import { Request, Response } from "express";

import {
  getGroupEvents,
  generateEventsForCurrentYear,
  getEventById,
  getUserEvents
} from "../services/event.service";
import { GetEventsQueryParams } from "../types/event.types";

/**
 * Controller para listar todos los eventos del usuario
 * Soporta filtros: year, cursor, status, search, sortBy
 */
export const listAllEvents = async (
  req: Request<unknown, unknown, unknown, GetEventsQueryParams>,
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

    // Parsear query parameters
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const status = (req.query.status as string) || "all";
    const search = req.query.search ? String(req.query.search) : undefined;
    const sortBy = (req.query.sortBy as string) || "birthdayDate";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    
    // Parsear booleanos de query params (pueden venir como string "true"/"false" o boolean)
    const includeGroupNameValue = req.query.includeGroupName;
    const includeGroupName = typeof includeGroupNameValue === "string"
      ? includeGroupNameValue === "true" || includeGroupNameValue === "1"
      : includeGroupNameValue === true;
    
    const includeTimestampsValue = req.query.includeTimestamps;
    const includeTimestamps = typeof includeTimestampsValue === "string"
      ? includeTimestampsValue === "true" || includeTimestampsValue === "1"
      : includeTimestampsValue === true;

    // Validar parámetros
    if (year !== undefined && (isNaN(year) || year < 1900 || year > 2100)) {
      res.status(400).json({
        error: "El parámetro 'year' debe ser un año válido entre 1900 y 2100"
      });
      return;
    }

    if (limit !== undefined && (isNaN(limit) || limit <= 0 || limit > 100)) {
      res.status(400).json({
        error: "El parámetro 'limit' debe ser un número positivo entre 1 y 100"
      });
      return;
    }

    if (!["all", "completed", "pending", "overdue"].includes(status)) {
      res.status(400).json({
        error: "El parámetro 'status' debe ser: all, completed, pending o overdue"
      });
      return;
    }

    if (!["birthdayDate", "createdAt", "expectedAmount", "totalPaid"].includes(sortBy)) {
      res.status(400).json({
        error: "El parámetro 'sortBy' debe ser: birthdayDate, createdAt, expectedAmount o totalPaid"
      });
      return;
    }

    if (!["ASC", "DESC"].includes(sortOrder)) {
      res.status(400).json({
        error: "El parámetro 'sortOrder' debe ser: ASC o DESC"
      });
      return;
    }

    const events = await getUserEvents(userId, {
      year,
      cursor,
      limit,
      status: status as "all" | "completed" | "pending" | "overdue",
      search,
      sortBy: sortBy as "birthdayDate" | "createdAt" | "expectedAmount" | "totalPaid",
      sortOrder: sortOrder as "ASC" | "DESC",
      includeGroupName,
      includeTimestamps
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error al listar eventos:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};

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

    const eventDetail = await getEventById(eventId, userId);

    res.status(200).json(eventDetail);
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
