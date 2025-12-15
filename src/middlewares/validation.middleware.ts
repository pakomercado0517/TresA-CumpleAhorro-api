import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";

/**
 * Middleware para validar los resultados de express-validator
 * Debe usarse después de los validators
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array()
    });
    return;
  }
  next();
};

/**
 * Helper para ejecutar múltiples validaciones
 */
export const validateRequest = (
  validations: ValidationChain[]
): Array<ValidationChain | typeof validate> => {
  return [...validations, validate];
};
