export interface CreateGroupDto {
  name: string;
  amountPerBirthday: number;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  amountPerBirthday?: number;
  description?: string;
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

