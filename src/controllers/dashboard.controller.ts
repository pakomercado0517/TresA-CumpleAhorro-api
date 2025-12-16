import { Request, Response } from "express";

import { getDashboard } from "../services/dashboard.service";
import { GetDashboardQueryParams } from "../types/dashboard.types";

/**
 * Controller para obtener información del dashboard
 * Soporta query parameters: limit, days, includePhotoUrl
 */
export const getDashboardData = async (
  req: Request<unknown, unknown, unknown, GetDashboardQueryParams>,
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
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    
    // Parsear booleanos
    const includePhotoUrlValue = req.query.includePhotoUrl;
    const includePhotoUrl = typeof includePhotoUrlValue === "string"
      ? includePhotoUrlValue !== "false" && includePhotoUrlValue !== "0"
      : includePhotoUrlValue !== false;

    // Validar parámetros
    if (limit !== undefined && (isNaN(limit) || limit <= 0 || limit > 50)) {
      res.status(400).json({
        error: "El parámetro 'limit' debe ser un número positivo entre 1 y 50"
      });
      return;
    }

    if (days !== undefined && (isNaN(days) || days <= 0 || days > 365)) {
      res.status(400).json({
        error: "El parámetro 'days' debe ser un número positivo entre 1 y 365"
      });
      return;
    }

    const dashboard = await getDashboard(userId, {
      limit,
      days,
      includePhotoUrl
    });

    res.status(200).json(dashboard);
  } catch (error) {
    console.error("Error al obtener dashboard:", error);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
};


