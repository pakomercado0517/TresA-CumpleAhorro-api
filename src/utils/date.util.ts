import { format, parseISO, isValid } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Timezones utilizados en la aplicación
 * - USER_TIMEZONE: Veracruz, México (America/Mexico_City)
 * - DB_TIMEZONE: UTC (base de datos en Virginia, US pero almacena en UTC)
 */
export const USER_TIMEZONE = "America/Mexico_City"; // Veracruz, México
export const DB_TIMEZONE = "UTC"; // Base de datos almacena en UTC

/**
 * Convierte una fecha de la zona horaria del usuario (Veracruz) a UTC
 * Útil cuando se recibe una fecha del frontend y se necesita guardar en la BD
 *
 * @param date - Fecha en la zona horaria del usuario (string ISO o Date)
 * @returns Fecha en UTC como Date
 * @throws Error si la fecha no es válida
 *
 * @example
 * // Frontend envía: "2024-03-15T10:00:00" (en Veracruz)
 * // BD guarda: Date en UTC equivalente
 * const utcDate = convertUserDateToUTC("2024-03-15T10:00:00");
 */
export const convertUserDateToUTC = (date: string | Date): Date => {
  let dateObj: Date;

  if (typeof date === "string") {
    // Si es string, parsear primero
    dateObj = parseISO(date);
    if (!isValid(dateObj)) {
      throw new Error(`Invalid date string: ${date}`);
    }
  } else {
    dateObj = date;
    if (!isValid(dateObj)) {
      throw new Error("Invalid date object");
    }
  }

  // Convertir de zona horaria del usuario a UTC
  return fromZonedTime(dateObj, USER_TIMEZONE);
};

/**
 * Convierte una fecha de UTC a la zona horaria del usuario (Veracruz)
 * Útil cuando se obtiene una fecha de la BD y se necesita enviar al frontend
 *
 * @param date - Fecha en UTC (Date o string ISO)
 * @returns Fecha en la zona horaria del usuario como Date
 * @throws Error si la fecha no es válida
 *
 * @example
 * // BD tiene: Date en UTC
 * // Frontend recibe: "2024-03-15T10:00:00" (en Veracruz)
 * const userDate = convertUTCToUserDate(utcDate);
 */
export const convertUTCToUserDate = (date: Date | string): Date => {
  let dateObj: Date;

  if (typeof date === "string") {
    dateObj = parseISO(date);
    if (!isValid(dateObj)) {
      throw new Error(`Invalid date string: ${date}`);
    }
  } else {
    dateObj = date;
    if (!isValid(dateObj)) {
      throw new Error("Invalid date object");
    }
  }

  // Convertir de UTC a zona horaria del usuario
  return toZonedTime(dateObj, USER_TIMEZONE);
};

/**
 * Formatea una fecha en la zona horaria del usuario para mostrar al frontend
 *
 * @param date - Fecha en UTC (Date o string ISO)
 * @param formatString - Formato deseado (por defecto: "yyyy-MM-dd")
 * @returns String formateado en la zona horaria del usuario
 *
 * @example
 * formatUserDate(utcDate, "yyyy-MM-dd") // "2024-03-15"
 * formatUserDate(utcDate, "dd/MM/yyyy") // "15/03/2024"
 */
export const formatUserDate = (
  date: Date | string,
  formatString = "yyyy-MM-dd"
): string => {
  const userDate = convertUTCToUserDate(date);
  return format(userDate, formatString);
};

/**
 * Formatea una fecha con hora en la zona horaria del usuario
 *
 * @param date - Fecha en UTC (Date o string ISO)
 * @param formatString - Formato deseado (por defecto: "yyyy-MM-dd HH:mm:ss")
 * @returns String formateado con hora en la zona horaria del usuario
 */
export const formatUserDateTime = (
  date: Date | string,
  formatString = "yyyy-MM-dd HH:mm:ss"
): string => {
  const userDate = convertUTCToUserDate(date);
  return format(userDate, formatString);
};

/**
 * Obtiene solo la fecha (sin hora) de una fecha en UTC
 * Útil para campos DATEONLY de Sequelize
 *
 * @param date - Fecha en UTC (Date o string ISO)
 * @returns String en formato "yyyy-MM-dd" en la zona horaria del usuario
 */
export const getDateOnly = (date: Date | string): string => {
  return formatUserDate(date, "yyyy-MM-dd");
};

/**
 * Convierte una fecha del frontend (string en formato yyyy-MM-dd) a Date en UTC
 * Específico para campos DATEONLY de Sequelize
 *
 * @param dateString - Fecha en formato "yyyy-MM-dd" (sin hora)
 * @returns Date en UTC a medianoche
 *
 * @example
 * // Frontend envía: "2024-03-15" (cumpleaños)
 * // BD guarda: Date en UTC a las 00:00:00 del día en Veracruz
 * const utcDate = parseDateOnlyToUTC("2024-03-15");
 */
export const parseDateOnlyToUTC = (dateString: string): Date => {
  // Crear fecha a medianoche en la zona horaria del usuario
  const userDate = parseISO(`${dateString}T00:00:00`);
  if (!isValid(userDate)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  // Convertir a UTC
  return fromZonedTime(userDate, USER_TIMEZONE);
};

/**
 * Convierte una fecha DATEONLY de la BD (UTC) a string en formato yyyy-MM-dd
 * para el frontend
 *
 * @param date - Fecha en UTC (Date, string ISO, o string "yyyy-MM-dd" de Sequelize)
 * @returns String en formato "yyyy-MM-dd" en la zona horaria del usuario
 */
export const formatDateOnlyFromUTC = (date: Date | string): string => {
  // Si es null o undefined, retornar string vacío
  if (date === null || date === undefined) {
    throw new Error("Date is null or undefined");
  }

  // Si es un string en formato "yyyy-MM-dd" (como devuelve Sequelize DATEONLY)
  if (typeof date === "string") {
    // Verificar si es formato "yyyy-MM-dd"
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Sequelize devuelve DATEONLY como "yyyy-MM-dd" en UTC
      // Parseamos como si fuera medianoche UTC
      const utcDate = parseISO(`${date}T00:00:00Z`);
      if (isValid(utcDate)) {
        // Convertir a zona horaria del usuario y formatear
        const userDate = toZonedTime(utcDate, USER_TIMEZONE);
        return format(userDate, "yyyy-MM-dd");
      }
      // Si no es válido, retornar el string original
      return date;
    }
    
    // Intentar parsear como ISO completo
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      return getDateOnly(parsed);
    }
    
    throw new Error(`Invalid date string: ${date}`);
  }
  
  // Para Date objects
  if (date instanceof Date) {
    // Si el Date es inválido, intentar convertirlo a string primero
    if (!isValid(date)) {
      try {
        // Intentar obtener el string del Date (puede que tenga información útil)
        const dateStr = date.toISOString().split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const utcDate = parseISO(`${dateStr}T00:00:00Z`);
          if (isValid(utcDate)) {
            const userDate = toZonedTime(utcDate, USER_TIMEZONE);
            return format(userDate, "yyyy-MM-dd");
          }
        }
      } catch (error) {
        // Si toISOString falla, intentar otros métodos
        try {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const utcDate = parseISO(`${dateStr}T00:00:00Z`);
            if (isValid(utcDate)) {
              const userDate = toZonedTime(utcDate, USER_TIMEZONE);
              return format(userDate, "yyyy-MM-dd");
            }
          }
        } catch (innerError) {
          // Si todo falla, lanzar error
          throw new Error(`Invalid date object: ${date}`);
        }
      }
      throw new Error(`Invalid date object: ${date}`);
    }
    
    return getDateOnly(date);
  }
  
  throw new Error(`Invalid date type: ${typeof date}`);
};

/**
 * Obtiene la fecha actual en UTC
 *
 * @returns Date actual en UTC
 */
export const getCurrentUTC = (): Date => {
  return new Date();
};

/**
 * Obtiene la fecha actual en la zona horaria del usuario
 *
 * @returns Date actual en Veracruz, México
 */
export const getCurrentUserDate = (): Date => {
  const utcNow = getCurrentUTC();
  return convertUTCToUserDate(utcNow);
};

/**
 * Valida si una fecha es válida
 *
 * @param date - Fecha a validar
 * @returns true si la fecha es válida, false en caso contrario
 */
export const isValidDate = (date: unknown): date is Date => {
  if (date instanceof Date) {
    return isValid(date);
  }
  if (typeof date === "string") {
    return isValid(parseISO(date));
  }
  return false;
};

