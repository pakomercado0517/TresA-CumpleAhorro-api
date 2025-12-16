import { User } from "../models/User";
import {
  UpdateUserDto,
  ChangePasswordDto,
  ChangeAvatarDto,
  UserProfileResponse
} from "../types/user.types";
import { hashPassword, comparePassword } from "../utils/bcrypt.util";

/**
 * Obtiene el perfil del usuario autenticado
 * @param userId - ID del usuario
 * @returns Perfil del usuario
 * @throws Error si el usuario no existe
 */
export const getUserProfile = async (userId: number): Promise<UserProfileResponse> => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Actualiza el perfil del usuario (nombre y/o email)
 * @param userId - ID del usuario
 * @param updateData - Datos a actualizar
 * @returns Perfil actualizado del usuario
 * @throws Error si el usuario no existe o el email ya está en uso
 */
export const updateUserProfile = async (
  userId: number,
  updateData: UpdateUserDto
): Promise<UserProfileResponse> => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Si se está actualizando el email, verificar que no esté en uso
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({
      where: { email: updateData.email }
    });

    if (existingUser) {
      const error = new Error("El email ya está en uso");
      error.name = "ConflictError";
      throw error;
    }
  }

  // Actualizar campos
  if (updateData.name !== undefined) {
    user.name = updateData.name;
  }

  if (updateData.email !== undefined) {
    const emailChanged = updateData.email !== user.email;
    user.email = updateData.email;
    // Si se cambia el email, marcar como no verificado
    if (emailChanged) {
      user.emailVerified = false;
    }
  }

  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Cambia la contraseña del usuario
 * @param userId - ID del usuario
 * @param passwordData - Contraseña antigua y nueva
 * @returns Mensaje de éxito
 * @throws Error si el usuario no existe o la contraseña antigua es incorrecta
 */
export const changePassword = async (
  userId: number,
  passwordData: ChangePasswordDto
): Promise<void> => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Verificar contraseña antigua
  const isOldPasswordValid = await comparePassword(
    passwordData.oldPassword,
    user.passwordHash
  );

  if (!isOldPasswordValid) {
    const error = new Error("La contraseña actual es incorrecta");
    error.name = "UnauthorizedError";
    throw error;
  }

  // Validar que la nueva contraseña sea diferente
  const isSamePassword = await comparePassword(
    passwordData.newPassword,
    user.passwordHash
  );

  if (isSamePassword) {
    const error = new Error("La nueva contraseña debe ser diferente a la actual");
    error.name = "ValidationError";
    throw error;
  }

  // Hashear y guardar nueva contraseña
  const newPasswordHash = await hashPassword(passwordData.newPassword);
  user.passwordHash = newPasswordHash;
  await user.save();
};

/**
 * Cambia la URL del avatar del usuario
 * @param userId - ID del usuario
 * @param avatarData - URL del avatar
 * @returns Perfil actualizado del usuario
 * @throws Error si el usuario no existe
 */
export const changeAvatarUrl = async (
  userId: number,
  avatarData: ChangeAvatarDto
): Promise<UserProfileResponse> => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  user.avatarUrl = avatarData.avatarUrl || null;
  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

