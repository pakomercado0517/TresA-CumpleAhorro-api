/**
 * Tipos para endpoints públicos
 */

/**
 * Respuesta para GET /api/public/events/:event_id
 * Endpoint público para mostrar el estado de un evento
 */
export interface PublicEventResponse {
  message: string;
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
    name?: string; // Opcional
    amountPerBirthday: number;
    totalMembers: number;
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
    remaining: number;
  };
  status: {
    label: string; // "Recolección Activa" | "Completado" | "Pendiente" | "Próximo"
    value: "active" | "completed" | "pending" | "upcoming";
  };
}

