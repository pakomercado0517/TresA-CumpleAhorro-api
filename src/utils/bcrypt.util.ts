import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Genera un hash de la contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compara una contraseña en texto plano con un hash
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado
 * @returns true si la contraseña coincide, false en caso contrario
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

