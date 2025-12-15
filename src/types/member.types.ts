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
