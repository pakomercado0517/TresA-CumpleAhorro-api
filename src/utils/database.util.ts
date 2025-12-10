import { sequelize } from "../config/sequelize.config";

/**
 * Inicializa la conexión a la base de datos
 * @returns Promise que se resuelve cuando la conexión es exitosa
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente");
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    throw error;
  }
};

/**
 * Sincroniza los modelos con la base de datos
 * Solo usar en desarrollo, en producción usar migrations
 * @param force - Si es true, elimina y recrea las tablas
 */
export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Base de datos sincronizada${force ? " (forzada)" : ""}`);
  } catch (error) {
    console.error("❌ Error al sincronizar la base de datos:", error);
    throw error;
  }
};

/**
 * Cierra la conexión a la base de datos
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log("✅ Conexión a la base de datos cerrada");
  } catch (error) {
    console.error("❌ Error al cerrar la conexión:", error);
    throw error;
  }
};

