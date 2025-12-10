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

