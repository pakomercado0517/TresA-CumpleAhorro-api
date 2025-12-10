import { MemberResponse } from "./member.types";

export interface CreatePaymentDto {
  memberId: number;
  amount: number;
  datePaid: string; // Formato: "yyyy-MM-dd"
  proofUrl?: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  datePaid?: string; // Formato: "yyyy-MM-dd"
  proofUrl?: string;
}

export interface PaymentResponse {
  id: number;
  birthdayEventId: number;
  memberId: number;
  amount: number;
  datePaid: string; // Formato: "yyyy-MM-dd" (convertido a timezone del usuario)
  proofUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  member?: MemberResponse; // Incluido cuando se solicita lista
}

export interface PaymentSummary {
  totalPaid: number;
  totalExpected: number;
  remaining: number;
  percentageCompleted: number;
}

export interface PaymentsListResponse {
  event: {
    id: number;
    expectedAmount: number;
    birthdayDate: string;
  };
  payments: PaymentResponse[];
  summary: PaymentSummary;
}

