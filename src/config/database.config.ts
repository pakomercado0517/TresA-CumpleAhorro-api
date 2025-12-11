import { SequelizeOptions } from "sequelize-typescript";
import dotenv from "dotenv";

dotenv.config();

interface DatabaseConfig {
  development: SequelizeOptions;
  test: SequelizeOptions;
  production: SequelizeOptions;
}

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  return databaseUrl;
};

const parseDatabaseUrl = (url: string): SequelizeOptions => {
  // Formato: postgresql://user:password@host:port/database
  const urlPattern = /^postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error(
      "Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database"
    );
  }

  const [, , username, password, host, port, database] = match;

  return {
    dialect: "postgres",
    host,
    port: parseInt(port, 10),
    database,
    username,
    password,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
};

const databaseUrl = getDatabaseUrl();
const parsedConfig = parseDatabaseUrl(databaseUrl);

const config: DatabaseConfig = {
  development: {
    ...parsedConfig,
    logging: false
  },
  test: {
    ...parsedConfig,
    logging: false
  },
  production: {
    ...parsedConfig,
    logging: false
  }
};

export default config;
