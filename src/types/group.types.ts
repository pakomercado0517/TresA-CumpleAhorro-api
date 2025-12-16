export interface CreateGroupDto {
  name: string;
  amountPerBirthday: number;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  amountPerBirthday?: number;
  description?: string | null;
}

export interface GroupResponse {
  id: number;
  userId: number;
  name: string;
  amountPerBirthday: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupDetailedResponse extends GroupResponse {
  // Estadísticas del grupo
  memberCount: number;
  eventCount: number;
  totalExpected: number; // Total esperado de todos los eventos
  totalPaid: number; // Total pagado en el grupo
  
  // Colecciones relacionadas
  members: Array<{
    id: number;
    name: string;
    phone?: string;
    birthday: string;
    photoUrl?: string;
  }>;
  
  events: Array<{
    id: number;
    memberId: number;
    memberName: string;
    birthdayDate: string;
    expectedAmount: number;
    totalPaid: number;
  }>;
  
  recentPayments: Array<{
    id: number;
    memberId: number;
    memberName: string;
    birthdayEventId: number;
    amount: number;
    datePaid: string;
  }>;
}

export interface GetGroupsQueryParams {
  limit?: number;           // Limitar número de grupos devueltos
  includeMembers?: boolean; // Incluir array de miembros (default: true)
  includeEvents?: boolean;  // Incluir array de eventos (default: true)
  includePayments?: boolean; // Incluir pagos recientes (default: true)
  paymentsLimit?: number;   // Limitar número de pagos recientes (default: 10)
  year?: number;            // Filtrar eventos por año (ej: 2025)
}

/**
 * Respuesta optimizada para GET /api/groups
 * Estructura mínima para reducir el payload
 */
export interface GroupOptimizedResponse {
  id: number;
  name: string;
  amountPerBirthday: number;
  memberCount: number;
  eventCount: number;
  totalExpected: number;
  totalPaid: number;
  events: Array<{
    id: number;
    memberId: number;
    memberName: string;
    birthdayDate: string; // "yyyy-MM-dd"
    expectedAmount: number;
    totalPaid: number;
  }>;
  // Opcional: members[] solo si se necesitan avatares
  members?: Array<{
    id: number;
    name: string;
    photoUrl?: string;
  }>;
}
