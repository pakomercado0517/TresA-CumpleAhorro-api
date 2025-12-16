import { MemberResponse } from "./member.types";

export interface BirthdayEventResponse {
  id: number;
  memberId: number;
  groupId: number;
  birthdayDate: string; // Formato: "yyyy-MM-dd" (convertido a timezone del usuario)
  expectedAmount: number;
  createdAt: Date;
  updatedAt: Date;
  member?: MemberResponse; // Incluido cuando se solicita detalle
}

export interface GenerateEventsResponse {
  message: string;
  eventsCreated: number;
  events: BirthdayEventResponse[];
}

/**
 * Respuesta para GET /api/events
 * Lista todos los eventos del usuario con información completa
 */
export interface EventListResponse {
  message: string;
  events: EventListItem[];
  summary?: EventSummary;
  pagination?: {
    cursor?: string;
    hasMore: boolean;
  };
}

export interface EventListItem {
  // Información básica del evento
  id: number;
  memberId: number;
  groupId: number;
  birthdayDate: string; // Formato: "yyyy-MM-dd"
  expectedAmount: number;
  totalPaid: number; // Suma de todos los pagos del evento
  
  // Información del grupo
  group: {
    id: number;
    name?: string; // Opcional, solo si se necesita mostrar
    amountPerBirthday: number;
    memberCount: number;
  };
  
  // Información del miembro
  member: {
    id: number;
    groupId: number;
    name: string;
    phone?: string; // Opcional
    birthday: string; // Formato: "yyyy-MM-dd"
    photoUrl?: string; // Opcional
  };
  
  // Campos opcionales
  createdAt?: string; // Opcional
  updatedAt?: string; // Opcional
}

export interface EventSummary {
  totalEvents: number;
  totalExpected: number;
  totalPaid: number;
  percentageCompleted: number;
}

/**
 * Parámetros de query para GET /api/events
 */
export interface GetEventsQueryParams {
  year?: number; // Filtrar por año del evento
  cursor?: string; // Cursor para paginación (ID del último evento visto)
  limit?: number; // Límite de resultados (default: 20)
  status?: "all" | "completed" | "pending" | "overdue"; // Estado del evento
  search?: string; // Búsqueda por nombre de miembro o grupo
  sortBy?: "birthdayDate" | "createdAt" | "expectedAmount" | "totalPaid"; // Campo para ordenar
  sortOrder?: "ASC" | "DESC"; // Orden (default: DESC)
  includeGroupName?: boolean; // Incluir nombre del grupo (default: false)
  includeTimestamps?: boolean; // Incluir createdAt y updatedAt (default: false)
}

/**
 * Respuesta para GET /api/events/:event_id
 * Detalle completo de un evento con información del grupo, miembros y pagos
 */
export interface EventDetailResponse {
  event: {
    id: number;
    memberId: number;
    groupId: number;
    birthdayDate: string; // "yyyy-MM-dd"
    expectedAmount: number;
    member: {
      id: number;
      name: string;
      photoUrl: string | null;
    };
  };
  group: {
    id: number;
    amountPerBirthday: number;
  };
  members: Array<{
    id: number;
    name: string;
    photoUrl: string | null;
  }>;
  payments: Array<{
    id: number;
    memberId: number;
    amount: number;
    datePaid: string; // "yyyy-MM-dd"
    proofUrl: string | null;
  }>;
  summary: {
    totalPaid: number;
    totalExpected: number;
    percentageCompleted: number;
  };
}
