/**
 * Respuesta para GET /api/dashboard
 * Información optimizada del dashboard del usuario
 */
export interface DashboardResponse {
  message: string;
  summary: DashboardSummary;
  upcomingBirthdays: UpcomingBirthday[];
}

export interface DashboardSummary {
  upcomingBirthdays: number; // Eventos en los próximos N días (default: 30)
  paymentsToday: number; // Cantidad de pagos del día de hoy
  totalPaymentsToday: number; // Suma de montos de pagos del día de hoy
  totalGroups: number; // Total de grupos creados
}

export interface UpcomingBirthday {
  id: number; // ID del evento
  eventId: number; // ID del evento (duplicado para claridad)
  memberId: number;
  name: string; // Nombre del miembro
  groupName: string;
  birthdayDate: string; // "yyyy-MM-dd"
  photoUrl?: string | null; // Opcional
  paymentStatus: "paid" | "pending" | "overdue"; // Estado del pago
  expectedAmount: number;
}

/**
 * Parámetros de query para GET /api/dashboard
 */
export interface GetDashboardQueryParams {
  limit?: number; // Límite de upcomingBirthdays (default: 10)
  days?: number; // Rango de días para próximos cumpleaños (default: 30)
  includePhotoUrl?: boolean; // Incluir campo photoUrl (default: true)
}

