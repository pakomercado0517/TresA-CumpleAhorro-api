/**
 * Tipos para la gestión de usuarios
 */

/**
 * DTO para actualizar perfil de usuario (nombre y email)
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
}

/**
 * DTO para cambiar contraseña
 */
export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

/**
 * DTO para cambiar avatar URL
 */
export interface ChangeAvatarDto {
  avatarUrl: string;
}

/**
 * Respuesta con perfil de usuario
 */
export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Respuesta para GET /api/users/me
 */
export interface GetUserProfileResponse {
  message: string;
  user: UserProfileResponse;
}

/**
 * Respuesta para PUT /api/users/me
 */
export interface UpdateUserProfileResponse {
  message: string;
  user: UserProfileResponse;
}

/**
 * Respuesta para PUT /api/users/me/password
 */
export interface ChangePasswordResponse {
  message: string;
}

/**
 * Respuesta para PUT /api/users/me/avatar
 */
export interface ChangeAvatarResponse {
  message: string;
  user: UserProfileResponse;
}




