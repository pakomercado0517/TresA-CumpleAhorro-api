import { Sequelize, QueryTypes } from "sequelize";

import { env } from "../config/env.config";

/**
 * Crea la base de datos si no existe
 * Útil antes de ejecutar migrations
 */
export const createDatabaseIfNotExists = async (): Promise<void> => {
  const databaseUrl = env.DATABASE_URL;

  // Parsear la URL para obtener los datos de conexión
  const urlPattern = /^postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = databaseUrl.match(urlPattern);

  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }

  const [, , username, password, host, port, database] = match;

  // Conectar sin especificar la base de datos para poder crearla
  const sequelize = new Sequelize({
    dialect: "postgres",
    host,
    port: parseInt(port, 10),
    username,
    password,
    logging: false
  });

  try {
    // Verificar si la base de datos existe
    const result = await sequelize.query<Array<{ "?column?": number }>>(
      `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
      { type: QueryTypes.SELECT }
    );

    if (Array.isArray(result) && result.length === 0) {
      // Crear la base de datos
      await sequelize.query(`CREATE DATABASE "${database}"`);
      console.log(`✅ Base de datos "${database}" creada exitosamente`);
    } else {
      console.log(`ℹ️  La base de datos "${database}" ya existe`);
    }
  } catch (error) {
    console.error("❌ Error al crear la base de datos:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

