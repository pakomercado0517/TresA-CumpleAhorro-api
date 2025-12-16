export interface CreateMemberDto {
  name: string;
  phone?: string;
  birthday: string; // Formato: "yyyy-MM-dd"
  photoUrl?: string;
}

export interface UpdateMemberDto {
  name?: string;
  phone?: string;
  birthday?: string; // Formato: "yyyy-MM-dd"
  photoUrl?: string;
}

export interface MemberResponse {
  id: number;
  groupId: number;
  name: string;
  phone?: string;
  birthday: string; // Formato: "yyyy-MM-dd" (convertido a timezone del usuario)
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Respuesta para GET /api/members
 * Lista todos los miembros del usuario con información del grupo
 */
export interface MemberListResponse {
  message: string;
  members: MemberListItem[];
  summary?: MemberSummary;
  pagination?: {
    cursor?: string;
    hasMore: boolean;
  };
}

export interface MemberListItem {
  id: number;
  groupId: number;
  name: string;
  phone?: string; // Opcional
  birthday: string; // "yyyy-MM-dd"
  photoUrl?: string | null; // Opcional
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  groupName: string; // Nombre del grupo
  status: "active" | "pending" | "inactive";
}

export interface MemberSummary {
  totalMembers?: number; // Opcional
  newMembersThisWeek?: number; // Opcional
  birthdaysThisMonth?: number; // Opcional
  nextBirthday?: {
    name: string;
    date: string; // "yyyy-MM-dd"
  }; // Opcional
  pendingPayments?: number; // Opcional - Eventos con pagos incompletos
}

/**
 * Parámetros de query para GET /api/members
 */
export interface GetMembersQueryParams {
  search?: string; // Búsqueda por nombre de miembro o grupo
  month?: number; // Filtrar por mes de cumpleaños (1-12)
  status?: "active" | "pending" | "inactive" | "all"; // Estado del miembro
  cursor?: string; // Cursor para paginación (ID del último miembro visto)
  limit?: number; // Límite de resultados (default: 20)
  includePhone?: boolean; // Incluir campo phone (default: true)
  includePhotoUrl?: boolean; // Incluir campo photoUrl (default: true)
  includeSummary?: boolean; // Incluir summary (default: true)
}
