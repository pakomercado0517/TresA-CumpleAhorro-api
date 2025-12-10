import { User } from "../models/User";
import {
  RegisterUserDto,
  LoginUserDto,
  UserResponse,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto
} from "../types/auth.types";
import { hashPassword, comparePassword } from "../utils/bcrypt.util";
import {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifySpecialToken
} from "../utils/jwt.util";
import { sendAccountConfirmationEmail, sendPasswordResetEmail } from "./email-helper.service";

/**
 * Crea un nuevo usuario en el sistema
 * @param userData - Datos del usuario a crear
 * @returns Usuario creado sin la contraseña
 * @throws Error si el email ya existe
 */
export const createUser = async (userData: RegisterUserDto): Promise<UserResponse> => {
  // Verificar si el email ya existe
  const existingUser = await User.findOne({
    where: { email: userData.email }
  });

  if (existingUser) {
    const error = new Error("El email ya está registrado");
    error.name = "ConflictError";
    throw error;
  }

  // Hash de la contraseña
  const passwordHash = await hashPassword(userData.password);

  // Crear usuario primero (necesitamos el ID para generar el token)
  const user = await User.create({
    name: userData.name,
    email: userData.email,
    passwordHash,
    emailVerified: false,
    emailVerificationToken: null // Temporal, se actualizará después
  } as unknown as User);

  // Generar token de verificación con el ID real del usuario
  const emailVerificationToken = generateEmailVerificationToken(user.id, user.email);
  await user.update({ emailVerificationToken });

  // Enviar email de confirmación (no bloquea si falla)
  sendAccountConfirmationEmail(user.email, user.name, emailVerificationToken).catch((error) => {
    console.error("Error al enviar email de confirmación:", error);
  });

  // Retornar usuario sin la contraseña
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Autentica un usuario y retorna sus datos con token JWT
 * @param loginData - Datos de login (email y password)
 * @returns Usuario autenticado sin la contraseña y token JWT
 * @throws Error si las credenciales son inválidas
 */
export const authenticateUser = async (
  loginData: LoginUserDto
): Promise<{ user: UserResponse; token: string }> => {
  // Buscar usuario por email
  const user = await User.findOne({
    where: { email: loginData.email }
  });

  if (!user) {
    const error = new Error("Credenciales inválidas");
    error.name = "UnauthorizedError";
    throw error;
  }

  // Verificar contraseña
  const isPasswordValid = await comparePassword(loginData.password, user.passwordHash);

  if (!isPasswordValid) {
    const error = new Error("Credenciales inválidas");
    error.name = "UnauthorizedError";
    throw error;
  }

  // Generar token JWT
  const token = generateToken({
    userId: user.id,
    email: user.email
  });

  // Retornar usuario sin la contraseña y token
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    token
  };
};

/**
 * Verifica el email de un usuario usando el token de verificación
 * @param token - Token de verificación de email
 * @returns Mensaje de éxito
 * @throws Error si el token es inválido o el usuario no existe
 */
export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  // Verificar token
  const decoded = verifySpecialToken(token, "email-verification");

  // Buscar usuario
  const user = await User.findOne({
    where: {
      id: decoded.userId,
      email: decoded.email,
      emailVerificationToken: token
    }
  });

  if (!user) {
    const error = new Error("Token de verificación inválido o usuario no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Verificar si ya está verificado
  if (user.emailVerified) {
    return { message: "El email ya está verificado" };
  }

  // Marcar email como verificado y limpiar token
  await user.update({
    emailVerified: true,
    emailVerificationToken: null
  });

  return { message: "Email verificado exitosamente" };
};

/**
 * Solicita un reset de contraseña enviando un email con token
 * @param emailData - Email del usuario que solicita el reset
 * @returns Mensaje de éxito (siempre retorna éxito para no revelar si el email existe)
 */
export const requestPasswordReset = async (
  emailData: ForgotPasswordDto
): Promise<{ message: string }> => {
  // Buscar usuario por email
  const user = await User.findOne({
    where: { email: emailData.email }
  });

  // Siempre retornar éxito para no revelar si el email existe
  // Pero solo enviar email si el usuario existe
  if (user) {
    // Generar token de reset
    const resetToken = generatePasswordResetToken(user.id, user.email);

    // Guardar token y expiración (1 hora)
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    });

    // Enviar email de reset (no bloquea si falla)
    sendPasswordResetEmail(user.email, user.name, resetToken, 1).catch((error) => {
      console.error("Error al enviar email de reset:", error);
    });
  }

  return {
    message:
      "Si el email existe en nuestro sistema, recibirás un correo con instrucciones para restablecer tu contraseña"
  };
};

/**
 * Resetea la contraseña de un usuario usando el token de reset
 * @param resetData - Token y nueva contraseña
 * @returns Mensaje de éxito
 * @throws Error si el token es inválido, expirado o el usuario no existe
 */
export const resetPassword = async (resetData: ResetPasswordDto): Promise<{ message: string }> => {
  // Verificar token
  const decoded = verifySpecialToken(resetData.token, "password-reset");

  // Buscar usuario
  const user = await User.findOne({
    where: {
      id: decoded.userId,
      email: decoded.email,
      passwordResetToken: resetData.token
    }
  });

  if (!user) {
    const error = new Error("Token de reset inválido o usuario no encontrado");
    error.name = "NotFoundError";
    throw error;
  }

  // Verificar si el token expiró
  if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    const error = new Error("Token de reset expirado");
    error.name = "TokenExpiredError";
    throw error;
  }

  // Hash de la nueva contraseña
  const passwordHash = await hashPassword(resetData.password);

  // Actualizar contraseña y limpiar tokens
  await user.update({
    passwordHash,
    passwordResetToken: null,
    passwordResetExpires: null
  });

  return { message: "Contraseña restablecida exitosamente" };
};
